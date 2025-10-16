// Vercel Serverless Function wrapper for the Express app
import { existsSync } from "node:fs";
import path from "node:path";

export default async function handler(req, res) {
  try {
    // Early debug check using raw req.url to avoid any mismatch with routing params
    const url = req.url || '';
    if (url.startsWith('/api/debug/dist') || url.startsWith('/debug/dist')) {
      const cwdDir = __dirname || '.';
      const candidates = [
        path.resolve(cwdDir, './_backend_dist/server.js'),
        path.resolve(cwdDir, '../backend/dist/server.js'),
        '/var/task/api/_backend_dist/server.js',
        '/var/task/backend/dist/server.js',
        path.resolve(cwdDir, './_backend_dist'),
        path.resolve(cwdDir, '../backend/dist')
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      return res.status(200).json({ from: 'vercel-function', checks });
    }

    // Reconstrói o path original a partir do query param adicionado pela rota
    const qp = req.query || {};
    const rawPath = typeof qp.path === 'string' ? qp.path : '';
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
        path.resolve(cwdDir, '../backend/dist/server.js'),
        '/var/task/api/_backend_dist/server.js',
        '/var/task/backend/dist/server.js',
        path.resolve(cwdDir, './_backend_dist'),
        path.resolve(cwdDir, '../backend/dist')
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      return res.status(200).json({ from: 'vercel-function', checks });
    }

    // Importa o app Express dinamicamente para evitar falhas de top-level import
    let app;
    try {
      // Primeira tentativa: pasta replicada para dentro de api
      const modPrimary = await import('./_backend_dist/server.js');
      app = modPrimary?.default;
      if (!app) throw new Error('express_app_not_exported');
    } catch (ePrimary) {
      try {
        // Fallback: importar da pasta original backend/dist se estiver incluída no bundle
        const modFallback = await import('../backend/dist/server.js');
        app = modFallback?.default;
        if (!app) throw new Error('express_app_not_exported');
      } catch (eFallback) {
        console.error('[vercel-api] Dynamic import failed (primary and fallback):', ePrimary, eFallback);
        const msgPrimary = (ePrimary && ePrimary.message) ? ePrimary.message : 'dynamic_import_failed_primary';
        const msgFallback = (eFallback && eFallback.message) ? eFallback.message : 'dynamic_import_failed_fallback';
        return res.status(500).json({ error: 'handler_import_failed', message: `${msgPrimary} ; ${msgFallback}` });
      }
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