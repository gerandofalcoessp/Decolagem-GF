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
    const allowDebug = process.env.ALLOW_DEV_ENDPOINTS === 'true';
    if (isDebugEarly) {
      if (!allowDebug) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'debug_disabled' }));
        return;
      }
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
      const envs = {
        NODE_ENV: process.env.NODE_ENV || null,
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'set' : 'missing',
        VITE_API_URL: process.env.VITE_API_URL ? 'set' : 'missing',
        CORS_ORIGIN: process.env.CORS_ORIGIN ? 'set' : 'missing',
        FRONTEND_URL: process.env.FRONTEND_URL ? 'set' : 'missing'
      };
      const envKeys = Object.keys(process.env || {}).sort();
      // Responder via API nativa para evitar qualquer incompatibilidade de helpers
      const payload = { from: 'vercel-function', checks, url, effectivePathParam, moduleDir, envs, envKeys };
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
      try {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        // Include minimal headers to prevent static fallback behavior
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ status: 'ok', source: 'vercel-function', path: normalizedPath }));
      } catch (_) {
        // Final fallback using res.end only
        res.end('{"status":"ok","source":"vercel-function"}');
      }
      return;
    }

    // Rota direta: status do Supabase sem importar o app completo
    if (normalizedPath === '/api/supabase/status' || normalizedPath === '/supabase/status' || rawPath === 'supabase/status') {
      try {
        // Preflight CORS
        if ((req.method || '').toUpperCase() === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.end('');
          return;
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrlDirect = process.env.SUPABASE_URL || '';
        const supabaseUrlFallback = process.env.VITE_SUPABASE_URL || '';
        const supabaseUrl = supabaseUrlDirect || supabaseUrlFallback;
        const supabaseAnonKeyDirect = process.env.SUPABASE_ANON_KEY || '';
        const supabaseAnonKeyFallback = process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabaseAnonKey = supabaseAnonKeyDirect || supabaseAnonKeyFallback;
        const supabaseServiceRoleKeyDirect = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabaseServiceRoleKeyFallback = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
        const supabaseServiceRoleKey = supabaseServiceRoleKeyDirect || supabaseServiceRoleKeyFallback;

        const hasUrl = !!supabaseUrl;
        const hasAnon = !!supabaseAnonKey;
        const hasService = !!supabaseServiceRoleKey;

        const supabaseClient = (hasUrl && hasAnon) ? createClient(supabaseUrl, supabaseAnonKey) : null;
        const supabaseAdmin = (hasUrl && hasService) ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

        let adminCheck = 'skipped';
        if (supabaseAdmin) {
          const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
          if (error) {
            adminCheck = 'error';
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ status: 'error', hasUrl, hasAnon, hasService, adminConfigured: !!supabaseAdmin, clientConfigured: !!supabaseClient, adminCheck, error: error.message, envSource: { url: supabaseUrlDirect ? 'SUPABASE_URL' : (supabaseUrlFallback ? 'VITE_SUPABASE_URL' : 'missing'), anon: supabaseAnonKeyDirect ? 'SUPABASE_ANON_KEY' : (supabaseAnonKeyFallback ? 'VITE_SUPABASE_ANON_KEY' : 'missing'), service: supabaseServiceRoleKeyDirect ? 'SUPABASE_SERVICE_ROLE_KEY' : (supabaseServiceRoleKeyFallback ? 'VITE_SUPABASE_SERVICE_ROLE_KEY' : 'missing') } }));
            return;
          }
          adminCheck = 'ok';
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ status: 'ok', hasUrl, hasAnon, hasService, adminConfigured: !!supabaseAdmin, clientConfigured: !!supabaseClient, adminCheck, envSource: { url: supabaseUrlDirect ? 'SUPABASE_URL' : (supabaseUrlFallback ? 'VITE_SUPABASE_URL' : 'missing'), anon: supabaseAnonKeyDirect ? 'SUPABASE_ANON_KEY' : (supabaseAnonKeyFallback ? 'VITE_SUPABASE_ANON_KEY' : 'missing'), service: supabaseServiceRoleKeyDirect ? 'SUPABASE_SERVICE_ROLE_KEY' : (supabaseServiceRoleKeyFallback ? 'VITE_SUPABASE_SERVICE_ROLE_KEY' : 'missing') } }));
        return;
      } catch (e) {
        const message = (e && e.message) ? e.message : 'unknown_error';
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ status: 'error', error: message }));
        return;
      }
    }

    // Fallback de debug (se por algum motivo não acionou o early)
    if (normalizedPath.startsWith('/api/debug') || (rawPath && rawPath.startsWith('debug'))) {
      const allowDebug = process.env.ALLOW_DEV_ENDPOINTS === 'true';
      if (!allowDebug) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'debug_disabled' }));
        return;
      }
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
      const envs = {
        NODE_ENV: process.env.NODE_ENV || null,
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'set' : 'missing',
        VITE_API_URL: process.env.VITE_API_URL ? 'set' : 'missing',
        CORS_ORIGIN: process.env.CORS_ORIGIN ? 'set' : 'missing',
        FRONTEND_URL: process.env.FRONTEND_URL ? 'set' : 'missing'
      };
      const envKeys = Object.keys(process.env || {}).sort();
      const payload = { from: 'vercel-function', checks, url, rawPath, normalizedPath, moduleDir, envs, envKeys };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
      return;
    }

    const relCandidates = [
      './_backend_dist/server.js',
      './server.mjs',
      './server.js'
    ];
    const absCandidates = [
      '/var/task/api/_backend_dist/server.js',
      '/var/task/api/server.mjs',
      '/var/task/api/server.js',
      path.resolve(moduleDir, './_backend_dist/server.js'),
      '/var/task/backend/dist/server.js'
    ];
    const tryOrder = [...relCandidates, ...absCandidates];
    let app;
    let lastErr;
    const requireFn = createRequire(import.meta.url);
    const errors = [];
    for (const spec of tryOrder) {
      try {
        const isAbs = spec.startsWith('/');
        const href = isAbs ? pathToFileURL(spec).href : pathToFileURL(path.resolve(moduleDir, spec)).href;
        const mod = await import(href);
        app = mod?.default || mod?.app || mod?.server || mod;
        if (app) break;
      } catch (e) {
        lastErr = e;
        errors.push({ spec, stage: 'import', message: e?.message, code: e?.code });
        try {
          const resolved = spec.startsWith('.') ? path.resolve(moduleDir, spec) : spec;
          const modReq = requireFn(resolved);
          app = modReq?.default || modReq?.app || modReq?.server || modReq;
          if (app) break;
        } catch (e2) {
          lastErr = e2;
          errors.push({ spec, stage: 'require', message: e2?.message, code: e2?.code });
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
        const payload = { from: 'vercel-function', error: 'handler_import_failed', message: msg, attempted, errors, moduleDir, url, rawPath, normalizedPath };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
        return;
      }
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'handler_import_failed', message: msg, attempted, errors }));
      return;
    }

    req.url = originalPath + (originalQS && !originalPath.includes('?') ? originalQS : '');
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api] Failed to handle request:', err);
    const message = (err && err.message) ? err.message : 'unknown_error';
    // Use Node response primitives in error path too
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'handler_init_failed', message }));
  }
}