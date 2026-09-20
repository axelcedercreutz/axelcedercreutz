// Renders scripts/og.html to assets/img/og.png (1200×630) for Open Graph / Twitter cards.
// Same Playwright note as screenshots.mjs.
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium"); process.exit(1); }

const server = await start(8124);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light" });
await page.goto("http://127.0.0.1:8124/scripts/og.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const out = new URL("../assets/img/og.png", import.meta.url).pathname;
await page.screenshot({ path: out, type: "png" });
console.log(out);
await browser.close();
server.close();
