// Vercel Serverless Function wrapper for the Express app
export default async function handler(req, res) {
  try {
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
    const normalizedPath = originalPath.split('?')[0];
    if (normalizedPath === '/api/health' || normalizedPath === '/health' || rawPath === 'health') {
      return res.status(200).json({ status: 'ok', source: 'vercel-function' });
    }

    // Importa o app Express dinamicamente para evitar falhas de top-level import
    let app;
    try {
      const mod = await import('../backend/dist/server.js');
      app = mod?.default;
      if (!app) throw new Error('express_app_not_exported');
    } catch (e) {
      console.error('[vercel-api] Dynamic import failed:', e);
      const message = (e && e.message) ? e.message : 'dynamic_import_failed';
      return res.status(500).json({ error: 'handler_import_failed', message });
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