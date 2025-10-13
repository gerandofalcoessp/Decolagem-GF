module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'API is working',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        test: '/api/test'
      }
    });
    return;
  }

  // Method not allowed
  res.status(405).json({ error: 'Method not allowed' });
};