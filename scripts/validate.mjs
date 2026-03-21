import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const index = readFileSync(resolve(root, "index.html"), "utf-8");
const hrefRe = /class="report-row"[^>]*href="([^"]+)"/g;

let total = 0;
let missing = 0;
let match;

while ((match = hrefRe.exec(index)) !== null) {
  total++;
  const href = match[1];
  if (href.startsWith("http")) continue;
  const target = resolve(root, href);
  if (!existsSync(target)) {
    console.error("MISSING: " + href);
    missing++;
  }
}

const dataFiles = readdirSync(resolve(root, "data")).filter((f) =>
  f.endsWith(".html")
);
const downloadFiles = existsSync(resolve(root, "data/downloads"))
  ? readdirSync(resolve(root, "data/downloads"))
  : [];

const wyTags = (index.match(/data-tags="[^"]*wy[^"]*"/g) || []).length;
const wyClient = (index.match(/data-client="wy"/g) || []).length;

console.log("");
console.log("  Reports Hub Validation");
console.log("  ----------------------");
console.log("  Hub rows:       " + total);
console.log("  HTML in data/:  " + dataFiles.length);
console.log("  Downloads:      " + downloadFiles.length);
console.log("  Missing hrefs:  " + missing);
console.log("  Wy references:  " + (wyTags + wyClient));

const ok = missing === 0 && wyTags + wyClient === 0;
console.log("");
console.log("  " + (ok ? "All good" : "Issues found"));
console.log("");
