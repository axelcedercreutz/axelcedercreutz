// Renders scripts/icons.html to the PNG icon set in public/icons/ (favicon fallback, Apple touch icon, PWA sizes).
// Same Playwright note as screenshots.mjs.
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium"); process.exit(1); }

const root = new URL("..", import.meta.url).pathname;
const server = await start(8125, root);
const browser = await chromium.launch();
const sizes = [
  { file: "icon-32.png", px: 32, square: false },
  { file: "icon-192.png", px: 192, square: false },
  { file: "icon-512.png", px: 512, square: false },
  { file: "apple-touch-icon.png", px: 180, square: true }, // iOS applies its own corner mask
];
for (const s of sizes) {
  const scale = s.px / 512;
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: scale });
  await page.goto("http://127.0.0.1:8125/scripts/icons.html", { waitUntil: "networkidle" });
  await page.evaluate((square) => { document.getElementById("icon").classList.toggle("square", square); return document.fonts.ready; }, s.square);
  const el = await page.$("#icon");
  await el.screenshot({ path: `${root}public/icons/${s.file}`, omitBackground: true, type: "png" });
  console.log(`public/icons/${s.file}`);
  await page.close();
}
await browser.close();
server.close();
