import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';

/**
 * Attach a unique request ID to every incoming request.
 * Uses X-Request-Id header if provided (e.g. from load balancer),
 * otherwise generates a new UUID v4.
 */
export function requestIdMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  _res.setHeader('X-Request-Id', req.requestId);
  next();
}
