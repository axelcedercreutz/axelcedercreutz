// Screenshots of the built site at phone, tablet and desktop widths → docs/screenshots/.
// Run `npm run build` first. Playwright is not a dependency of the site: install it locally
// (`npm i -D playwright && npx playwright install chromium`) or expose a global install via NODE_PATH.
import { createRequire } from "node:module";
import { mkdirSync, existsSync } from "node:fs";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium"); process.exit(1); }

const root = new URL("..", import.meta.url).pathname;
if (!existsSync(root + "dist/index.html")) { console.error("dist/ is missing: run `npm run build` first"); process.exit(1); }
const out = root + "docs/screenshots/";
mkdirSync(out, { recursive: true });

const sizes = [
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const routes = [
  { path: "/", name: "home", full: true },
  { path: "/work/rinkview", name: "case-rinkview", full: true },
  { path: "/work", name: "work" },
  { path: "/blog", name: "blog" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
];

const port = 8123;
const server = await start(port, root + "dist");
const browser = await chromium.launch();
let problems = 0;
for (const scheme of ["light", "dark"]) {
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1, isMobile: !!s.mobile, hasTouch: !!s.mobile, colorScheme: scheme, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    for (const r of routes) {
      if (scheme === "dark" && r.name !== "home" && r.name !== "case-rinkview") continue;
      await page.goto(`http://127.0.0.1:${port}${r.path}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) { problems++; console.warn(`⚠ horizontal overflow of ${overflow}px at ${s.name} ${r.path} (${scheme})`); }
      const suffix = scheme === "dark" ? "-dark" : "";
      await page.screenshot({ path: `${out}${r.name}-${s.name}${suffix}-fold.jpg`, type: "jpeg", quality: 80 });
      if (r.full && scheme === "light") {
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((res) => setTimeout(res, 40)); } window.scrollTo(0, 0); });
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: `${out}${r.name}-${s.name}.jpg`, type: "jpeg", quality: 74, fullPage: true });
      }
      console.log(`${r.name} ${s.name} ${scheme}: overflow ${overflow}px`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
if (problems) { console.error(`${problems} viewport(s) overflow horizontally`); process.exit(1); }
