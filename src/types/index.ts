import { Request } from 'express';

// ─── RBAC Roles (from AL-Mizan spec) ────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  SERVICE_CONTRACTANT = 'SERVICE_CONTRACTANT',
  OPERATEUR_ECONOMIQUE = 'OPERATEUR_ECONOMIQUE',
  MEMBRE_COMMISSION = 'MEMBRE_COMMISSION',
  CONTROLEUR = 'CONTROLEUR',
  PUBLIC = 'PUBLIC',
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  userId: string;
  email: string;
  roles: Role[];
  permissions: string[];
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

// ─── Authenticated Request ───────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  requestId?: string;
  session?: Session;
  user?: {
    userId: string;
    email: string;
    roles: Role[];
    permissions: string[];
  };
  routeConfig?: RouteConfig;
}

// ─── Route Configuration (from routes.ts) ───────────────────────────────────

export interface RouteConfig {
  /** URL path pattern, e.g. /api/v1/auth */
  path: string;
  /** Target microservice base URL */
  target: string;
  /** Whether authentication is required (default: true) */
  auth: boolean;
  /** Allowed roles. Empty array = any authenticated user */
  roles: Role[];
  /** Whether the route is publicly accessible without auth */
  public: boolean;
  /** Optional per-route rate limit override (requests per window) */
  rateLimit?: number;
  /** Optional path rewrite rules */
  pathRewrite?: Record<string, string>;
  /** Forward authenticated user context in JSON body for downstream permission checks */
  forwardAuthInBody?: boolean;
  /** HTTP methods allowed (empty = all) */
  methods?: string[];
  /** Description for documentation */
  description?: string;
}

// ─── Routes Config Schema ────────────────────────────────────────────────────

export interface RoutesConfig {
  gateway: {
    prefix: string;
    version: string;
  };
  services: Record<string, ServiceConfig>;
}

export interface ServiceConfig {
  url: string;
  path: string;
  auth: boolean;
  public?: boolean;
  roles?: string[];
  rateLimit?: number;
  pathRewrite?: Record<string, string>;
  forwardAuthInBody?: boolean;
  routes?: ServiceRouteOverride[];
  description?: string;
}

export interface ServiceRouteOverride {
  path: string;
  method: string;
  auth: boolean;
  public?: boolean;
  roles?: string[];
  forwardAuthInBody?: boolean;
  description?: string;
}

// ─── Audit Event (published to RabbitMQ) ─────────────────────────────────────

export interface AuditEvent {
  requestId: string;
  userId: string | null;
  email: string | null;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  userAgent: string;
  timestamp: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

// ─── Health Check ────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    redis: 'connected' | 'disconnected';
    rabbitmq: 'connected' | 'disconnected';
  };
}

// ─── Error Response ──────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  timestamp: string;
}
