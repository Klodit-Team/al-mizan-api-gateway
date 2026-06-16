const fs = require('fs');
const file = 'src/config/routes.ts';
let code = fs.readFileSync(file, 'utf8');

const usersBlockRegex = /\/\/ ─── Users Service ───[\s\S]*?(?=\/\/ ─── Appels d'Offres \(Tenders\) Service ───)/;

const newBlock = `    // ─── Users Service ───────────────────────────────────────────────────────
    profiles: {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/profiles',
      auth: true,
      description: 'User profiles',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.ADMIN] },
        { path: '/user/:userId', method: 'GET', auth: true },
        { path: '/user/:userId', method: 'PATCH', auth: true },
        { path: '/:id', method: 'GET', auth: true },
        { path: '/:id', method: 'PATCH', auth: true },
        { path: '/:id', method: 'DELETE', auth: true, roles: [Role.ADMIN] },
      ],
    },
    organisations: {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/organisations',
      auth: true,
      description: 'Organisations',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.SERVICE_CONTRACTANT, Role.OPERATEUR_ECONOMIQUE] },
        { path: '', method: 'GET', auth: true },
        { path: '/:id', method: 'GET', auth: true },
        { path: '/:id', method: 'PATCH', auth: true, roles: [Role.ADMIN, Role.SERVICE_CONTRACTANT] },
        { path: '/:id/verify', method: 'PATCH', auth: true, roles: [Role.ADMIN] },
        { path: '/:id', method: 'DELETE', auth: true, roles: [Role.ADMIN] },
      ],
    },
    'services-contractants': {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/services-contractants',
      auth: true,
      description: 'Services contractants',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.ADMIN] },
        { path: '', method: 'GET', auth: true },
        { path: '/profile', method: 'GET', auth: true, roles: [Role.SERVICE_CONTRACTANT] },
        { path: '/profile', method: 'PUT', auth: true, roles: [Role.SERVICE_CONTRACTANT] },
        { path: '/:id', method: 'GET', auth: true },
        { path: '/:id', method: 'PATCH', auth: true, roles: [Role.ADMIN] },
        { path: '/:id', method: 'DELETE', auth: true, roles: [Role.ADMIN] },
      ],
    },
    'operateurs-economiques': {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/operateurs-economiques',
      auth: true,
      description: 'Operateurs economiques',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.ADMIN] },
        { path: '', method: 'GET', auth: true },
        { path: '/profile', method: 'GET', auth: true, roles: [Role.OPERATEUR_ECONOMIQUE] },
        { path: '/profile', method: 'PUT', auth: true, roles: [Role.OPERATEUR_ECONOMIQUE] },
        { path: '/:id', method: 'GET', auth: true },
        { path: '/:id', method: 'PATCH', auth: true, roles: [Role.ADMIN] },
        { path: '/:id/blacklist', method: 'PATCH', auth: true, roles: [Role.ADMIN] },
        { path: '/:id/unblacklist', method: 'PATCH', auth: true, roles: [Role.ADMIN] },
        { path: '/:id', method: 'DELETE', auth: true, roles: [Role.ADMIN] },
      ],
    },
    roles: {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/roles',
      auth: true,
      description: 'RBAC roles',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.ADMIN] },
        { path: '', method: 'GET', auth: true, roles: [Role.ADMIN] },
        { path: '/seed-defaults', method: 'POST', auth: true, roles: [Role.ADMIN] },
      ],
    },
    'user-roles': {
      url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      path: '/user-roles',
      auth: true,
      description: 'User roles',
      routes: [
        { path: '', method: 'POST', auth: true, roles: [Role.ADMIN] },
        { path: '/:userId', method: 'GET', auth: true, roles: [Role.ADMIN] },
        { path: '/:userId/:roleId', method: 'DELETE', auth: true, roles: [Role.ADMIN] },
      ],
    },

`;

code = code.replace(usersBlockRegex, newBlock);
fs.writeFileSync(file, code);
console.log("Updated config/routes.ts");
