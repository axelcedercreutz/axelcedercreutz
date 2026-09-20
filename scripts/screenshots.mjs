// Full-page screenshots at common phone, tablet and desktop widths → docs/screenshots/.
// Playwright is not a dependency of the site; install it locally (`npm i -D playwright && npx playwright install chromium`)
// or make a global install resolvable via NODE_PATH.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium"); process.exit(1); }

const out = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const sizes = [
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const server = await start(8123);
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1, isMobile: !!s.mobile, hasTouch: !!s.mobile, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) console.warn(`⚠ horizontal overflow of ${overflow}px at ${s.name} (${scheme})`);
    const suffix = scheme === "dark" ? "-dark" : "";
    // Above the fold first, then walk the page so lazy images load before the full capture.
    await page.screenshot({ path: `${out}${s.name}${suffix}-fold.jpg`, type: "jpeg", quality: 82 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    // Full-page captures for the light theme only; dark keeps the above-the-fold shot to limit repo weight.
    if (scheme === "light") {
      const file = `${out}${s.name}.jpg`;
      await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 78 });
      console.log(`${file}  (overflow ${overflow}px)`);
    } else {
      console.log(`${out}${s.name}${suffix}-fold.jpg  (overflow ${overflow}px)`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
