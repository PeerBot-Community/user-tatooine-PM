const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET' && req.url === '/status') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      port: 4000
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'Endpoint not found'
    }));
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Status endpoint: http://localhost:${PORT}/status`);
});