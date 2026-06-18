import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import { config } from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// Routes GET de lecture exclues du rate limiting global.
// Ces routes sont appelées massivement par Next.js (SSR, RSC prefetch, layouts)
// et ne représentent pas de risque d'abus — elles nécessitent une authentification.
// ─────────────────────────────────────────────────────────────────────────────
const SKIP_RATE_LIMIT_PREFIXES = [
  // Dashboard commissions (source de l'erreur 429 observée)
  '/api/v1/commissions',
  '/api/v1/seances-ouverture',
  // Dashboard évaluations
  '/api/v1/evaluations',
  // Dashboard soumissions (lecture)
  '/api/v1/soumissions',
  // Dashboard appels d'offres (lecture publique ou connectée)
  '/api/v1/appels-offres',
  // Profil utilisateur / notifications (chargés à chaque layout)
  '/api/v1/profiles',
  '/api/v1/notifications',
  // Marchés, attributions (lecture)
  '/api/v1/marches',
  '/api/v1/attributions',
  // Recours (lecture)
  '/api/v1/recours',
];

/**
 * Retourne true si la requête doit être exemptée du rate limiting global.
 * Seuls les GET de lecture authentifiés sont exemptés.
 * Les POST/PUT/PATCH/DELETE restent toujours limités.
 */
function shouldSkipRateLimit(req: Request): boolean {
  if (req.method !== 'GET') return false;

  const path = req.path;
  return SKIP_RATE_LIMIT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Helper pour construire le keyGenerator (IP ou X-Forwarded-For).
 */
function buildKeyGenerator(req: Request): string {
  const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
    ?.split(',')[0]
    ?.trim();

  if (forwardedFor) return forwardedFor;
  return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
}

/**
 * Rate limiter global.
 * - Exclut les routes GET de lecture des dashboards (commissions, évaluations, etc.)
 * - Les mutations (POST/PUT/PATCH/DELETE) restent soumises à la limite.
 * - Paramétrable via RATE_LIMIT_WINDOW_MS et RATE_LIMIT_MAX.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true, // RateLimit-* headers (RFC 6585)
  legacyHeaders: false,  // Désactive X-RateLimit-* (legacy)
  skip: shouldSkipRateLimit,
  message: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  },
  keyGenerator: buildKeyGenerator,
});

/**
 * Crée un rate limiter par route avec un nombre max personnalisé.
 * Utilisé pour les routes sensibles (login, upload, etc.).
 */
export function createRouteLimiter(maxRequests: number) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to this endpoint. Please try again later.',
    },
    keyGenerator: buildKeyGenerator,
  });
}
