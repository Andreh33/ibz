import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.glb': 'model/gltf-binary', '.json': 'application/json', '.wasm': 'application/wasm',
};

export async function startStaticServer(port = 39847) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(ROOT, url);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404); return res.end('not found: ' + url);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { server, ROOT, port };
}
