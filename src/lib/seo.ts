// Shared helpers for metadata and structured data. Absolute URLs always point at axelcedercreutz.fi
// (the `site` in astro.config.mjs), whatever host serves the build.
import type { AstroGlobal } from "astro";
import { site } from "../data/site";

export function siteOrigin(astro: Pick<AstroGlobal, "site">): string {
  return (astro.site ?? new URL(site.url)).origin;
}

export function absolute(astro: Pick<AstroGlobal, "site">, path: string): string {
  return new URL(path, siteOrigin(astro)).href;
}

/** Stable identifiers so every page's structured data points at the same Person and WebSite nodes. */
export function ids(astro: Pick<AstroGlobal, "site">) {
  const o = siteOrigin(astro);
  return { person: `${o}/#person`, website: `${o}/#website` };
}

export function personNode(astro: Pick<AstroGlobal, "site">) {
  const o = siteOrigin(astro);
  return {
    "@type": "Person",
    "@id": ids(astro).person,
    name: site.name,
    givenName: "Axel",
    familyName: "Cedercreutz",
    jobTitle: site.role,
    description: site.description,
    url: `${o}/`,
    image: `${o}/og.png`,
    email: `mailto:${site.email}`,
    sameAs: [site.github, site.linkedin],
    address: { "@type": "PostalAddress", addressLocality: "Helsinki", addressCountry: "FI" },
    worksFor: { "@type": "Organization", name: site.employer.name, url: site.employer.url },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Aalto University" },
    knowsLanguage: ["fi", "sv", "en"],
    knowsAbout: [
      "Product engineering", "Full-stack web development", "Data engineering", "Growth experiments",
      "Hockey analytics", "Expected goals models", "TypeScript", "Python", "React", "PostgreSQL", "BigQuery", "dbt",
    ],
  };
}

export function websiteNode(astro: Pick<AstroGlobal, "site">) {
  const o = siteOrigin(astro);
  return {
    "@type": "WebSite",
    "@id": ids(astro).website,
    name: site.name,
    url: `${o}/`,
    description: site.description,
    inLanguage: "en",
    author: { "@id": ids(astro).person },
    publisher: { "@id": ids(astro).person },
  };
}

/** Breadcrumbs from a path like /work/rinkview, with human labels for the fixed sections. */
export function breadcrumbNode(astro: Pick<AstroGlobal, "site">, path: string, leafName?: string) {
  const o = siteOrigin(astro);
  const labels: Record<string, string> = { work: "Work", blog: "Writing", about: "About" };
  const parts = path.split("/").filter(Boolean);
  const items = [{ name: "Home", url: `${o}/` }];
  parts.forEach((p, i) => {
    const url = `${o}/${parts.slice(0, i + 1).join("/")}`;
    const name = i === parts.length - 1 && leafName ? leafName : (labels[p] ?? p);
    items.push({ name, url });
  });
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function graph(nodes: Array<Record<string, unknown> | null | undefined>) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
