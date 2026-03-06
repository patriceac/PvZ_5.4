import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function safeJoin(root, urlPath) {
  const pathname = urlPath.split('?')[0];
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(root, cleanPath));
  return filePath.startsWith(root) ? filePath : null;
}

createServer((req, res) => {
  const target = safeJoin(ROOT, req.url || '/');
  if (!target || !existsSync(target) || statSync(target).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const contentType = MIME_TYPES[extname(target)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(target).pipe(res);
}).listen(PORT, () => {
  console.log(`PvZ clone running at http://localhost:${PORT}`);
});
