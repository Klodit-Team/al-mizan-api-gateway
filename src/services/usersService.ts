import { config } from '../config';
import { Role } from '../types';
import logger from '../utils/logger';

/**
 * Fetch user roles from the Users microservice.
 * Fallback when roles are not found in Redis cache.
 */
export async function fetchUserRoles(userId: string): Promise<Role[] | null> {
  try {
    const url = `${config.usersServiceUrl}/api/v1/user-roles/${userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api-gateway',
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    if (!response.ok) {
      logger.warn('Users service failed to return roles', {
        userId,
        status: response.status,
      });
      return null;
    }

    const data = await response.json() as Array<{
      role?: {
        name?: string;
      };
    }>;

    if (!Array.isArray(data)) {
      return null;
    }

    const roles = data
      .map((item) => item.role?.name)
      .filter((name): name is Role => !!name && Object.values(Role).includes(name as Role));

    return roles;
  } catch (error) {
    logger.error('Failed to fetch user roles from users service', {
      userId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

/**
 * Fetch user permissions (fine-grained) from the Users microservice.
 */
export async function fetchUserPermissions(userId: string): Promise<string[] | null> {
  try {
    const url = `${config.usersServiceUrl}/api/v1/user-roles/${userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api-gateway',
      },
      signal: AbortSignal.timeout(config.requestTimeout),
    });

    if (!response.ok) {
      return null;
    }

    // Users service does not currently expose fine-grained permissions.
    // Return an empty array to keep auth flow consistent.
    return [];
  } catch (error) {
    logger.error('Failed to fetch user permissions from users service', {
      userId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}
