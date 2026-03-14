import { Router, Request, Response, NextFunction } from 'express';
import { IncomingMessage } from 'http';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { loadRoutes } from './loadRoutes';
import { AuthenticatedRequest, RouteConfig, Role } from '../types';
import {
  authenticate,
  authorize,
  auditLogger,
  createRouteLimiter,
} from '../middlewares';
import logger from '../utils/logger';
import { config } from '../config';

/**
 * Build an Express Router with dynamic proxy routes from routes.ts.
 *
 * For each service defined in routes.yaml:
 *  1. Creates a route-specific rate limiter (if configured)
 *  2. Attaches route config to the request
 *  3. Applies: authenticate → authorize → auditLogger → proxy
 */
export function createProxyRouter(): Router {
  const router = Router();
  const { routes } = loadRoutes();

  // Group routes by base service path (deduplicate proxies)
  const serviceRoutes = new Map<string, RouteConfig>();

  for (const route of routes) {
    // Register per-endpoint route config attachers for specific routes
    if (route.methods && route.methods.length > 0) {
      for (const method of route.methods) {
        registerEndpointMiddleware(router, route, method.toLowerCase());
      }
    }

    // Collect base service routes for proxy setup
    // Only keep the first (default) entry per service path
    if (!route.methods) {
      serviceRoutes.set(route.path, route);
    }
  }

  // Set up proxies for each service base path
  for (const [basePath, route] of serviceRoutes) {
    const rewritePath = (path: string, req: IncomingMessage): string => {
      let rewrittenPath = (req as AuthenticatedRequest).originalUrl || path;

      if (route.pathRewrite) {
        for (const [pattern, replacement] of Object.entries(route.pathRewrite)) {
          rewrittenPath = rewrittenPath.replace(new RegExp(pattern), replacement);
        }
      }

      return rewrittenPath;
    };

    const proxyOptions: Options = {
      target: route.target,
      changeOrigin: true,
      pathRewrite: rewritePath,
      timeout: config.requestTimeout,
      proxyTimeout: config.requestTimeout,
      on: {
        proxyReq: (proxyReq, req) => {
          const authReq = req as AuthenticatedRequest;
          const forwardedPath = rewritePath(req.url ?? '', req);
          const forwardedUrl = new URL(forwardedPath, route.target).toString();

          logger.info('Proxy forwarding request', {
            requestId: authReq.requestId,
            method: req.method,
            originalUrl: authReq.originalUrl,
            forwardedUrl,
            target: route.target,
          });

          // Forward user info to downstream services
          if (authReq.user) {
            proxyReq.setHeader('X-User-Id', authReq.user.userId);
            proxyReq.setHeader('X-User-Email', authReq.user.email);
            proxyReq.setHeader('X-User-Roles', authReq.user.roles.join(','));
          }
          if (authReq.requestId) {
            proxyReq.setHeader('X-Request-Id', authReq.requestId);
          }
          proxyReq.setHeader('X-Forwarded-By', 'al-mizan-api-gateway');
        },
        proxyRes: (_proxyRes, req) => {
          const authReq = req as AuthenticatedRequest;
          logger.debug('Proxy response received', {
            requestId: authReq.requestId,
            target: route.target,
            path: authReq.originalUrl,
            status: _proxyRes.statusCode,
          });
        },
        error: (err, req, res) => {
          const authReq = req as AuthenticatedRequest;
          logger.error('Proxy error', {
            requestId: authReq.requestId,
            target: route.target,
            path: authReq.originalUrl,
            error: err.message,
          });

          if ('writeHead' in res && typeof res.writeHead === 'function') {
            (res as Response).status(502).json({
              status: 502,
              code: 'BAD_GATEWAY',
              message: `Service unavailable: ${route.description || basePath}`,
              requestId: authReq.requestId,
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
    };

    // Build middleware chain for this service
    const middlewareChain: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

    // 1. Attach default route config
    middlewareChain.push((req: Request, _res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      // If a per-endpoint middleware hasn't already set the routeConfig, use the default
      if (!authReq.routeConfig) {
        authReq.routeConfig = route;
      }
      next();
    });

    // 2. Per-route rate limiter
    if (route.rateLimit) {
      middlewareChain.push(createRouteLimiter(route.rateLimit) as any);
    }

    // 3. Authentication
    middlewareChain.push(authenticate as any);

    // 4. Authorization
    middlewareChain.push(authorize as any);

    // 5. Audit logging
    middlewareChain.push(auditLogger as any);

    // 6. Proxy
    const proxyMiddleware = createProxyMiddleware(proxyOptions);

    logger.info(`Proxy registered: ${basePath}/** → ${route.target}`);

    router.use(
      basePath,
      ...middlewareChain,
      proxyMiddleware,
    );
  }

  return router;
}

/**
 * Register per-endpoint middleware that overrides the route config
 * for specific method+path combinations (from routes.yaml overrides).
 */
function registerEndpointMiddleware(
  router: Router,
  route: RouteConfig,
  method: string,
): void {
  const handler = (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).routeConfig = route;
    next();
  };

  switch (method) {
    case 'get':
      router.get(route.path, handler);
      break;
    case 'post':
      router.post(route.path, handler);
      break;
    case 'put':
      router.put(route.path, handler);
      break;
    case 'patch':
      router.patch(route.path, handler);
      break;
    case 'delete':
      router.delete(route.path, handler);
      break;
    default:
      router.all(route.path, handler);
  }
}
