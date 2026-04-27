const Bundler = require('parcel-bundler');
const express = require('express');
const http = require('http');
const open = require('open');

const app = express();
const PORT = 8082;

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

const bundler = new Bundler('index.html', { logLevel: 2 });
app.use(bundler.middleware());

const server = http.createServer(app);
server.listen(PORT);

server.on('error', (err) => console.error(err));
server.on('listening', () => {
  console.log(`\nEye Tracker corriendo en http://localhost:${PORT}\n`);
  open(`http://localhost:${PORT}`);
});
