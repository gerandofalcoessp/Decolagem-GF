// Vercel Serverless Function wrapper for the Express app
import { existsSync } from "node:fs";
import path from "node:path";

export default async function handler(req, res) {
  try {
    // Early debug check usando req.url bruto
    const url = req.url || '';
    if (url.startsWith('/api/debug/dist') || url.startsWith('/debug/dist')) {
      const cwdDir = __dirname || '.';
      const candidates = [
        path.resolve(cwdDir, './_backend_dist/server.js'),
        path.resolve(cwdDir, './_backend_dist'),
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      return res.status(200).json({ from: 'vercel-function', checks });
    }

    // Parser robusto de querystring para recuperar ?path=...
    // Usa URL para extrair searchParams, com fallback para req.query
    let queryParams = {};
    try {
      const parsed = new URL(req.url || '', 'http://localhost');
      queryParams = Object.fromEntries(parsed.searchParams.entries());
    } catch (_) {
      queryParams = req.query || {};
    }

    // Reconstrói o path original a partir do query param adicionado pela rota
    const rawPath = typeof queryParams.path === 'string' ? queryParams.path : '';
    // Garantir que Express receba o prefixo "/api/" para resolver corretamente os routers montados
    const originalPath = rawPath
      ? (rawPath.startsWith('api/') ? `/${rawPath}` : `/api/${rawPath}`)
      : req.url;
    // Preserva querystring original se houver
    const qsIndex = (req.url || '').indexOf('?');
    const originalQS = qsIndex >= 0 ? (req.url || '').slice(qsIndex) : '';

    // Endpoint de health direto pela função (bypass Express) para diagnosticar erro 500
    const normalizedPath = (originalPath || '').split('?')[0];
    if (normalizedPath === '/api/health' || normalizedPath === '/health' || rawPath === 'health') {
      return res.status(200).json({ status: 'ok', source: 'vercel-function' });
    }

    // Redundante: também permitir debug via normalizedPath e rawPath
    if (normalizedPath === '/api/debug/dist' || rawPath === 'debug/dist') {
      const cwdDir = __dirname || '.';
      const candidates = [
        path.resolve(cwdDir, './_backend_dist/server.js'),
        path.resolve(cwdDir, './_backend_dist'),
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      return res.status(200).json({ from: 'vercel-function', checks });
    }

    // Importa o app Express dinamicamente a partir de api/_backend_dist somente
    const primaryPath = './_backend_dist/server.js';
    let app;
    try {
      const modPrimary = await import(primaryPath);
      app = modPrimary?.default;
      if (!app) throw new Error('express_app_not_exported');
    } catch (ePrimary) {
      console.error('[vercel-api] Dynamic import failed (primary only):', ePrimary);
      const msgPrimary = (ePrimary && ePrimary.message) ? ePrimary.message : 'dynamic_import_failed_primary';
      return res.status(500).json({ error: 'handler_import_failed', message: msgPrimary });
    }

    // Atualiza req.url para o Express enxergar a rota correta
    req.url = originalPath + (originalQS && !originalPath.includes('?') ? originalQS : '');

    // Usa app Express importado dinamicamente
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api] Failed to handle request:', err);
    const message = (err && err.message) ? err.message : 'unknown_error';
    res.status(500).json({ error: 'handler_init_failed', message });
  }
}