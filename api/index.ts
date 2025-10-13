import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Route handling
  const { url, method } = req;

  if (url === '/health' && method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      env: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    });
  }

  if (url === '/api/health' && method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
  }

  // Default 404 response
  res.status(404).json({ error: 'Not Found' });
}