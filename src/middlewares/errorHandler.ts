import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Global error handler middleware.
 * Must be registered last in the middleware chain.
 */
export function errorHandler(
  err: Error & { status?: number; code?: string },
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error('Unhandled error', {
    requestId: (req as AuthenticatedRequest).requestId,
    status,
    code,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(status).json({
    status,
    code,
    message: status === 500
      ? 'An internal server error occurred.'
      : err.message,
    requestId: (req as AuthenticatedRequest).requestId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    status: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    requestId: (req as AuthenticatedRequest).requestId,
    timestamp: new Date().toISOString(),
  });
}
