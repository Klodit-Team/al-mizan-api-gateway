import dotenv from 'dotenv';

dotenv.config();

function env(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function envInt(key: string, defaultValue?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) return parseInt(raw, 10);
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
}

function envBool(key: string, defaultValue?: boolean): boolean {
  const raw = process.env[key];
  if (raw !== undefined) return raw === 'true' || raw === '1';
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  // ─── Server ────────────────────────────────────────────────────────
  port: envInt('PORT', 3000),
  nodeEnv: env('NODE_ENV', 'development'),

  // ─── Redis ─────────────────────────────────────────────────────────
  redisUrl: env('REDIS_URL', 'redis://localhost:6379'),

  // ─── RabbitMQ ──────────────────────────────────────────────────────
  rabbitmqUrl: env('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
  rabbitmqAuditExchange: env('RABBITMQ_AUDIT_EXCHANGE', 'audit.events'),
  rabbitmqAuditQueue: env('RABBITMQ_AUDIT_QUEUE', 'audit.action.log'),
  rabbitmqAuditRoutingKey: env('RABBITMQ_AUDIT_ROUTING_KEY', 'audit.action.log'),

  // ─── Microservice URLs ─────────────────────────────────────────────
  authServiceUrl: env('AUTH_SERVICE_URL', 'http://localhost:3001'),
  usersServiceUrl: env('USERS_SERVICE_URL', 'http://localhost:3002'),
  tendersServiceUrl: env('TENDERS_SERVICE_URL', 'http://localhost:8003'),
  submissionsServiceUrl: env('SUBMISSIONS_SERVICE_URL', 'http://localhost:8004'),
  documentsServiceUrl: env('DOCUMENTS_SERVICE_URL', 'http://localhost:8005'),
  commissionsServiceUrl: env('COMMISSIONS_SERVICE_URL', 'http://localhost:8007'),
  evaluationsServiceUrl: env('EVALUATIONS_SERVICE_URL', 'http://localhost:8008'),
  appealsServiceUrl: env('APPEALS_SERVICE_URL', 'http://localhost:8009'),
  notificationsServiceUrl: env('NOTIFICATIONS_SERVICE_URL', 'http://localhost:8010'),
  auditServiceUrl: env('AUDIT_SERVICE_URL', 'http://localhost:3009'),

  // ─── Session ───────────────────────────────────────────────────────
  authTokenCookieName: env('AUTH_TOKEN_COOKIE_NAME', 'access_token'),
  sessionCookieName: env('SESSION_COOKIE_NAME', 'al_mizan_sid'),
  sessionTtlSeconds: envInt('SESSION_TTL_SECONDS', 3600), // 1 hour
  permissionsTtlSeconds: envInt('PERMISSIONS_TTL_SECONDS', 300), // 5 minutes

  // ─── Rate Limiting ─────────────────────────────────────────────────
  rateLimitWindowMs: envInt('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
  rateLimitMax: envInt('RATE_LIMIT_MAX', 100),

  // ─── CORS ──────────────────────────────────────────────────────────
  corsOrigins: env('CORS_ORIGINS', 'http://localhost:3000,http://localhost:4000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // ─── Logging ───────────────────────────────────────────────────────
  logLevel: env('LOG_LEVEL', 'info'),

  // ─── Cookie Security ───────────────────────────────────────────────
  cookieSecure: envBool('COOKIE_SECURE', false),
  cookieSameSite: env('COOKIE_SAMESITE', 'strict') as 'strict' | 'lax' | 'none',

  // ─── Request ───────────────────────────────────────────────────────
  requestTimeout: envInt('REQUEST_TIMEOUT_MS', 30000), // 30 seconds
};
