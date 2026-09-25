import type { APIContext } from "astro";
import { llmsIndex } from "../lib/llms";
import { site } from "../data/site";

export async function GET(context: APIContext) {
  const origin = (context.site ?? new URL(site.url)).origin;
  return new Response(await llmsIndex(origin), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
