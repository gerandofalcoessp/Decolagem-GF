// Vercel Serverless Function wrapper for the Express app
export default async function handler(req, res) {
  // Forward all requests (including preflight) to the Express app so CORS middleware responds properly.
  try {
    const { default: app } = await import('../dist/server.js');
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api] Failed to initialize app:', err);
    const message = (err && err.message) ? err.message : 'unknown_error';
    res.status(500).json({ error: 'handler_init_failed', message });
  }
}