import type { APIContext } from "astro";
import { site } from "../data/site";

// Everything on this site is meant to be read: by people, search engines and AI assistants alike.
// The blocks are explicit so the policy is visible and easy to change per crawler. To keep a page out of
// AI training while staying citable in AI search, disallow the training crawlers (GPTBot, ClaudeBot,
// Google-Extended, Applebot-Extended, CCBot, Bytespider) and leave the search and user-fetch agents alone.
const crawlers = {
  search: ["Googlebot", "Bingbot", "DuckDuckBot", "Applebot"],
  aiSearch: ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Amazonbot", "MistralAI-User"],
  aiTraining: ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider", "meta-externalagent"],
};

export function GET(context: APIContext) {
  const origin = (context.site ?? new URL(site.url)).origin; // https://axelcedercreutz.fi
  const block = (agents: string[], comment: string) =>
    [`# ${comment}`, ...agents.map((a) => `User-agent: ${a}`), "Allow: /", ""].join("\n");
  const body = [
    "# axelcedercreutz.fi — open to search engines and AI assistants. Machine-readable summary: /llms.txt",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    block(crawlers.search, "Search engines"),
    block(crawlers.aiSearch, "AI search and on-demand fetches (citations in answers)"),
    block(crawlers.aiTraining, "AI training crawlers. Change Allow to Disallow here to opt out of training only."),
    `Sitemap: ${origin}/sitemap-index.xml`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
