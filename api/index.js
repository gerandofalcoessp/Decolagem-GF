// Vercel Serverless Function wrapper for the Express app
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export default async function handler(req, res) {
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));

    const url = req.url || '';
    let urlPathParam = '';
    try {
      const parsedEarly = new URL(url, 'http://localhost');
      urlPathParam = parsedEarly.searchParams.get('path') || '';
    } catch {}
    const qp = (req && typeof req.query === 'object') ? req.query : {};
    const qpPath = typeof qp.path === 'string' ? qp.path : '';
    const effectivePathParam = qpPath || urlPathParam;

    // Detectar qualquer rota de debug o mais cedo possível
    const isDebugEarly = (
      url.includes('path=debug') ||
      (effectivePathParam && effectivePathParam.startsWith('debug')) ||
      url.startsWith('/api/debug') || url.startsWith('/debug')
    );
    if (isDebugEarly) {
      const candidates = [
        path.resolve(moduleDir, './_backend_dist/server.js'),
        path.resolve(moduleDir, './_backend_dist'),
        path.resolve(moduleDir, './server.js'),
        '/var/task/api/server.js',
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist',
        '/var/task/backend/dist/server.js',
        '/var/task/backend/dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));

      // Responder via API nativa para evitar qualquer incompatibilidade de helpers
      const payload = { from: 'vercel-function', checks, url, effectivePathParam, moduleDir };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
      return;
    }

    // Parser robusto de querystring para recuperar ?path=...
    let queryParams = {};
    try {
      const parsed = new URL(req.url || '', 'http://localhost');
      queryParams = Object.fromEntries(parsed.searchParams.entries());
    } catch (_) {
      queryParams = {};
    }
    if (req && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
      queryParams = { ...queryParams, ...req.query };
    }

    const rawPath = typeof queryParams.path === 'string' ? queryParams.path : '';
    const originalPath = rawPath
      ? (rawPath.startsWith('api/') ? `/${rawPath}` : `/api/${rawPath}`)
      : req.url;
    const qsIndex = (req.url || '').indexOf('?');
    const originalQS = qsIndex >= 0 ? (req.url || '').slice(qsIndex) : '';

    const normalizedPath = (originalPath || '').split('?')[0];
    if (normalizedPath === '/api/health' || normalizedPath === '/health' || rawPath === 'health') {
      return res.status(200).json({ status: 'ok', source: 'vercel-function' });
    }

    // Fallback de debug (se por algum motivo não acionou o early)
    if (normalizedPath.startsWith('/api/debug') || (rawPath && rawPath.startsWith('debug'))) {
      const candidates = [
        path.resolve(moduleDir, './_backend_dist/server.js'),
        path.resolve(moduleDir, './_backend_dist'),
        path.resolve(moduleDir, './server.js'),
        '/var/task/api/server.js',
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist',
        '/var/task/backend/dist/server.js',
        '/var/task/backend/dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      const payload = { from: 'vercel-function', checks, url, rawPath, normalizedPath, moduleDir };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
      return;
    }

    const relCandidates = [
      './_backend_dist/server.js',
      './server.js'
    ];
    const absCandidates = [
      path.resolve(moduleDir, './_backend_dist/server.js'),
      '/var/task/api/server.js',
      '/var/task/api/_backend_dist/server.js',
      '/var/task/backend/dist/server.js'
    ];
    const tryOrder = [...relCandidates, ...absCandidates];
    let app;
    let lastErr;
    const requireFn = createRequire(import.meta.url);
    for (const spec of tryOrder) {
      try {
        const isAbs = spec.startsWith('/');
        const href = isAbs ? pathToFileURL(spec).href : pathToFileURL(path.resolve(moduleDir, spec)).href;
        const mod = await import(href);
        app = mod?.default || mod?.app || mod?.server || mod;
        if (app) break;
      } catch (e) {
        lastErr = e;
        try {
          const resolved = spec.startsWith('.') ? path.resolve(moduleDir, spec) : spec;
          const modReq = requireFn(resolved);
          app = modReq?.default || modReq?.app || modReq?.server || modReq;
          if (app) break;
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
    if (!app) {
      const attempted = tryOrder.map(s => ({
        spec: s,
        resolved: s.startsWith('.') ? path.resolve(moduleDir, s) : s,
        exists: existsSync(s.startsWith('.') ? path.resolve(moduleDir, s) : s)
      }));
      const msg = lastErr?.message || 'dynamic_import_failed_all';
      if (rawPath && rawPath.startsWith('debug')) {
        const payload = { from: 'vercel-function', error: 'handler_import_failed', message: msg, attempted, moduleDir, url, rawPath, normalizedPath };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
        return;
      }
      return res.status(500).json({ error: 'handler_import_failed', message: msg, attempted });
    }

    req.url = originalPath + (originalQS && !originalPath.includes('?') ? originalQS : '');
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api] Failed to handle request:', err);
    const message = (err && err.message) ? err.message : 'unknown_error';
    res.status(500).json({ error: 'handler_init_failed', message });
  }
}