import { config } from '../config';
import { Role, Session } from '../types';
import logger from '../utils/logger';

interface AuthMeResponse {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  userType?: string;
  iat?: number;
  exp?: number;
  user?: {
    userId?: string;
    id?: string;
    email?: string;
    iat?: number;
    exp?: number;
    role?: string;
    userType?: string;
  };
}

interface TokenValidationContext {
  ip?: string;
  userAgent?: string;
}

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (normalized === 'ADMIN') return Role.ADMIN;
  if (
    normalized === 'SERVICE_CONTRACTANT'
    || normalized === 'CONTRACTANT'
    || normalized === 'SERVICECONTRACTANT'
  ) {
    return Role.SERVICE_CONTRACTANT;
  }
  if (
    normalized === 'OPERATEUR_ECONOMIQUE'
    || normalized === 'OPERATEUR'
    || normalized === 'OPERATEURECONOMIQUE'
    || (normalized.includes('OPERATEUR') && normalized.includes('ECONOM'))
  ) {
    return Role.OPERATEUR_ECONOMIQUE;
  }
  if (normalized === 'MEMBRE_COMMISSION') return Role.MEMBRE_COMMISSION;
  if (normalized === 'CONTROLEUR') return Role.CONTROLEUR;

  return null;
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
    const user = data.user || data;
    const userId = user.userId || user.id;

    if (!userId || !user.email) {
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

    const resolvedRole = normalizeRole(user.role) ?? normalizeRole(user.userType);

    return {
      userId: userId,
      email: user.email,
      roles: resolvedRole ? [resolvedRole] : [],
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