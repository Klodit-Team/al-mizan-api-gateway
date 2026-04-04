import type { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { config } from '../config';
import { routesConfig } from '../config/routes';

function toOpenApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function inferPathParameters(path: string): OpenAPIV3.ParameterObject[] {
  const matches = [...path.matchAll(/\{([A-Za-z0-9_]+)\}/g)];
  return matches.map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

export function buildGatewayOpenApiSpec(): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      title: 'AL-Mizan API Gateway',
      version: '1.0.0',
      description: 'Public API contract exposed by the API Gateway. Endpoints are proxied to downstream microservices.',
    },
    servers: [
      {
        url: `${routesConfig.gateway.prefix}/${routesConfig.gateway.version}`,
      },
    ],
    tags: [],
    paths: {},
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: config.authTokenCookieName,
          description: 'Access token cookie set by auth service',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token sent as Authorization: Bearer <token>',
        },
      },
    },
  };

  for (const [serviceName, service] of Object.entries(routesConfig.services)) {
    spec.tags?.push({
      name: serviceName,
      description: service.description,
    });

    // Paths must be relative to the server URL to avoid duplicated prefixes
    // in generated curl examples (server already includes /api/v1).
    const basePath = service.path;

    for (const route of service.routes || []) {
      const fullPath = toOpenApiPath(`${basePath}${route.path}`);
      const method = route.method.toLowerCase() as OpenAPIV3.HttpMethods;

      if (!spec.paths[fullPath]) {
        spec.paths[fullPath] = {};
      }

      const shouldAuth = (route.public ?? false) ? false : (route.auth ?? service.auth ?? true);

      (spec.paths[fullPath] as OpenAPIV3.PathItemObject)[method] = {
        tags: [serviceName],
        summary: route.description || `${serviceName} ${route.method} ${route.path}`,
        operationId: `${serviceName}_${route.method.toLowerCase()}_${route.path
          .replace(/^\//, '')
          .replace(/[/:{}-]+/g, '_')}`,
        parameters: inferPathParameters(fullPath),
        security: shouldAuth ? [{ cookieAuth: [] }, { bearerAuth: [] }] : [],
        responses: {
          '200': {
            description: 'Successful response from downstream service',
          },
          '401': {
            description: 'Unauthorized',
          },
          '403': {
            description: 'Forbidden',
          },
          '429': {
            description: 'Rate limit exceeded',
          },
          '502': {
            description: 'Downstream service unavailable',
          },
        },
      };
    }
  }

  return spec;
}

export function registerSwagger(app: Application): void {
  const spec = buildGatewayOpenApiSpec();

  app.get('/docs.json', (_req, res) => {
    res.json(spec);
  });

  app.use(
    '/docs',
    ...swaggerUi.serve,
    swaggerUi.setup(spec, {
      explorer: true,
      customSiteTitle: 'AL-Mizan API Gateway Docs',
    }),
  );
}
