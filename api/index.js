// Vercel Serverless Function wrapper for the Express app
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

export default async function handler(req, res) {
  try {
    // Early debug check usando req.url bruto
    const url = req.url || '';
    if (url.startsWith('/api/debug/dist') || url.startsWith('/debug/dist') || url.startsWith('/api/debug/ls') || url.startsWith('/debug/ls')) {
      const cwdDir = __dirname || '.';
      const candidates = [
        // candidatos relativos e absolutos para diagnosticar presença no bundle
        path.resolve(cwdDir, './_backend_dist/server.js'),
        path.resolve(cwdDir, './_backend_dist'),
        path.resolve(cwdDir, './server.js'),
        '/var/task/api/server.js',
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist',
        '/var/task/backend/dist/server.js',
        '/var/task/backend/dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      // listagem básica de diretórios para inspecionar o runtime
      let ls = {};
      try { ls['/var/task'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task'); } catch { return null; } })(); } catch {}
      try { ls['/var/task/api'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task/api'); } catch { return null; } })(); } catch {}
      try { ls['/var/task/backend'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task/backend'); } catch { return null; } })(); } catch {}
      return res.status(200).json({ from: 'vercel-function', checks, ls });
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

    // Debug adicional via normalizedPath e rawPath
    if (normalizedPath === '/api/debug/dist' || rawPath === 'debug/dist' || normalizedPath === '/api/debug/ls' || rawPath === 'debug/ls') {
      const cwdDir = __dirname || '.';
      const candidates = [
        path.resolve(cwdDir, './_backend_dist/server.js'),
        path.resolve(cwdDir, './_backend_dist'),
        path.resolve(cwdDir, './server.js'),
        '/var/task/api/server.js',
        '/var/task/api/_backend_dist/server.js',
        '/var/task/api/_backend_dist',
        '/var/task/backend/dist/server.js',
        '/var/task/backend/dist'
      ];
      const checks = candidates.map(p => ({ path: p, exists: existsSync(p) }));
      let ls = {};
      try { ls['/var/task'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task'); } catch { return null; } })(); } catch {}
      try { ls['/var/task/api'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task/api'); } catch { return null; } })(); } catch {}
      try { ls['/var/task/backend'] = await (async ()=>{ try { return (await import('node:fs')).readdirSync('/var/task/backend'); } catch { return null; } })(); } catch {}
      return res.status(200).json({ from: 'vercel-function', checks, ls });
    }

    // Resolve e importa o app Express com múltiplos candidatos (robusto)
    const cwdDir = __dirname || '.';
    const relCandidates = [
      './_backend_dist/server.js',
      './server.js'
    ];
    const absCandidates = [
      path.resolve(cwdDir, './_backend_dist/server.js'),
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
        const href = isAbs ? pathToFileURL(spec).href : pathToFileURL(path.resolve(cwdDir, spec)).href;
        const mod = await import(href);
        app = mod?.default || mod?.app || mod?.server || mod;
        if (app) break;
      } catch (e) {
        lastErr = e;
        // Tenta via require (CommonJS) como fallback
        try {
          const resolved = spec.startsWith('.') ? path.resolve(cwdDir, spec) : spec;
          const modReq = requireFn(resolved);
          app = modReq?.default || modReq?.app || modReq?.server || modReq;
          if (app) break;
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
    if (!app) {
      const attempted = tryOrder.map(s => ({ spec: s, exists: existsSync(s.startsWith('.') ? path.resolve(cwdDir, s) : s) }));
      const msg = lastErr?.message || 'dynamic_import_failed_all';
      return res.status(500).json({ error: 'handler_import_failed', message: msg, attempted });
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