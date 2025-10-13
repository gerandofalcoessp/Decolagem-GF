module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'OK',
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        endpoints: ['/api/health', '/api/test']
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};