import { config } from '../config';
import { Session } from '../types';
import logger from '../utils/logger';

interface AuthMeResponse {
  user?: {
    userId?: string;
    email?: string;
    iat?: number;
    exp?: number;
  };
}

interface TokenValidationContext {
  ip?: string;
  userAgent?: string;
}

/**
 * Validate an access token by calling the Auth microservice.
 * Fallback when auth context is not found in Redis cache.
 */
export async function validateAccessToken(
  accessToken: string,
  context?: TokenValidationContext,
): Promise<Session | null> {
  try {
    const url = `${config.authServiceUrl}/api/v1/auth/me`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api-gateway',
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${config.authTokenCookieName}=${encodeURIComponent(accessToken)}`,
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    if (!response.ok) {
      logger.warn('Auth service rejected access token', {
        status: response.status,
      });
      return null;
    }

    const data = await response.json() as AuthMeResponse;
    const user = data.user;

    if (!user?.userId || !user.email) {
      logger.warn('Auth service returned malformed identity payload');
      return null;
    }

    const now = Date.now();
    const createdAt = user.iat
      ? new Date(user.iat * 1000).toISOString()
      : new Date(now).toISOString();

    const expiresAt = user.exp
      ? new Date(user.exp * 1000).toISOString()
      : new Date(now + (config.sessionTtlSeconds * 1000)).toISOString();

    return {
      userId: user.userId,
      email: user.email,
      roles: [],
      permissions: [],
      ip: context?.ip || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      createdAt,
      expiresAt,
    };
  } catch (error) {
    logger.error('Failed to validate access token via auth service', {
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

/**
 * Invalidate an access token by calling the Auth microservice logout endpoint.
 */
export async function invalidateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const url = `${config.authServiceUrl}/api/v1/auth/logout`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api-gateway',
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${config.authTokenCookieName}=${encodeURIComponent(accessToken)}`,
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to invalidate access token via auth service', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}
