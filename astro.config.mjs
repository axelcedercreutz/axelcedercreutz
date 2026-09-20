// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://axelcedercreutz.fi",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  markdown: { shikiConfig: { themes: { light: "github-light", dark: "github-dark" } } },
});
