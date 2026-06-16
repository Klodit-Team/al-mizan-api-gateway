import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuditEvent } from '../types';
import { publishAuditEvent } from '../services/auditPublisher';
import logger from '../utils/logger';

/**
 * Audit logging middleware.
 *
 * Captures request metadata and publishes an audit event to RabbitMQ
 * after the response is sent. This is fire-and-forget to avoid
 * blocking the response.
 */
export function auditLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  // Hook into response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const auditEvent: AuditEvent = {
      user_id: req.user?.userId || null,
      action: deriveAction(req.method, req.originalUrl),
      entite: 'api-gateway',
      details: JSON.stringify({
        requestId: req.requestId || 'unknown',
        email: req.user?.email || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        metadata: {
          contentLength: res.getHeader('content-length'),
          routeService: req.routeConfig?.path,
        },
      }),
      ip_address: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      horodatage: new Date().toISOString(),
    };

    // Fire-and-forget: publish to RabbitMQ
    publishAuditEvent(auditEvent).catch((error) => {
      logger.error('Failed to publish audit event', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : error,
      });
    });
  });

  next();
}

/**
 * Derive a human-readable action name from HTTP method + path.
 */
function deriveAction(method: string, path: string): string {
  const cleanPath = path.split('?')[0]; // Remove query params
  const segments = cleanPath.split('/').filter(Boolean);

  // Build action like "POST /api/v1/tenders" → "CREATE_TENDER"
  const actionMap: Record<string, string> = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
  };

  const verb = actionMap[method.toUpperCase()] || method.toUpperCase();
  const resource = segments[segments.length - 1] || 'ROOT';

  return `${verb}_${resource.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}
