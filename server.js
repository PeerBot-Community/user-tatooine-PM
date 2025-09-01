const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PeerBot.ai Server</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .logo { font-size: 2em; font-weight: bold; color: #333; margin-bottom: 20px; }
            .status { color: #28a745; font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🤖 PeerBot.ai</div>
            <h1>Server Running Successfully!</h1>
            <p class="status">✅ HTTP Server is active</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>Port: ${port}</p>
        </div>
    </body>
    </html>
  `);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Access at http://localhost:${port}`);
});