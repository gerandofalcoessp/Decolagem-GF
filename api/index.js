// Vercel Serverless Function wrapper for the Express app
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export default async function handler(req, res) {
  try {
    // Determina diretório do módulo de forma confiável (ESM)
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));

    // Early debug check usando req.url bruto, querystring parseado e req.query.path
    const url = req.url || '';
    let urlPathParam = '';
    try {
      const parsedEarly = new URL(url, 'http://localhost');
      urlPathParam = parsedEarly.searchParams.get('path') || '';
    } catch {}
    const qp = (req && typeof req.query === 'object') ? req.query : {};
    const qpPath = typeof qp.path === 'string' ? qp.path : '';
    const effectivePathParam = qpPath || urlPathParam;
    if (
      url.startsWith('/api/debug/dist') || url.startsWith('/debug/dist') ||
      url.startsWith('/api/debug/ls') || url.startsWith('/debug/ls') ||
      effectivePathParam === 'debug/dist' || effectivePathParam === 'debug/ls'
    ) {
      const candidates = [
        // candidatos relativos e absolutos para diagnosticar presença no bundle
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
      // Simplificar diagnóstico: evitar listagem de diretórios para reduzir chance de erro
      return res.status(200).json({ from: 'vercel-function', checks, url, effectivePathParam, moduleDir });
    }

    // Parser robusto de querystring para recuperar ?path=...
    // Usa URL para extrair searchParams e mescla com req.query do Vercel/Express
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
      return res.status(200).json({ from: 'vercel-function', checks, url, rawPath, normalizedPath, moduleDir });
    }

    // Resolve e importa o app Express com múltiplos candidatos (robusto)
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
        // Tenta via require (CommonJS) como fallback
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
      // Caso debug, retornar 200 com diagnóstico para facilitar análise
      if (rawPath === 'debug/dist' || rawPath === 'debug/ls' || normalizedPath.startsWith('/api/debug')) {
        return res.status(200).json({ from: 'vercel-function', error: 'handler_import_failed', message: msg, attempted, moduleDir, url, rawPath, normalizedPath });
      }
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