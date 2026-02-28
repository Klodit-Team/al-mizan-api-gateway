import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types';
import { getUserRoles, setUserRoles } from '../services/redisService';
import { fetchUserRoles } from '../services/usersService';
import logger from '../utils/logger';

/**
 * Authorization middleware (RBAC).
 *
 * Flow:
 *  1. Read allowed roles from the matched route config
 *  2. If no roles specified → any authenticated user passes
 *  3. Check Redis for cached roles
 *  4. If not in Redis → call users-service /users/{id}/roles
 *  5. Cache the result, check membership → 403 if unauthorized
 */
export function authorize(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // If route is public or no auth required, skip authorization
  if (req.routeConfig?.public || !req.routeConfig?.auth) {
    return next();
  }

  const allowedRoles = req.routeConfig?.roles;

  // No roles restriction → any authenticated user passes
  if (!allowedRoles || allowedRoles.length === 0) {
    return next();
  }

  // Must have a user attached by authenticate middleware
  if (!req.user) {
    res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required before authorization.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Async authz flow
  performAuthz(req, res, next, allowedRoles).catch((error) => {
    logger.error('Unexpected error in authorization', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      status: 500,
      code: 'AUTHZ_ERROR',
      message: 'Internal authorization error.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  });
}

async function performAuthz(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  allowedRoles: Role[],
): Promise<void> {
  const userId = req.user!.userId;

  // Step 1: Try roles from session (already attached by auth middleware)
  let userRoles = req.user!.roles;

  // Step 2: If session had no roles, check Redis cache
  if (!userRoles || userRoles.length === 0) {
    userRoles = (await getUserRoles(userId)) ?? [];
  }

  // Step 3: If still no roles, fetch from users-service
  if (!userRoles || userRoles.length === 0) {
    logger.debug('Roles not cached, fetching from users service', {
      requestId: req.requestId,
      userId,
    });

    const fetchedRoles = await fetchUserRoles(userId);
    if (fetchedRoles) {
      userRoles = fetchedRoles;
      // Cache in Redis for subsequent requests
      await setUserRoles(userId, fetchedRoles);
    }
  }

  // Step 4: Check if user has at least one allowed role
  const hasRole = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    logger.warn('Access denied: insufficient roles', {
      requestId: req.requestId,
      userId,
      userRoles,
      requiredRoles: allowedRoles,
      path: req.path,
    });

    res.status(403).json({
      status: 403,
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Update req.user with the resolved roles
  req.user!.roles = userRoles;
  next();
}
