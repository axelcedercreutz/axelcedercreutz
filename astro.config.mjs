// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  markdown: { shikiConfig: { themes: { light: "github-light", dark: "github-dark" } } },
});
