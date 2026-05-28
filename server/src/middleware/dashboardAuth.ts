import { Request, Response, NextFunction } from 'express';

/**
 * Dashboard password middleware.
 *
 * If DASHBOARD_SECRET is set, every /api/* request must include:
 *   Authorization: Bearer <DASHBOARD_SECRET>
 *
 * Routes exempt from auth:
 *   GET /api/ping   — Render health check
 *   *   /api/health — Render health check
 *
 * The /v1/* proxy routes have their own auth (unified API key) and are
 * NOT covered by this middleware — this only protects the admin dashboard.
 *
 * Set DASHBOARD_SECRET to any strong random string in your env.
 * Leave it unset for local dev (open access).
 */
export function dashboardAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.DASHBOARD_SECRET?.trim();

  // No secret configured → open access (local dev)
  if (!secret) { next(); return; }

  // Exempt health-check endpoints so Render uptime checks keep working
  if (req.path === '/ping' || req.path.startsWith('/health')) { next(); return; }

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  if (token === secret) { next(); return; }

  res.status(401).json({
    error: { message: 'Dashboard authentication required.', type: 'authentication_error' },
  });
}
