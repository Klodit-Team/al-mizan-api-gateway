import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';
import { getSession, setSession } from '../services/redisService';
import { validateSession } from '../services/authService';
import logger from '../utils/logger';

/**
 * Authentication middleware.
 *
 * Flow:
 *  1. Extract session cookie (al_mizan_sid)
 *  2. Check Redis for cached session
 *  3. If not in Redis → call auth-service /sessions/validate
 *  4. If auth-service confirms → cache in Redis, attach req.user
 *  5. If invalid → 401
 *
 * Routes marked as public skip authentication.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Skip auth for routes marked public
  if (req.routeConfig?.public) {
    return next();
  }

  // If route config says no auth required, skip
  if (req.routeConfig && !req.routeConfig.auth) {
    return next();
  }

  const sessionId = req.cookies?.[config.sessionCookieName];

  if (!sessionId) {
    res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. No session cookie found.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Async auth flow
  performAuth(sessionId, req, res, next).catch((error) => {
    logger.error('Unexpected error in authentication', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      status: 500,
      code: 'AUTH_ERROR',
      message: 'Internal authentication error.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  });
}

async function performAuth(
  sessionId: string,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Step 1: Check Redis for cached session
  let session = await getSession(sessionId);

  if (session) {
    logger.debug('Session found in Redis cache', {
      requestId: req.requestId,
      userId: session.userId,
    });
    attachUser(req, session);
    return next();
  }

  // Step 2: Fallback to auth-service
  logger.debug('Session not in Redis, calling auth service', {
    requestId: req.requestId,
  });

  session = await validateSession(sessionId);

  if (!session) {
    res.status(401).json({
      status: 401,
      code: 'SESSION_INVALID',
      message: 'Session is invalid or expired.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Step 3: Cache the validated session in Redis
  await setSession(sessionId, session);

  logger.debug('Session validated by auth service, cached in Redis', {
    requestId: req.requestId,
    userId: session.userId,
  });

  attachUser(req, session);
  next();
}

function attachUser(req: AuthenticatedRequest, session: import('../types').Session): void {
  req.session = session;
  req.user = {
    userId: session.userId,
    email: session.email,
    roles: session.roles,
    permissions: session.permissions,
  };
}
