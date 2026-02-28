import { getRedisClient } from '../config/redis';
import { Session, Role } from '../types';
import logger from '../utils/logger';
import { config } from '../config';

const SESSION_PREFIX = 'session:';
const PERMISSIONS_PREFIX = 'permissions:';

// ─── Session Operations ──────────────────────────────────────────────────────

/**
 * Retrieve a session from Redis by session ID.
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session: Session = JSON.parse(data);

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      await deleteSession(sessionId);
      return null;
    }

    return session;
  } catch (error) {
    logger.error('Failed to get session from Redis', { sessionId, error });
    return null;
  }
}

/**
 * Store session in Redis with TTL.
 */
export async function setSession(
  sessionId: string,
  session: Session,
  ttl?: number,
): Promise<void> {
  try {
    const redis = getRedisClient();
    const effectiveTtl = ttl ?? config.sessionTtlSeconds;
    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      effectiveTtl,
      JSON.stringify(session),
    );
    logger.debug('Session cached in Redis', { sessionId, userId: session.userId });
  } catch (error) {
    logger.error('Failed to set session in Redis', { sessionId, error });
  }
}

/**
 * Delete session from Redis (logout, expiry).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
    logger.debug('Session deleted from Redis', { sessionId });
  } catch (error) {
    logger.error('Failed to delete session from Redis', { sessionId, error });
  }
}

// ─── Permissions / Roles Operations ──────────────────────────────────────────

/**
 * Retrieve cached roles for a user.
 */
export async function getUserRoles(userId: string): Promise<Role[] | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(`${PERMISSIONS_PREFIX}${userId}`);
    if (!data) return null;
    return JSON.parse(data) as Role[];
  } catch (error) {
    logger.error('Failed to get permissions from Redis', { userId, error });
    return null;
  }
}

/**
 * Cache user roles in Redis with TTL.
 */
export async function setUserRoles(
  userId: string,
  roles: Role[],
  ttl?: number,
): Promise<void> {
  try {
    const redis = getRedisClient();
    const effectiveTtl = ttl ?? config.permissionsTtlSeconds;
    await redis.setex(
      `${PERMISSIONS_PREFIX}${userId}`,
      effectiveTtl,
      JSON.stringify(roles),
    );
    logger.debug('User roles cached in Redis', { userId, roles });
  } catch (error) {
    logger.error('Failed to set permissions in Redis', { userId, error });
  }
}

/**
 * Invalidate cached roles for a user.
 */
export async function deleteUserRoles(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`${PERMISSIONS_PREFIX}${userId}`);
  } catch (error) {
    logger.error('Failed to delete user roles from Redis', { userId, error });
  }
}
