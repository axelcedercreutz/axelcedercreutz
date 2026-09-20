// Fetches every external URL in src/data/links.json and reports its status.
// Needs network access; run manually before a release (some hosts block automated clients).
import { readFileSync } from "node:fs";

const { links } = JSON.parse(readFileSync(new URL("../src/data/links.json", import.meta.url), "utf8"));
let failures = 0;
const ua = { "user-agent": "Mozilla/5.0 (compatible; axelcedercreutz.fi link check)" };

for (const { url, label } of links) {
  if (url.startsWith("mailto:")) { console.log(`—  ${url}  (mailto, not fetched)`); continue; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: ua });
    if (res.status === 405 || res.status === 403 || res.status === 999) res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: ua });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) failures++;
    console.log(`${ok ? "✓" : "✖"}  ${res.status}  ${url}  (${label})`);
  } catch (e) {
    failures++;
    console.log(`✖  ERR  ${url}  (${label}): ${e.message}`);
  } finally { clearTimeout(t); }
}
console.log(failures ? `\n${failures} link(s) need attention.` : "\nAll links reachable.");
process.exit(failures ? 1 : 0);
