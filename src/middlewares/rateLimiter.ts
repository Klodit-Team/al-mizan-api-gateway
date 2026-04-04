import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config';

/**
 * Global rate limiter.
 * Per-route overrides can be configured in routes.yaml.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a reverse proxy, otherwise use IP
    const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim();

    if (forwardedFor) {
      return forwardedFor;
    }

    return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
});

/**
 * Create a per-route rate limiter with custom max requests.
 */
export function createRouteLimiter(maxRequests: number) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to this endpoint. Please try again later.',
    },
    keyGenerator: (req) => {
      const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim();

      if (forwardedFor) {
        return forwardedFor;
      }

      return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
    },
  });
}
