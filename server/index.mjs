/**
 * Servidor de produccion (Railway): sirve la app de React ya compilada
 * y la API, en una sola URL.
 *
 *   npm run build   -> genera dist/
 *   npm start       -> este archivo
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.mjs';

const DIST = resolve(process.env.DIST_DIR ?? fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = Number(process.env.PORT ?? 8787);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

async function serveStatic(req, res) {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  let file = resolve(DIST, '.' + decodeURIComponent(pathname));

  // Nadie sale de dist/ con rutas tipo /../../.env
  if (file !== DIST && !file.startsWith(DIST + sep)) {
    res.statusCode = 403;
    return res.end('Prohibido');
  }

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    // Rutas de la app (/dashboard, /class/fr) no existen como archivo:
    // se devuelve index.html y react-router decide. Pero un .js o .css que
    // falta es un 404 de verdad: devolver HTML ahi rompe el AudioWorklet
    // con un error incomprensible.
    if (extname(pathname)) { res.statusCode = 404; return res.end('No encontrado'); }
    file = join(DIST, 'index.html');
  }

  try {
    const data = await readFile(file);
    res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream');
    // Los assets de Vite llevan hash en el nombre: se cachean para siempre.
    res.setHeader('cache-control', file.includes(`${sep}assets${sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache');
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.statusCode = 404;
    res.end('No encontrado');
  }
}

const server = http.createServer(async (req, res) => {
  // El microfono solo se permite para este mismo origen.
  res.setHeader('permissions-policy', 'microphone=(self)');
  res.setHeader('x-content-type-options', 'nosniff');

  if (await handleApi(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    return res.end();
  }
  await serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tandem escuchando en :${PORT}`);
  if (!process.env.ASSEMBLYAI_API_KEY) console.warn('AVISO: falta ASSEMBLYAI_API_KEY');
  if (!existsSync(join(DIST, 'index.html'))) console.warn(`AVISO: no hay build en ${DIST}. Corre npm run build.`);
});
