// Builds /llms.txt and /llms-full.txt (https://llmstxt.org): a Markdown summary of the site for AI
// assistants, generated from the same content collections as the pages so it can never drift.
import { getCollection } from "astro:content";
import { site } from "../data/site";

const strip = (md: string) =>
  md
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function llmsSources() {
  const work = (await getCollection("work")).sort((a, b) => a.data.order - b.data.order);
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  return { work, posts };
}

export async function llmsIndex(origin: string) {
  const { work, posts } = await llmsSources();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} is a ${site.role.toLowerCase()} based in ${site.location}. Product engineer at ${site.employer.name} (${site.employer.blurb}) since ${site.employer.since}; before that five years at ${site.previous.name} (formerly ${site.previous.formerly}, ${site.previous.blurb}) as software engineer and analytics lead. MSc in Computer Science from Aalto University. Contact: ${site.email}. Profiles: ${site.github}, ${site.linkedin}.`,
    "",
    "This site has no cookies, trackers or third-party requests. All pages are static HTML; the full text of every page is in /llms-full.txt.",
    "",
    "## Pages",
    "",
    `- [Home](${origin}/): who Axel is and the three products he built and runs.`,
    `- [About](${origin}/about): work history, education, languages, smaller public projects.`,
    `- [Work](${origin}/work): index of the case studies.`,
    `- [Writing](${origin}/blog): blog posts. RSS at ${origin}/rss.xml.`,
    "",
    "## Case studies",
    "",
    ...work.map((w) => `- [${w.data.title}](${origin}/work/${w.id}): ${w.data.summary}`),
    "",
    "## Posts",
    "",
    ...(posts.length ? posts.map((p) => `- [${p.data.title}](${origin}/blog/${p.id}): ${p.data.description} (${p.data.pubDate.toISOString().slice(0, 10)})`) : ["- No posts yet."]),
    "",
    "## Optional",
    "",
    `- [Full text](${origin}/llms-full.txt): every case study and post in Markdown.`,
    `- [Source](${site.repo}): the repository this site is built from.`,
    "",
  ];
  return lines.join("\n");
}

export async function llmsFull(origin: string) {
  const { work, posts } = await llmsSources();
  const out = [await llmsIndex(origin), "---", ""];
  for (const w of work) {
    const d = w.data;
    out.push(
      `# ${d.title}`,
      "",
      `URL: ${origin}/work/${w.id}`,
      `Tagline: ${d.tagline}`,
      `Role: ${d.role}`,
      `Year: ${d.year}`,
      `Status: ${d.status}`,
      `Stack: ${d.stack.join(", ")}`,
      ...(d.links.length ? [`Links: ${d.links.map((l) => `${l.label} <${l.href}>`).join("; ")}`] : []),
      ...(d.stats.length ? ["", "Key numbers:", ...d.stats.map((s) => `- ${s.value} ${s.label}`)] : []),
      ...(d.evidence.length ? ["", "Evidence:", ...d.evidence.map((e) => `- ${e.claim} (source: ${e.source})`)] : []),
      "",
      strip(w.body ?? ""),
      "",
      "---",
      "",
    );
  }
  for (const p of posts) {
    out.push(
      `# ${p.data.title}`,
      "",
      `URL: ${origin}/blog/${p.id}`,
      `Published: ${p.data.pubDate.toISOString().slice(0, 10)}`,
      ...(p.data.updatedDate ? [`Updated: ${p.data.updatedDate.toISOString().slice(0, 10)}`] : []),
      ...(p.data.tags.length ? [`Tags: ${p.data.tags.join(", ")}`] : []),
      "",
      strip(p.body ?? ""),
      "",
      "---",
      "",
    );
  }
  return out.join("\n");
}
