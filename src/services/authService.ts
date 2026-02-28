import { config } from '../config';
import { Session } from '../types';
import logger from '../utils/logger';

/**
 * Validate a session by calling the Auth microservice.
 * Fallback when session is not found in Redis cache.
 */
export async function validateSession(sessionId: string): Promise<Session | null> {
  try {
    const url = `${config.authServiceUrl}/sessions/validate`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
        'X-Internal-Service': 'api-gateway',
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    if (!response.ok) {
      logger.warn('Auth service rejected session', {
        sessionId,
        status: response.status,
      });
      return null;
    }

    const data = await response.json() as { session: Session };
    return data.session;
  } catch (error) {
    logger.error('Failed to validate session via auth service', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

/**
 * Invalidate a session by calling the Auth microservice.
 */
export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    const url = `${config.authServiceUrl}/sessions/${sessionId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api-gateway',
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to invalidate session via auth service', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}
