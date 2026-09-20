// Structural and content checks for index.html. Zero dependencies: node:test + regex over the markup.
// These guard the acceptance criteria that can be checked mechanically: metadata, project order,
// link discipline (no guessed URLs), TODO discipline, images, accessibility basics and privacy (no third-party requests).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "assets/css/site.css"), "utf8");
const registry = JSON.parse(readFileSync(resolve(root, "content/links.json"), "utf8")).links;

const attrs = (tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map((m) => m[0]);
const attr = (tagHtml, name) => (tagHtml.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const meta = (key, value) => attrs("meta").find((m) => attr(m, key) === value);
const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

test("document basics: lang, viewport, charset, one h1, skip link, landmarks", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.ok(meta("name", "viewport"), "viewport meta");
  assert.equal(attrs("h1").length, 1, "exactly one h1");
  assert.match(html, /class="skip" href="#main"/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<nav class="site-nav" aria-label="Site">/);
});

test("title, description and canonical position a product engineer at axelcedercreutz.fi", () => {
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.match(title, /Axel Cedercreutz/);
  assert.match(title, /Product Engineer/);
  const desc = attr(meta("name", "description"), "content");
  assert.ok(desc.length >= 80 && desc.length <= 300, `description length ${desc.length}`);
  assert.match(desc, /Product engineer/i);
  assert.match(desc, /RinkView/);
  assert.equal(attr(attrs("link").find((l) => attr(l, "rel") === "canonical"), "href"), "https://axelcedercreutz.fi/");
});

test("Open Graph and Twitter cards are complete and point at the canonical host", () => {
  for (const p of ["og:type", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) {
    assert.ok(meta("property", p), `missing ${p}`);
  }
  assert.equal(attr(meta("property", "og:url"), "content"), "https://axelcedercreutz.fi/");
  assert.equal(attr(meta("property", "og:image"), "content"), "https://axelcedercreutz.fi/assets/img/og.png");
  assert.ok(existsSync(resolve(root, "assets/img/og.png")), "assets/img/og.png must exist (npm run og)");
  assert.equal(attr(meta("name", "twitter:card"), "content"), "summary_large_image");
  assert.ok(meta("name", "twitter:title") && meta("name", "twitter:description") && meta("name", "twitter:image"));
});

test("JSON-LD is valid and describes a Person who is a Product Engineer", () => {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld["@type"], "Person");
  assert.equal(ld.name, "Axel Cedercreutz");
  assert.equal(ld.jobTitle, "Product Engineer");
  assert.equal(ld.url, "https://axelcedercreutz.fi/");
  for (const u of ld.sameAs) assert.ok(registry.some((l) => l.url === u), `sameAs ${u} not in links.json`);
});

test("hero puts Product Engineer above the fold, with hockey analytics as the secondary theme", () => {
  const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/)[0];
  assert.match(hero, /Product engineer/);
  assert.match(hero, /hockey/i);
  assert.match(hero, /href="#rinkview"/, "primary CTA goes to RinkView");
  assert.match(hero, /href="#experience"/, "secondary CTA goes to work history");
});

test("featured projects appear in the required order: RinkView, Banger Board, Budgy", () => {
  const order = [...html.matchAll(/data-project="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["rinkview", "banger-board", "budgy"]);
  const idx = (s) => html.indexOf(s);
  assert.ok(idx('id="work"') < idx('id="experience"'), "work history follows featured work");
  assert.ok(idx('id="experience"') < idx('id="contact"'));
});

test("each case study has a summary, evidence and links block", () => {
  for (const id of ["rinkview", "banger-board", "budgy"]) {
    const art = html.match(new RegExp(`<article class="case" id="${id}"[\\s\\S]*?<\\/article>`))[0];
    assert.match(art, /class="tagline"/, `${id} tagline`);
    assert.match(art, /<h4>The problem<\/h4>/, `${id} problem`);
    assert.match(art, /class="links"/, `${id} links block`);
    assert.match(art, /<dt>Role<\/dt>/, `${id} role`);
  }
  assert.match(html.match(/id="rinkview"[\s\S]*?<\/article>/)[0], /class="receipts"/, "RinkView has evidence receipts");
  assert.match(html.match(/id="rinkview"[\s\S]*?<\/article>/)[0], /rinkview-670251302746\.europe-north1\.run\.app/, "RinkView live CTA");
});

test("every in-page anchor resolves to an id", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(target), `broken anchor #${target}`);
});

test("every external link is https (or mailto) and registered in content/links.json with a source", () => {
  const known = new Map(registry.map((l) => [l.url, l]));
  for (const l of registry) assert.ok(l.source && l.source.length > 10, `links.json entry ${l.url} needs a source note`);
  const hrefs = [...html.matchAll(/<a [^>]*href="([^"#][^"]*)"/g)].map((m) => m[1]).filter((h) => /^(https?:|mailto:)/.test(h));
  assert.ok(hrefs.length >= 6, "expected external links");
  for (const h of hrefs) {
    assert.ok(!h.startsWith("http:"), `insecure link ${h}`);
    assert.ok(known.has(h), `external link not in content/links.json (no guessed URLs): ${h}`);
  }
  for (const [h] of html.matchAll(/<a [^>]*href="https:[^"]*"[^>]*>/g)) assert.match(h, /rel="[^"]*noopener/, `external anchor without rel=noopener: ${h}`);
});

test("no team affiliation is implied", () => {
  assert.doesNotMatch(text, /red wings/i);
  assert.doesNotMatch(text, /detroit/i);
  assert.doesNotMatch(text, /utah|mammoth/i, "the demo dataset's original club must not read as an affiliation");
});

test("unconfirmed facts are marked, enumerable and never silently absent", () => {
  const todos = [...html.matchAll(/data-todo="([^"]*)"/g)].map((m) => m[1]);
  // 'TODO' as a bare word must not leak into visible copy; unconfirmed facts use data-todo instead.
  assert.doesNotMatch(text, /\bTODO\b/);
  for (const t of todos) assert.ok(t.length > 12, `data-todo needs a descriptive note: "${t}"`);
  // Placeholder metrics are forbidden: no "X%", "N users", "lorem".
  assert.doesNotMatch(text, /\bX%|\bN users\b|lorem ipsum|\[metric\]|\[number\]/i);
});

test("images exist, carry alt text and intrinsic dimensions, and stay lightweight", () => {
  const imgs = attrs("img");
  assert.ok(imgs.length >= 2);
  let total = 0;
  for (const img of imgs) {
    const src = attr(img, "src");
    const file = resolve(root, src);
    assert.ok(existsSync(file), `missing image ${src}`);
    assert.ok((attr(img, "alt") || "").length > 20, `alt text too short on ${src}`);
    assert.ok(attr(img, "width") && attr(img, "height"), `width/height missing on ${src}`);
    assert.match(img, /loading="lazy"/, `${src} should lazy-load (below the fold)`);
    total += statSync(file).size;
  }
  assert.ok(total < 800 * 1024, `images total ${Math.round(total / 1024)} KB, keep under 800 KB`);
});

test("privacy and performance: no scripts besides JSON-LD, no third-party requests, self-hosted fonts", () => {
  const scripts = attrs("script");
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /application\/ld\+json/);
  for (const [, url] of html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)) {
    // Only anchors may reach external hosts; resources must be relative.
    const isAnchor = new RegExp(`<a [^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(html);
    const isMeta = new RegExp(`<(?:meta|link rel="canonical")[^>]*(?:content|href)="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(html);
    assert.ok(isAnchor || isMeta, `external resource request: ${url}`);
  }
  assert.doesNotMatch(css, /url\(\s*["']?https?:/, "CSS must not load remote resources");
  for (const f of ["assets/fonts/InstrumentSerif-Regular.woff2", "assets/fonts/InstrumentSerif-Italic.woff2", "assets/fonts/OFL-InstrumentSerif.txt", "favicon.svg"]) {
    assert.ok(existsSync(resolve(root, f)), `missing ${f}`);
  }
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /prefers-reduced-motion/);
});

test("heading levels do not skip", () => {
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const l of levels) { assert.ok(l <= prev + 1, `heading jumps from h${prev} to h${l}`); prev = l; }
});
