// Fetches every external URL in content/links.json and reports its status.
// Needs network access; run manually before a release (some hosts block automated clients — read the notes).
import { readFileSync } from "node:fs";

const { links } = JSON.parse(readFileSync(new URL("../content/links.json", import.meta.url), "utf8"));
let failures = 0;

for (const { url, label } of links) {
  if (url.startsWith("mailto:")) { console.log(`—  ${url}  (mailto, not fetched)`); continue; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "axelcedercreutz.fi link check" } });
    if (res.status === 405 || res.status === 403) res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "axelcedercreutz.fi link check" } });
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
