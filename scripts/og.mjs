// Renders scripts/og.html to public/og.png (1200×630) for Open Graph and Twitter cards.
// Same Playwright note as screenshots.mjs. Re-run after changing the headline or palette.
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium"); process.exit(1); }

const root = new URL("..", import.meta.url).pathname;
const server = await start(8124, root);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light" });
await page.goto("http://127.0.0.1:8124/scripts/og.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: root + "public/og.png", type: "png" });
console.log(root + "public/og.png");
await browser.close();
server.close();
