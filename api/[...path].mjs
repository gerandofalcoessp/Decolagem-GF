import handler from "./index.mjs";

export default async function route(req, res) {
  try {
    const url = req.url || '';
    // Extrair o segmento após /api/
    let pathParam = '';
    try {
      const idx = url.indexOf('/api/');
      if (idx >= 0) {
        const sub = url.slice(idx + 5);
        pathParam = (sub.split('?')[0] || '').replace(/^\/+|\/+$/g, '');
      }
    } catch {}

    // Preservar querystring existente e injetar path
    const qsIndex = url.indexOf('?');
    const existingQS = qsIndex >= 0 ? url.slice(qsIndex) : '';
    let newQS = '';
    if (pathParam) {
      newQS = `?path=${encodeURIComponent(pathParam)}`;
      if (existingQS) {
        const suffix = existingQS.startsWith('?') ? existingQS.slice(1) : existingQS;
        newQS += `&${suffix}`;
      }
    } else {
      newQS = existingQS || '';
    }

    // Atualizar req.url para que o handler principal reconheça corretamente
    req.url = '/api' + newQS;

    // Garantir req.query e propagar path
    if (!req.query || typeof req.query !== 'object') {
      req.query = {};
    }
    if (pathParam && typeof req.query.path !== 'string') {
      req.query.path = pathParam;
    }

    return handler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'dynamic-catchall-failed', message: err?.message || 'unknown' }));
  }
}