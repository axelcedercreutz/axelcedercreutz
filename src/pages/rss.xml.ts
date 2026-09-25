import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { site } from "../data/site";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const origin = (context.site ?? new URL(site.url)).origin;
  return rss({
    title: `${site.name} — writing`,
    description: "Notes from the build: short, specific posts about how things were made and what went sideways.",
    site: context.site ?? site.url,
    trailingSlash: false,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}`,
      categories: p.data.tags,
      author: site.email + ` (${site.name})`,
    })),
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>en</language><atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>`,
  });
}
