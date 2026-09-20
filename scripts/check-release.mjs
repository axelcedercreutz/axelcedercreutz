// Release gate: nothing unconfirmed may ship.
// Scans the source for <Todo> usages and `pending:` entries in case studies, and the build output
// for data-todo markers. Exit 1 while any remain, listing them.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const findings = [];

function walk(dir, exts, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, exts, out); else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

for (const file of walk(join(root, "src"), [".astro", ".md", ".mdx"])) {
  const s = readFileSync(file, "utf8");
  for (const m of s.matchAll(/<Todo note="([^"]*)"/g)) findings.push(`${relative(root, file)}: ${m[1]}`);
  if (file.includes("/content/work/")) {
    const fm = (s.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
    const block = (fm.match(/\npending:\n((?:  - .*\n?)*)/) || [])[1] || "";
    for (const m of block.matchAll(/  - "?(.*?)"?\s*$/gm)) if (m[1]) findings.push(`${relative(root, file)}: pending link — ${m[1]}`);
  }
}
if (existsSync(join(root, "dist"))) {
  for (const file of walk(join(root, "dist"), [".html"])) {
    const s = readFileSync(file, "utf8");
    for (const m of s.matchAll(/data-todo="([^"]*)"/g)) findings.push(`${relative(root, file)}: ${m[1]}`);
  }
}
for (const file of walk(join(root, "src/content/blog"), [".md", ".mdx"])) {
  if (/^draft:\s*true/m.test(readFileSync(file, "utf8"))) findings.push(`${relative(root, file)}: still a draft (fine to ship the site; it is excluded from the build)`);
}

// The same note appears in a source file and again in the built page; report each note once.
const unique = [...new Map(findings.map((f) => [f.replace(/^[^:]+: /, ""), f])).values()];
const blocking = unique.filter((f) => !f.includes("still a draft"));
if (blocking.length) {
  console.error(`✖ ${blocking.length} unconfirmed item(s):`);
  for (const f of unique) console.error(`  - ${f}`);
  console.error("\nConfirm each fact, remove its marker, and re-run.");
  process.exit(1);
}
console.log("✓ No unconfirmed items. Release-clean.");
if (findings.length) for (const f of findings) console.log(`  note: ${f}`);
