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
    // Atualiza req.url para o Express enxergar a rota correta
    req.url = originalPath + (originalQS && !originalPath.includes('?') ? originalQS : '');

    // Importa o app Express compilado (server.js) do backend
    const { default: app } = await import('../backend/dist/server.js');
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api] Failed to initialize app:', err);
    const message = (err && err.message) ? err.message : 'unknown_error';
    res.status(500).json({ error: 'handler_init_failed', message });
  }
}