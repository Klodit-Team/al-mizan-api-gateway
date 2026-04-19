import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import {
  requestIdMiddleware,
  globalRateLimiter,
  errorHandler,
  notFoundHandler,
} from './middlewares';
import { createProxyRouter } from './proxy/proxyRouter';
import logger from './utils/logger';
import { HealthStatus } from './types';
import { getRedisClient } from './config/redis';
import { getRabbitMQChannel } from './config/rabbitmq';
import { registerSwagger } from './docs/swagger';

export function createApp(): express.Application {
  const app = express();
  const allowedOrigins = new Set(config.corsOrigins);

  // ─── Trust proxy (for X-Forwarded-For, needed behind nginx/k8s) ──────────
  app.set('trust proxy', 1);

  // ─── Security Headers ────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Gateway proxies, not serves HTML
    crossOriginEmbedderPolicy: false,
  }));

  // ─── CORS ────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header).
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost/127.0.0.1 on any port for local FE dev.
      if (config.nodeEnv !== 'production') {
        try {
          const parsed = new URL(origin);
          const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
          if (isLocalhost && parsed.protocol === 'http:') {
            return callback(null, true);
          }
        } catch {
          // Fall through to blocked origin.
        }
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Session-Id',
    ],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining'],
  }));

  // ─── Cookie Parser ───────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── Body Parsers (required for proxy body augmentation) ────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Request ID ──────────────────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ─── HTTP Request Logging ────────────────────────────────────────────────
  app.use(morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    },
  ));

  // ─── Global Rate Limiter ─────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── Root Endpoint ────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'AL-Mizan API Gateway',
      status: 'ok',
      endpoints: {
        health: '/health',
        readiness: '/ready',
        docs: '/docs',
        openapi: '/docs.json',
        apiBase: '/api/v1',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ─── Health Check Endpoint ───────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let rabbitmqStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      const redis = getRedisClient();
      redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    try {
      rabbitmqStatus = getRabbitMQChannel() ? 'connected' : 'disconnected';
    } catch {
      rabbitmqStatus = 'disconnected';
    }

    const health: HealthStatus = {
      status: redisStatus === 'connected' && rabbitmqStatus === 'connected'
        ? 'healthy'
        : redisStatus === 'connected' || rabbitmqStatus === 'connected'
          ? 'degraded'
          : 'unhealthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
        rabbitmq: rabbitmqStatus,
      },
    };

    const httpStatus = health.status === 'unhealthy' ? 503 : 200;
    res.status(httpStatus).json(health);
  });

  // ─── Readiness Check ─────────────────────────────────────────────────────
  app.get('/ready', (_req, res) => {
    res.status(200).json({ ready: true });
  });

  // ─── Swagger / OpenAPI Documentation ────────────────────────────────────
  registerSwagger(app);

  // ─── Proxy Router (all microservice routes) ──────────────────────────────
  app.use(createProxyRouter());

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global Error Handler ────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
