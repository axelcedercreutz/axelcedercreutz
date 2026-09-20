import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const link = z.object({ label: z.string(), href: z.string().url() });

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      summary: z.string(),
      order: z.number().int(),
      year: z.string(),
      role: z.string(),
      status: z.string(),
      accent: z.enum(["ember", "ice", "moss"]).default("ember"),
      stack: z.array(z.string()),
      // Only URLs that exist in the project's own repo or docs. Anything else goes in `pending`.
      links: z.array(link).default([]),
      pending: z.array(z.string()).default([]),
      cover: image(),
      coverAlt: z.string(),
      gallery: z.array(z.object({ src: image(), alt: z.string(), caption: z.string() })).default([]),
      evidence: z.array(z.object({ claim: z.string(), source: z.string() })).default([]),
      stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, blog };
