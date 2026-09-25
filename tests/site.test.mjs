// Checks over the BUILT site (dist/). Run `npm run build` first; CI does.
// Zero dependencies: node:test + regex over the emitted HTML. Blunt on purpose: it catches the
// class of mistake a personal site accumulates (missing metadata, guessed links, leaked TODOs,
// third-party requests, images without alt text) rather than testing components.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const dist = join(root, "dist");
const registry = JSON.parse(readFileSync(join(root, "src/data/links.json"), "utf8")).links;
const known = new Set(registry.map((l) => l.url));
const SITE = (process.env.SITE_ORIGIN || "https://axelcedercreutz.fi").replace(/\/$/, "");

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (p.endsWith(".html")) out.push(p);
  }
  return out;
}

let pages = [];
before(() => {
  assert.ok(existsSync(dist), "dist/ is missing: run `npm run build` first");
  pages = walk(dist).map((file) => {
    const html = readFileSync(file, "utf8");
    const rel = "/" + relative(dist, file).replace(/\\/g, "/");
    const path = rel === "/index.html" ? "/" : rel.replace(/\.html$/, "");
    return { file, path, html, text: html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ") };
  });
  assert.ok(pages.length >= 8, `expected at least 8 pages, found ${pages.length}`);
});

const attrs = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map((m) => m[0]);
const attr = (tagHtml, name) => (tagHtml.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const meta = (html, key, value) => attrs(html, "meta").find((m) => attr(m, key) === value);
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const jsonLd = (html) => {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) return [];
  const g = JSON.parse(decode(m[1]));
  return g["@graph"] ?? [g];
};

test("every page has the basics: lang, viewport, one h1, skip link, main landmark", () => {
  for (const p of pages) {
    assert.match(p.html, /<html lang="en"/, `${p.path}: lang`);
    assert.ok(meta(p.html, "name", "viewport"), `${p.path}: viewport`);
    assert.equal(attrs(p.html, "h1").length, 1, `${p.path}: exactly one h1`);
    assert.match(p.html, /class="skip" href="#main"/, `${p.path}: skip link`);
    assert.match(p.html, /<main id="main">/, `${p.path}: main landmark`);
  }
});

test("every page has a title, description, canonical URL that matches its path, and full Open Graph tags", () => {
  for (const p of pages) {
    const title = (p.html.match(/<title>([^<]+)<\/title>/) || [])[1];
    assert.ok(title && title.includes("Axel Cedercreutz"), `${p.path}: title "${title}"`);
    const desc = attr(meta(p.html, "name", "description"), "content");
    assert.ok(desc && desc.length >= 50 && desc.length <= 320, `${p.path}: description length ${desc?.length}`);
    const canonicalTag = attrs(p.html, "link").find((l) => attr(l, "rel") === "canonical");
    const robots = attr(meta(p.html, "name", "robots"), "content") ?? "";
    if (p.path === "/404") {
      assert.match(robots, /noindex/, "404 must be noindex");
      assert.equal(canonicalTag, undefined, "404 must not claim a canonical URL");
      continue;
    }
    assert.match(robots, /^index, follow/, `${p.path}: robots meta`);
    const canonical = attr(canonicalTag, "href");
    const expected = p.path === "/" ? `${SITE}/` : `${SITE}${p.path}`;
    assert.equal(canonical, expected, `${p.path}: canonical`);
    for (const k of ["og:type", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) assert.ok(meta(p.html, "property", k), `${p.path}: ${k}`);
    assert.equal(attr(meta(p.html, "property", "og:url"), "content"), canonical, `${p.path}: og:url`);
    assert.equal(attr(meta(p.html, "name", "twitter:card"), "content"), "summary_large_image", `${p.path}: twitter card`);
    const og = attr(meta(p.html, "property", "og:image"), "content");
    assert.ok(og.startsWith(SITE + "/"), `${p.path}: og:image absolute`);
    assert.ok(existsSync(join(dist, og.slice(SITE.length))), `${p.path}: og image ${og} exists in dist (npm run og)`);
  }
});

test("home page positions a product engineer first and links the work, not a single sport", () => {
  const home = pages.find((p) => p.path === "/");
  const hero = home.html.match(/<section class="hero[\s\S]*?<\/section>/)[0];
  assert.match(hero, /Product Engineer|Product engineer/, "role above the fold");
  assert.match(hero, /href="\/work"/, "primary CTA to work");
  const heroText = hero.replace(/<[^>]+>/g, " ");
  assert.ok((heroText.match(/hockey/gi) || []).length <= 1, "hockey is mentioned at most once in the hero");
  const ld = jsonLd(home.html).find((n) => n["@type"] === "Person");
  assert.ok(ld, "Person node on the home page");
  assert.equal(ld.jobTitle, "Product Engineer");
  for (const u of ld.sameAs) assert.ok(known.has(u), `sameAs ${u} not in links.json`);
});

test("case studies exist on their own pages, in order: RinkView, Banger Board, Budgy", () => {
  for (const slug of ["rinkview", "banger-board", "budgy"]) assert.ok(pages.some((p) => p.path === `/work/${slug}`), `/work/${slug}`);
  for (const path of ["/", "/work"]) {
    const html = pages.find((p) => p.path === path).html;
    const order = [...html.matchAll(/href="\/work\/(rinkview|banger-board|budgy)"/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(order)], ["rinkview", "banger-board", "budgy"], `${path}: case study order`);
  }
  for (const p of pages.filter((p) => p.path.startsWith("/work/"))) {
    assert.match(p.html, /<dt[^>]*>Role<\/dt>/, `${p.path}: role`);
    assert.match(p.html, /Receipts/, `${p.path}: evidence`);
    assert.match(p.html, /The problem/, `${p.path}: problem section`);
  }
  assert.match(pages.find((p) => p.path === "/work/rinkview").html, /rinkview-670251302746\.europe-north1\.run\.app/, "RinkView live CTA");
});

test("blog: index, at least one published post, RSS feed and sitemap exist; drafts are excluded", () => {
  assert.ok(pages.some((p) => p.path === "/blog"));
  const posts = pages.filter((p) => p.path.startsWith("/blog/"));
  assert.ok(posts.length >= 1, "at least one published post");
  assert.ok(!pages.some((p) => p.path === "/blog/rinkview-build-notes"), "draft post must not be built");
  const rss = readFileSync(join(dist, "rss.xml"), "utf8");
  assert.match(rss, /<rss/);
  assert.match(rss, /<item>/);
  assert.doesNotMatch(rss, /rinkview-build-notes/, "draft must not be in the feed");
  assert.ok(existsSync(join(dist, "sitemap-index.xml")));
  assert.ok(existsSync(join(dist, "robots.txt")));
  for (const p of posts) assert.match(p.html, /"@type":"BlogPosting"/, `${p.path}: BlogPosting JSON-LD`);
});

test("every internal link resolves to a built page or asset", () => {
  const built = new Set(pages.map((p) => p.path));
  for (const p of pages) {
    for (const [, href] of p.html.matchAll(/<a [^>]*href="(\/[^"#]*)"/g)) {
      const clean = href.replace(/\/$/, "") || "/";
      const ok = built.has(clean) || existsSync(join(dist, href));
      assert.ok(ok, `${p.path}: internal link ${href} does not resolve`);
    }
  }
});

test("every external link is https or mailto and registered in src/data/links.json", () => {
  for (const l of registry) assert.ok(l.source && l.source.length > 10, `links.json entry ${l.url} needs a source note`);
  for (const p of pages) {
    for (const [tag, href] of p.html.matchAll(/<a ([^>]*href="([^"]*)"[^>]*)>/g).map((m) => [m[1], m[2]])) {
      if (!/^(https?:|mailto:)/.test(href)) continue;
      assert.ok(!href.startsWith("http:"), `${p.path}: insecure link ${href}`);
      assert.ok(known.has(href), `${p.path}: external link not in links.json (no guessed URLs): ${href}`);
      assert.doesNotMatch(tag, /target="_blank"/, `${p.path}: ${href} opens a new tab; links stay in the same tab on this site`);
    }
  }
});

test("no third-party requests: every script, stylesheet, image and font is same-origin", () => {
  for (const p of pages) {
    for (const [, url] of p.html.matchAll(/<(?:script|link|img|source)\b[^>]*(?:src|href)="(https?:\/\/[^"]+)"/g)) {
      assert.ok(url.startsWith(SITE + "/"), `${p.path}: external resource ${url}`);
    }
    for (const [tag] of p.html.matchAll(/<(?:script|link|iframe)\b[^>]*>/g)) assert.doesNotMatch(tag, /googletagmanager|google-analytics|plausible|posthog|hotjar|fonts\.googleapis/i, `${p.path}: tracker or remote font in ${tag}`);
  }
});

test("images carry alt text and dimensions; fonts are self-hosted and licensed", () => {
  for (const p of pages) {
    for (const img of attrs(p.html, "img")) {
      const alt = attr(img, "alt");
      assert.ok(alt !== undefined && alt.length > 20, `${p.path}: alt text missing or too short on ${attr(img, "src")}`);
      assert.ok(attr(img, "width") && attr(img, "height"), `${p.path}: width/height missing on ${attr(img, "src")}`);
    }
  }
  for (const f of ["fonts/BricolageGrotesque-latin.woff2", "fonts/JetBrainsMono-latin.woff2", "fonts/OFL-BricolageGrotesque.txt", "fonts/OFL-JetBrainsMono.txt", "favicon.svg", "icons/icon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "manifest.webmanifest"]) assert.ok(existsSync(join(dist, f)), `missing ${f}`);
});

test("unconfirmed facts are marked with data-todo, never as bare TODO text or placeholder metrics", () => {
  for (const p of pages) {
    assert.doesNotMatch(p.text, /\bTODO\b/, `${p.path}: bare TODO in copy`);
    assert.doesNotMatch(p.text, /lorem ipsum|\[metric\]|\[number\]|\bXX\b/i, `${p.path}: placeholder`);
    for (const [, note] of p.html.matchAll(/data-todo="([^"]*)"/g)) assert.ok(note.length > 12, `${p.path}: data-todo needs a descriptive note`);
  }
});

test("no team affiliation is implied anywhere", () => {
  for (const p of pages) {
    assert.doesNotMatch(p.text, /red wings|detroit/i, `${p.path}`);
    assert.doesNotMatch(p.text, /\butah\b|mammoth/i, `${p.path}: the demo dataset's original club must not read as an affiliation`);
  }
});

test("headings do not skip levels", () => {
  for (const p of pages) {
    const levels = [...p.html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    let prev = 0;
    for (const l of levels) { assert.ok(l <= prev + 1, `${p.path}: heading jumps from h${prev} to h${l}`); prev = l; }
  }
});

test("structured data: one @graph per indexable page with WebSite, Person and resolvable @id references", () => {
  for (const p of pages) {
    const nodes = jsonLd(p.html);
    if (p.path === "/404") { assert.equal(nodes.length, 0, "404 carries no structured data"); continue; }
    const types = nodes.map((n) => n["@type"]);
    assert.ok(types.includes("WebSite") && types.includes("Person"), `${p.path}: WebSite and Person nodes (${types})`);
    if (p.path !== "/") assert.ok(types.includes("BreadcrumbList"), `${p.path}: breadcrumbs`);
    const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
    const refs = JSON.stringify(nodes).matchAll(/\{"@id":"([^"]+)"\}/g);
    for (const [, id] of refs) assert.ok(ids.has(id), `${p.path}: @id reference ${id} is not defined on the page`);
    for (const n of nodes) {
      if (n["@type"] === "Organization") continue;
      for (const k of ["url", "@id", "mainEntityOfPage", "image"]) if (typeof n[k] === "string") assert.ok(n[k].startsWith(SITE + "/"), `${p.path}: ${n["@type"]}.${k} ${n[k]} is off-origin`);
    }
    if (p.path.startsWith("/work/")) assert.ok(types.includes("SoftwareApplication"), `${p.path}: case study node`);
    if (p.path.startsWith("/blog/")) assert.ok(types.includes("BlogPosting"), `${p.path}: post node`);
  }
});

test("crawler files: robots.txt allows everything and points at the sitemap; sitemap lists every indexable page and nothing else; llms.txt links resolve", () => {
  const robots = readFileSync(join(dist, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*\nAllow: \/$/m, "default rule allows everything");
  assert.doesNotMatch(robots, /^Disallow: \/$/m, "nothing is blocked by default");
  assert.match(robots, new RegExp(`^Sitemap: ${SITE.replace(/[.]/g, "\\.")}/sitemap-index.xml$`, "m"), "sitemap URL follows the deployed origin");
  for (const ua of ["Googlebot", "OAI-SearchBot", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "GPTBot"]) assert.match(robots, new RegExp(`^User-agent: ${ua}$`, "m"), `${ua} addressed explicitly`);

  const index = readFileSync(join(dist, "sitemap-index.xml"), "utf8");
  const files = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(SITE.length));
  const locs = files.flatMap((f) => [...readFileSync(join(dist, f), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const expected = new Set(pages.filter((p) => p.path !== "/404").map((p) => (p.path === "/" ? `${SITE}/` : `${SITE}${p.path}`)));
  assert.deepEqual(new Set(locs), expected, "sitemap URLs equal the set of indexable pages");
  const post = readFileSync(join(dist, files[0]), "utf8").match(/<url><loc>[^<]*\/blog\/[^<]+<\/loc><lastmod>/);
  assert.ok(post, "posts carry lastmod");

  for (const f of ["llms.txt", "llms-full.txt"]) {
    const txt = readFileSync(join(dist, f), "utf8");
    assert.match(txt, /^# Axel Cedercreutz\n\n> /, `${f} starts with the llms.txt header`);
    for (const [, url] of txt.matchAll(/\]\((https?:[^)]+)\)/g)) {
      if (url.startsWith(SITE + "/")) {
        const path = url.slice(SITE.length).replace(/\/$/, "") || "/";
        assert.ok(pages.some((p) => p.path === path) || existsSync(join(dist, path)), `${f}: ${url} does not resolve`);
      } else assert.ok(known.has(url), `${f}: external link ${url} not in links.json`);
    }
    assert.doesNotMatch(txt, /rinkview-build-notes/, `${f}: drafts stay out`);
    assert.doesNotMatch(txt, /\bTODO\b|link pending|pending:/, `${f}: no unconfirmed markers`);
  }
  const rss = readFileSync(join(dist, "rss.xml"), "utf8");
  assert.match(rss, new RegExp(`<atom:link href="${SITE.replace(/[.]/g, "\\.")}/rss.xml" rel="self"`), "feed declares its own URL");
});

test("social cards: every page has a 1200×630 image on this origin, and case studies use their own cover", () => {
  for (const p of pages) {
    const og = attr(meta(p.html, "property", "og:image"), "content");
    const alt = attr(meta(p.html, "property", "og:image:alt"), "content");
    assert.ok(alt && alt.length > 10, `${p.path}: og:image:alt`);
    if (p.path.startsWith("/work/")) assert.doesNotMatch(og, /\/og\.png$/, `${p.path}: case study should use its cover as the social image`);
  }
});
