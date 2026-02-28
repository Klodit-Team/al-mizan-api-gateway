import { routesConfig } from '../config/routes';
import { RouteConfig, Role } from '../types';
import logger from '../utils/logger';

/**
 * Load and parse the route configuration from routes.ts.
 */
export function loadRoutes(): { prefix: string; routes: RouteConfig[] } {
  const config = routesConfig;

  if (!config?.gateway || !config?.services) {
    throw new Error('Invalid routes config: missing gateway or services section');
  }

  const prefix = `${config.gateway.prefix}/${config.gateway.version}`;
  const routes: RouteConfig[] = [];

  // Build route configs from each service
  for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
    const basePath = `${prefix}${serviceConfig.path}`;
    const targetUrl = serviceConfig.url;

    // Default catch-all route for the service
    const defaultRoute: RouteConfig = {
      path: basePath,
      target: targetUrl,
      auth: serviceConfig.auth ?? true,
      roles: (serviceConfig.roles as Role[]) || [],
      public: serviceConfig.public ?? false,
      rateLimit: serviceConfig.rateLimit,
      pathRewrite: serviceConfig.pathRewrite,
      description: serviceConfig.description || serviceName,
    };

    routes.push(defaultRoute);

    // Per-endpoint overrides
    if (serviceConfig.routes) {
      for (const route of serviceConfig.routes) {
        const routePath = `${basePath}${route.path}`;
        routes.push({
          path: routePath,
          target: targetUrl,
          auth: route.auth ?? serviceConfig.auth ?? true,
          roles: (route.roles as Role[]) || (serviceConfig.roles as Role[]) || [],
          public: route.public ?? serviceConfig.public ?? false,
          rateLimit: serviceConfig.rateLimit,
          methods: route.method ? [route.method] : undefined,
          description: route.description || `${serviceName}:${route.path}`,
        });
      }
    }

    logger.info(`Loaded service route: ${serviceName} → ${basePath} → ${targetUrl}`);
  }

  logger.info(`Total routes loaded: ${routes.length}`);
  return { prefix, routes };
}
