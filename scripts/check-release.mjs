// Release gate: the page must carry no unconfirmed facts.
// Every claim still awaiting confirmation is marked with a data-todo attribute (visible in the review build).
// Exit 1 while any remain, listing them, so a deploy never ships a TODO.
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const todos = [...html.matchAll(/data-todo="([^"]*)"/g)].map((m) => m[1]);

if (todos.length) {
  console.error(`✖ ${todos.length} unconfirmed item(s) still marked data-todo in index.html:`);
  for (const t of todos) console.error(`  - ${t}`);
  console.error("\nConfirm each fact, remove its data-todo marker, and re-run.");
  process.exit(1);
}
console.log("✓ No data-todo markers left in index.html — release-clean.");
