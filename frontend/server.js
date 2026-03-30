// server.js — Next.js custom server untuk deploy di cPanel
// File ini menjadi "Application startup file" di pengaturan Node.js cPanel

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ron's Guest House Frontend ready on http://localhost:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
