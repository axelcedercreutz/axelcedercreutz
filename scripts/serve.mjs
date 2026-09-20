// Tiny static server for local preview: `npm run dev` → http://localhost:8080
// No dependencies; serves the repository root with correct MIME types.
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const port = Number(process.env.PORT || 8080);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

export function start(listenPort = port) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = join(root, normalize(path));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    let st;
    try { st = statSync(file); } catch { res.writeHead(404, { "content-type": "text/plain" }); return res.end("Not found"); }
    if (st.isDirectory()) { res.writeHead(301, { location: path + "/" }); return res.end(); }
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "content-length": st.size, "cache-control": "no-cache" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(listenPort, "127.0.0.1", () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  start().then(() => console.log(`Serving ${root} at http://localhost:${port}/`));
}
