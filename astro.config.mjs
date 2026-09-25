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

// Every absolute URL on the site (canonical, Open Graph, sitemap, feed, robots, llms.txt, structured data)
// points at the domain, whatever host the build is served from. Vercel previews describe the real site too.
const origin = "https://axelcedercreutz.fi";

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
