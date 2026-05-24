# Al-Mizan — API Gateway

L'**API Gateway** est le point d'entrée unique de la plateforme de passation des marchés publics **Al-Mizan**. Elle orchestre les communications avec l'ensemble des microservices, centralise les contrôles de sécurité et fournit un point d'accès unifié pour les clients.

---

## 🛠️ Architecture & Technologies

- **Runtime** : Node.js (Express + TypeScript)
- **Message Broker** : RabbitMQ (Exchange `al-mizan.events`)
- **Stockage de session & cache** : Redis
- **Security Middlewares** : Helmet, Cors, Express-rate-limit

---

## 🔌 Réseau & Ports

- **Port local** : `:3000`
- **Préfixe de routage global** : `/api/v1`
- **Santé du service** :
  - Liveness : `GET http://localhost:3000/ready`
  - Diagnostics complets (Redis, RabbitMQ) : `GET http://localhost:3000/health`
  - Documentation OpenAPI : `GET http://localhost:3000/docs`

---

## 📋 Variables d'Environnement (`.env`)

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute de la Gateway | `3000` |
| `NODE_ENV` | Environnement d'exécution | `development` |
| `REDIS_URL` | Chaîne de connexion à Redis | `redis://localhost:6379` |
| `RABBITMQ_URL` | Chaîne de connexion à RabbitMQ | `amqp://guest:guest@localhost:5672` |
| `CORS_ORIGINS` | Origines autorisées séparées par des virgules | `http://localhost:4000` |
| `AUTH_SERVICE_URL` | URL de `auth-service` | `http://localhost:3001` |
| `USERS_SERVICE_URL` | URL de `users-service` | `http://localhost:3002` |
| `TENDERS_SERVICE_URL` | URL de `appel-offres-service` | `http://localhost:8003` |
| `SUBMISSIONS_SERVICE_URL` | URL de `soumission-service` | `http://localhost:8004` |
| `DOCUMENTS_SERVICE_URL` | URL de `documents-service` | `http://localhost:8005` |
| `EVALUATIONS_SERVICE_URL` | URL de `evaluation-service` | `http://localhost:8008` |
| `COMMISSIONS_SERVICE_URL` | URL de `commission-service` | `http://localhost:8007` |
| `APPEALS_SERVICE_URL` | URL de `recours-service` | `http://localhost:8009` |
| `NOTIFICATIONS_SERVICE_URL` | URL de `notification-service` | `http://localhost:8010` |
| `AUDIT_SERVICE_URL` | URL de `audit-service` | `http://localhost:3009` |

---

## 🚀 Fonctionnalités Clés

1. **Routage et Proxification** : Routage transparent et sécurisé de toutes les requêtes vers les microservices appropriés via `http-proxy-middleware`.
2. **Authentification & RBAC Centralisés** : Validation automatique des jetons de session Redis (`X-Session-Id`) et injection des en-têtes d'identité (`X-User-Id`, `X-User-Role`, `X-User-Roles`) vers les services en aval.
3. **Limitation de Débit (Rate Limiting)** : Protection globale (`express-rate-limit`) et par route pour se prémunir des attaques par déni de service (DDoS).
4. **En-têtes de Sécurité** : Intégration de `helmet` pour la conformité et la sécurité web.
5. **Traçabilité des requêtes** : Injection et propagation d'un identifiant de requête unique `X-Request-Id` dans tous les échanges inter-services.

---

## 💻 Commandes de Développement

- **Installation des dépendances** :
  ```bash
  npm install
  ```
- **Lancer en mode développement** (avec nodemon) :
  ```bash
  npm run dev
  ```
- **Compiler le code TypeScript** :
  ```bash
  npm run build
  ```
- **Lancer en production** :
  ```bash
  npm start
  ```
