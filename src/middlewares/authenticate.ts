import { createHash } from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Session } from '../types';
import { config } from '../config';
import { getSession, setSession } from '../services/redisService';
import { validateAccessToken } from '../services/authService';
import logger from '../utils/logger';

/**
 * Authentication middleware.
 *
 * Flow:
 *  1. Extract access token from cookie or Bearer header
 *  2. Check Redis for cached auth context
 *  3. If not in Redis → call auth-service /api/v1/auth/me
 *  4. If auth-service confirms → cache in Redis, attach req.user
 *  5. If invalid → 401
 *
 * Public routes stay accessible anonymously, but optional auth context is attached
 * when a valid token is present.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Public routes remain accessible anonymously, but if a token is provided
  // we still resolve user context so downstream services can apply per-user filters.
  if (req.routeConfig?.public) {
    const optionalAccessToken = extractAccessToken(req);
    if (!optionalAccessToken) {
      return next();
    }

    const optionalSessionCacheKey = buildSessionCacheKey(optionalAccessToken);
    performOptionalAuth(optionalAccessToken, optionalSessionCacheKey, req, next);
    return;
  }

  // If route config says no auth required, skip
  if (req.routeConfig && !req.routeConfig.auth) {
    return next();
  }

  const accessToken = extractAccessToken(req);

  if (!accessToken) {
    res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. No access token found.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const sessionCacheKey = buildSessionCacheKey(accessToken);

  // Async auth flow
  performAuth(accessToken, sessionCacheKey, req, res, next).catch((error) => {
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

function performOptionalAuth(
  accessToken: string,
  sessionCacheKey: string,
  req: AuthenticatedRequest,
  next: NextFunction,
): void {
  performOptionalAuthInternal(accessToken, sessionCacheKey, req)
    .catch((error) => {
      logger.warn('Optional auth context could not be resolved for public route', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : error,
      });
    })
    .finally(() => next());
}

async function performOptionalAuthInternal(
  accessToken: string,
  sessionCacheKey: string,
  req: AuthenticatedRequest,
): Promise<void> {
  let session = await getSession(sessionCacheKey);

  if (!session) {
    session = await validateAccessToken(accessToken, {
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    });

    if (!session) {
      return;
    }

    await setSession(sessionCacheKey, session, computeSessionTtlSeconds(session));
  }

  attachUser(req, session);
}

async function performAuth(
  accessToken: string,
  sessionCacheKey: string,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Step 1: Check Redis for cached session
  let session = await getSession(sessionCacheKey);

  if (session) {
    logger.debug('Auth context found in Redis cache', {
      requestId: req.requestId,
      userId: session.userId,
    });
    attachUser(req, session);
    return next();
  }

  // Step 2: Fallback to auth-service
  logger.debug('Auth context not in Redis, calling auth service', {
    requestId: req.requestId,
  });

  session = await validateAccessToken(accessToken, {
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
  });

  if (!session) {
    res.status(401).json({
      status: 401,
      code: 'TOKEN_INVALID',
      message: 'Access token is invalid or expired.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Step 3: Cache the validated auth context in Redis
  await setSession(sessionCacheKey, session, computeSessionTtlSeconds(session));

  logger.debug('Access token validated by auth service, cached in Redis', {
    requestId: req.requestId,
    userId: session.userId,
  });

  attachUser(req, session);
  next();
}

function extractAccessToken(req: AuthenticatedRequest): string | null {
  const tokenFromCookie = req.cookies?.[config.authTokenCookieName] as string | undefined;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return null;
}

function buildSessionCacheKey(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('hex');
}

function computeSessionTtlSeconds(session: Session): number {
  const expiryMs = Date.parse(session.expiresAt);
  if (Number.isNaN(expiryMs)) {
    return config.sessionTtlSeconds;
  }

  const ttlSeconds = Math.floor((expiryMs - Date.now()) / 1000);
  return ttlSeconds > 0 ? ttlSeconds : 1;
}

function attachUser(req: AuthenticatedRequest, session: Session): void {
  req.session = session;
  req.user = {
    userId: session.userId,
    email: session.email,
    roles: session.roles,
    permissions: session.permissions,
  };
}
