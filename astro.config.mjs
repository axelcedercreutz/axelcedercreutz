// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readdirSync, readFileSync } from "node:fs";

// lastmod for posts comes from their frontmatter (updatedDate, else pubDate) so the sitemap tells crawlers
// what actually changed. Pages without a tracked date are listed without one, which is better than a fake.
const postDates = Object.fromEntries(
  readdirSync("src/content/blog")
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const fm = readFileSync(`src/content/blog/${f}`, "utf8");
      const date = (fm.match(/^updatedDate:\s*(\S+)/m) || fm.match(/^pubDate:\s*(\S+)/m) || [])[1];
      return [`/blog/${f.replace(/\.mdx?$/, "")}`, date];
    }),
);

// The canonical home is axelcedercreutz.fi. Until DNS points there, the build is served from Vercel's
// production URL, so absolute URLs (canonical, Open Graph image, sitemap, feed) follow the deployed origin:
// SITE_ORIGIN wins, then Vercel's production URL, then the domain. Once the domain is attached in Vercel,
// VERCEL_PROJECT_PRODUCTION_URL becomes the domain and nothing here needs to change.
const origin =
  process.env.SITE_ORIGIN ||
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL && process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "https://axelcedercreutz.fi");

export default defineConfig({
  site: origin,
  output: "static",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "always" },
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "");
        if (postDates[path]) item.lastmod = new Date(postDates[path]).toISOString();
        return item;
      },
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  markdown: { shikiConfig: { themes: { light: "github-light", dark: "github-dark" } } },
});
