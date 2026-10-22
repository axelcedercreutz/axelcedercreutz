// Fails when the running Node is older than the floor in package.json "engines.node" (">=X.Y.Z").
// CI runs it before the build so a cached, unpatched runtime can never build or test the site.
// Raise the floor in package.json when Node ships a security release, e.g.
// https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
import { readFileSync } from "node:fs";

const spec = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).engines?.node ?? "";
const floor = spec.match(/^>=\s*(\d+)\.(\d+)\.(\d+)$/);
if (!floor) {
  console.error(`engines.node should be ">=X.Y.Z" for this check, found "${spec}"`);
  process.exit(1);
}
const want = floor.slice(1).map(Number);
const have = process.versions.node.split(".").map(Number);
const older = have[0] !== want[0] ? have[0] < want[0] : have[1] !== want[1] ? have[1] < want[1] : have[2] < want[2];
if (older) {
  console.error(`Node ${process.versions.node} is older than the patched floor ${want.join(".")} (engines.node ${spec}).`);
  process.exit(1);
}
console.log(`Node ${process.versions.node} meets the floor ${want.join(".")}.`);
