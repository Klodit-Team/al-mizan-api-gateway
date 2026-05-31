import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { config } from '../config';

export function registerSwagger(app: Application): void {
  // 1. Expose an endpoint that fetches the raw Swagger JSON from downstream microservices
  app.get('/docs/json/:service', async (req, res) => {
    const service = req.params.service;
    let targetUrl = '';

    switch (service) {
      case 'auth': targetUrl = `${config.authServiceUrl}/api-docs-json`; break;
      case 'users': targetUrl = `${config.usersServiceUrl}/api/docs-json`; break;
      case 'tenders': targetUrl = `${config.tendersServiceUrl}/api/v1/docs-json`; break;
      case 'submissions': targetUrl = `${config.submissionsServiceUrl}/v3/api-docs`; break;
      case 'documents': targetUrl = `${config.documentsServiceUrl}/api/docs-json`; break;
      case 'evaluations': targetUrl = `${config.evaluationsServiceUrl}/api/docs-json`; break;
      case 'commissions': targetUrl = `${config.commissionsServiceUrl}/api/docs-json`; break;
      case 'appeals': targetUrl = `${config.appealsServiceUrl}/recours-service/v1/docs-json`; break;
      case 'notifications': targetUrl = `${config.notificationsServiceUrl}/notification-service/v1/docs-json`; break;
      case 'audit': targetUrl = `${config.auditServiceUrl}/api/docs-json`; break; // Expose the audit service raw JSON
      default: return res.status(404).json({ message: 'Service not found' });
    }

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: any = await response.json();
      data.servers = [{ url: 'https://api.klodit.app' }];
      res.json(data);
    } catch (error) {
      res.status(502).json({ 
        message: `Failed to fetch swagger JSON from downstream service (${service})`, 
        targetUrl, 
        error: (error as Error).message 
      });
    }
  });

  // 2. Setup Swagger UI with a Topbar dropdown
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      explorer: true,
      customSiteTitle: 'AL-Mizan API Documentation',
      swaggerOptions: {
        urls: [
          { name: "Appels d'Offres", url: "/docs/json/tenders" },
          { name: "Soumissions", url: "/docs/json/submissions" },
          { name: "Évaluations", url: "/docs/json/evaluations" },
          { name: "Commissions", url: "/docs/json/commissions" },
          { name: "Recours", url: "/docs/json/appeals" },
          { name: "Documents", url: "/docs/json/documents" },
          { name: "Notifications", url: "/docs/json/notifications" },
          { name: "Utilisateurs", url: "/docs/json/users" },
          { name: "Authentification", url: "/docs/json/auth" },
          { name: "Audit & Traçabilité", url: "/docs/json/audit" } // Add dropdown selection
        ]
      }
    })
  );
}