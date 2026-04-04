import { Role } from '../types';
import type { RoutesConfig } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// AL-Mizan API Gateway — Route Configuration
// ─────────────────────────────────────────────────────────────────────────────
// Each service defines:
//   url:         Target microservice base URL
//   path:        API path prefix (mounted under gateway.prefix + gateway.version)
//   auth:        Default auth requirement for all routes under this service
//   public:      Whether unauthenticated access is allowed (overrides auth)
//   roles:       Allowed roles (empty = any authenticated user)
//   rateLimit:   Per-route rate limit override (requests per window)
//   routes:      Per-endpoint overrides (method + path + auth/roles/public)
// ─────────────────────────────────────────────────────────────────────────────

export const routesConfig: RoutesConfig = {
  gateway: {
    prefix: '/api',
    version: 'v1',
  },

  services: {
    // ─── Auth Service ─────────────────────────────────────────────────────────
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      path: '/auth',
      auth: false,
      description: 'Authentication, tokens and session management',
      routes: [
        {
          path: '/register',
          method: 'POST',
          auth: false,
          public: true,
          description: 'User registration',
        },
        {
          path: '/login',
          method: 'POST',
          auth: false,
          public: true,
          description: 'User login',
        },
        {
          path: '/refresh',
          method: 'POST',
          auth: false,
          public: true,
          description: 'Refresh access token',
        },
        {
          path: '/logout',
          method: 'POST',
          auth: true,
          description: 'User logout',
        },
        {
          path: '/logout-all',
          method: 'POST',
          auth: true,
          description: 'Logout from all active sessions',
        },
        {
          path: '/me',
          method: 'GET',
          auth: true,
          description: 'Get current authenticated user',
        },
        {
          path: '/sessions',
          method: 'GET',
          auth: true,
          description: 'List active sessions',
        },
        {
          path: '/sessions/:id',
          method: 'DELETE',
          auth: true,
          description: 'Revoke one active session',
        },
        {
          path: '/forgot-password',
          method: 'POST',
          auth: false,
          public: true,
          description: 'Request password reset',
        },
        {
          path: '/verify-token',
          method: 'POST',
          auth: false,
          public: true,
          description: 'Verify password reset token',
        },
        {
          path: '/reset-password',
          method: 'POST',
          auth: false,
          public: true,
          description: 'Reset password using token',
        },
      ],
    },

    // ─── Users Service ───────────────────────────────────────────────────────
    users: {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/users',
      auth: true,
      pathRewrite: {
        '^/api/v1/users': '/api/v1',
      },
      description: 'User profiles, organizations, RBAC roles',
      routes: [
        {
          path: '/profiles',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Create a user profile',
        },
        {
          path: '/profiles/user/:userId',
          method: 'GET',
          auth: true,
          description: 'Get profile by user ID',
        },
        {
          path: '/profiles/:id',
          method: 'GET',
          auth: true,
          description: 'Get profile by profile ID',
        },
        {
          path: '/profiles/:id',
          method: 'PATCH',
          auth: true,
          description: 'Update profile',
        },
        {
          path: '/profiles/:id',
          method: 'DELETE',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Delete profile',
        },
        {
          path: '/organisations',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.OPERATEUR_ECONOMIQUE],
          description: 'Register an organisation',
        },
        {
          path: '/organisations',
          method: 'GET',
          auth: true,
          description: 'List organisations',
        },
        {
          path: '/organisations/:id',
          method: 'GET',
          auth: true,
          description: 'Get organisation by ID',
        },
        {
          path: '/organisations/:id',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN, Role.SERVICE_CONTRACTANT],
          description: 'Update organisation',
        },
        {
          path: '/organisations/:id/verify',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Verify an organisation',
        },
        {
          path: '/organisations/:id',
          method: 'DELETE',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Delete organisation',
        },
        {
          path: '/services-contractants',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Create service contractant',
        },
        {
          path: '/services-contractants',
          method: 'GET',
          auth: true,
          description: 'List services contractants',
        },
        {
          path: '/services-contractants/:id',
          method: 'GET',
          auth: true,
          description: 'Get service contractant by ID',
        },
        {
          path: '/services-contractants/:id',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Update service contractant',
        },
        {
          path: '/services-contractants/:id',
          method: 'DELETE',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Delete service contractant',
        },
        {
          path: '/operateurs-economiques',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Create operateur economique',
        },
        {
          path: '/operateurs-economiques',
          method: 'GET',
          auth: true,
          description: 'List operateurs economiques',
        },
        {
          path: '/operateurs-economiques/:id',
          method: 'GET',
          auth: true,
          description: 'Get operateur economique by ID',
        },
        {
          path: '/operateurs-economiques/:id',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Update operateur economique',
        },
        {
          path: '/operateurs-economiques/:id/blacklist',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Blacklist operateur economique',
        },
        {
          path: '/operateurs-economiques/:id/unblacklist',
          method: 'PATCH',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Remove operateur economique from blacklist',
        },
        {
          path: '/operateurs-economiques/:id',
          method: 'DELETE',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Delete operateur economique',
        },
        {
          path: '/roles',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Create RBAC role',
        },
        {
          path: '/roles',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN],
          description: 'List RBAC roles',
        },
        {
          path: '/roles/seed-defaults',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Seed default RBAC roles',
        },
        {
          path: '/user-roles',
          method: 'POST',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Assign role to user',
        },
        {
          path: '/user-roles/:userId',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN],
          description: 'List roles assigned to a user',
        },
        {
          path: '/user-roles/:userId/:roleId',
          method: 'DELETE',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Remove role from user',
        },
      ],
    },

    // ─── Appels d'Offres (Tenders) Service ────────────────────────────────────
    tenders: {
      url: process.env.TENDERS_SERVICE_URL || 'http://localhost:3003',
      path: '/tenders',
      auth: true,
      description: 'Tender lifecycle, lots, CDC, criteria, attribution',
      routes: [
        {
          path: '/',
          method: 'GET',
          auth: false,
          public: true,
          description: 'List published tenders (public access)',
        },
        {
          path: '/:id',
          method: 'GET',
          auth: false,
          public: true,
          description: 'Get tender details (public access)',
        },
        {
          path: '/',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Create a new tender',
        },
        {
          path: '/:id',
          method: 'PUT',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Update tender',
        },
        {
          path: '/:id/lots',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Add lots to tender',
        },
        {
          path: '/:id/criteria',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Define evaluation criteria',
        },
        {
          path: '/:id/publish',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Publish tender',
        },
        {
          path: '/:id/attribute',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Provisional/definitive attribution',
        },
        {
          path: '/:id/gre-a-gre',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT],
          description: 'Submit sole-source request',
        },
        {
          path: '/:id/gre-a-gre/validate',
          method: 'POST',
          auth: true,
          roles: [Role.CONTROLEUR],
          description: 'Validate/reject sole-source request',
        },
        {
          path: '/:id/cdc',
          method: 'GET',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE, Role.SERVICE_CONTRACTANT],
          description: 'Download cahier des charges',
        },
      ],
    },

    // ─── Soumissions (Submissions) Service ───────────────────────────────────
    submissions: {
      url: process.env.SUBMISSIONS_SERVICE_URL || 'http://localhost:3004',
      path: '/submissions',
      auth: true,
      description: 'Electronic bid submission with E2EE',
      routes: [
        {
          path: '/',
          method: 'POST',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'Create submission draft',
        },
        {
          path: '/:id/technical',
          method: 'POST',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'Upload technical offer',
        },
        {
          path: '/:id/financial',
          method: 'POST',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'Upload encrypted financial offer',
        },
        {
          path: '/:id/submit',
          method: 'POST',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'Final submission with timestamp',
        },
        {
          path: '/:id/decrypt',
          method: 'POST',
          auth: true,
          roles: [Role.MEMBRE_COMMISSION],
          description: 'Decrypt financial offer (Shamir)',
        },
        {
          path: '/mine',
          method: 'GET',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'List own submissions',
        },
      ],
    },

    // ─── Documents Service ───────────────────────────────────────────────────
    documents: {
      url: process.env.DOCUMENTS_SERVICE_URL || 'http://localhost:3005',
      path: '/documents',
      auth: true,
      description: 'File storage, admin docs, OCR/NLP pipeline',
      routes: [
        {
          path: '/upload',
          method: 'POST',
          auth: true,
          description: 'Upload a document',
        },
        {
          path: '/:id',
          method: 'GET',
          auth: true,
          description: 'Download a document',
        },
        {
          path: '/:id/validate',
          method: 'PUT',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Validate an admin document',
        },
        {
          path: '/:id/ocr',
          method: 'GET',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Get OCR analysis result',
        },
      ],
    },

    // ─── Evaluations Service ─────────────────────────────────────────────────
    evaluations: {
      url: process.env.EVALUATIONS_SERVICE_URL || 'http://localhost:3006',
      path: '/evaluations',
      auth: true,
      description: 'Offer scoring, grading, AI-assisted evaluation',
      routes: [
        {
          path: '/',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Create evaluation session',
        },
        {
          path: '/:id/score',
          method: 'POST',
          auth: true,
          roles: [Role.MEMBRE_COMMISSION],
          description: 'Score a submission',
        },
        {
          path: '/:id/results',
          method: 'GET',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION, Role.CONTROLEUR],
          description: 'Get evaluation results & ranking',
        },
        {
          path: '/:id/report',
          method: 'GET',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Generate evaluation report',
        },
        {
          path: '/:id/ai-compare',
          method: 'GET',
          auth: true,
          roles: [Role.CONTROLEUR, Role.ADMIN],
          description: 'Compare commission vs AI decisions',
        },
      ],
    },

    // ─── Commissions Service ─────────────────────────────────────────────────
    commissions: {
      url: process.env.COMMISSIONS_SERVICE_URL || 'http://localhost:3007',
      path: '/commissions',
      auth: true,
      description: 'Commission constitution, bid opening sessions, PVs',
      routes: [
        {
          path: '/',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.ADMIN],
          description: 'Create a commission' ,
        },
        {
          path: '/:id/sessions',
          method: 'POST',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Schedule bid opening session',
        },
        {
          path: '/:id/sessions/:sessionId/results',
          method: 'POST',
          auth: true,
          roles: [Role.MEMBRE_COMMISSION],
          description: 'Record opening results',
        },
        {
          path: '/:id/sessions/:sessionId/pv',
          method: 'GET',
          auth: true,
          roles: [Role.SERVICE_CONTRACTANT, Role.MEMBRE_COMMISSION],
          description: 'Generate session PV',
        },
      ],
    },

    // ─── Recours (Appeals) Service ───────────────────────────────────────────
    appeals: {
      url: process.env.APPEALS_SERVICE_URL || 'http://localhost:3008',
      path: '/appeals',
      auth: true,
      description: 'Appeal filing and processing',
      routes: [
        {
          path: '/',
          method: 'POST',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'File an appeal',
        },
        {
          path: '/:id/examine',
          method: 'PUT',
          auth: true,
          roles: [Role.MEMBRE_COMMISSION, Role.CONTROLEUR],
          description: 'Examine an appeal',
        },
        {
          path: '/:id/decide',
          method: 'PUT',
          auth: true,
          roles: [Role.MEMBRE_COMMISSION, Role.CONTROLEUR],
          description: 'Accept or reject appeal',
        },
        {
          path: '/mine',
          method: 'GET',
          auth: true,
          roles: [Role.OPERATEUR_ECONOMIQUE],
          description: 'List own appeals',
        },
      ],
    },

    // ─── Audit Service ──────────────────────────────────────────────────────
    audit: {
      url: process.env.AUDIT_SERVICE_URL || 'http://localhost:3009',
      path: '/audit',
      auth: true,
      description: 'Immutable audit logs, IA incident monitoring',
      routes: [
        {
          path: '/logs',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN, Role.CONTROLEUR],
          description: 'Search audit logs',
        },
        {
          path: '/integrity',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN],
          description: 'Verify hash chain integrity',
        },
        {
          path: '/incidents',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN, Role.CONTROLEUR],
          description: 'List AI incidents',
        },
        {
          path: '/incidents/:id/resolve',
          method: 'PUT',
          auth: true,
          roles: [Role.ADMIN, Role.CONTROLEUR],
          description: 'Resolve AI incident',
        },
      ],
    },

    // ─── Notifications Service ──────────────────────────────────────────────
    notifications: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3010',
      path: '/notifications',
      auth: true,
      description: 'Email, SMS, push notifications, AI alerts',
      routes: [
        {
          path: '/',
          method: 'GET',
          auth: true,
          description: 'List own notifications',
        },
        {
          path: '/:id/read',
          method: 'PUT',
          auth: true,
          description: 'Mark notification as read',
        },
        {
          path: '/alerts',
          method: 'GET',
          auth: true,
          roles: [Role.ADMIN, Role.CONTROLEUR],
          description: 'List AI alerts',
        },
        {
          path: '/alerts/:id/acknowledge',
          method: 'PUT',
          auth: true,
          roles: [Role.ADMIN, Role.CONTROLEUR],
          description: 'Acknowledge AI alert',
        },
      ],
    },
  },
};
