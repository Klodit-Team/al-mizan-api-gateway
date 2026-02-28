import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

let redis: Redis;

export function createRedisClient(): Redis {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 500, 5000);
      logger.warn(`Redis connection retry #${times}, next attempt in ${delay}ms`);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redis;
}

export function getRedisClient(): Redis {
  if (!redis) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  if (!redis) {
    createRedisClient();
  }
  try {
    await redis.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Don't throw — gateway can start in degraded mode
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    logger.info('Redis disconnected gracefully');
  }
}
