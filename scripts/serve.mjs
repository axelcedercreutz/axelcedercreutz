// Minimal static server for the built site (dist/) with clean URLs, used by the screenshot and
// OG scripts. It also runs the Vercel Functions in api/ (Web-standard GET/POST exports), so the
// contact form works end to end locally. For day-to-day work use `npm run dev` or `npm run preview`.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

const apiDir = resolve(new URL("../api", import.meta.url).pathname);

async function runFunction(name, req, res) {
  const file = join(apiDir, `${name}.js`);
  if (name.startsWith("_") || !/^[\w-]+$/.test(name) || !existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
  const mod = await import(file);
  const handler = mod[req.method];
  if (typeof handler !== "function") { res.writeHead(405); return res.end(); }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const request = new Request(new URL(req.url, `http://${req.headers.host}`), {
    method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export function start(port, rootDir) {
  const root = resolve(rootDir);
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const fn = url.pathname.match(/^\/api\/([^/]+)$/);
    if (fn) return void runFunction(fn[1], req, res).catch((err) => { console.error(err); res.writeHead(500); res.end(); });
    let path = decodeURIComponent(url.pathname);
    let file = join(root, normalize(path));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (path.endsWith("/")) file = join(file, "index.html");
    else if (existsSync(file + ".html")) file = file + ".html";
    else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { file = join(root, "404.html"); if (!existsSync(file)) { res.writeHead(404); return res.end("Not found"); } res.statusCode = 404; }
    else res.statusCode = 200;
    const st = statSync(file);
    res.setHeader("content-type", types[extname(file)] || "application/octet-stream");
    res.setHeader("content-length", st.size);
    res.setHeader("cache-control", "no-cache");
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const port = Number(process.env.PORT || 8080);
  const dir = process.argv[2] || "dist";
  start(port, dir).then(() => console.log(`Serving ${resolve(dir)} at http://localhost:${port}/`));
}
