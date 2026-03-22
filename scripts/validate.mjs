import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "data");

let errors = 0;

function fail(msg) {
  console.error("  FAIL: " + msg);
  errors++;
}

// ─── Load reports.json ───
const reportsPath = resolve(dataDir, "reports.json");
if (!existsSync(reportsPath)) {
  fail("data/reports.json missing");
  process.exit(1);
}
const reports = JSON.parse(readFileSync(reportsPath, "utf-8"));

// ─── Load clients.json ───
const clientsPath = resolve(dataDir, "clients.json");
if (!existsSync(clientsPath)) {
  fail("data/clients.json missing");
  process.exit(1);
}
const clients = JSON.parse(readFileSync(clientsPath, "utf-8"));

// ─── Validate reports ───
const requiredFields = ["title", "slug", "file", "date", "client", "tags", "type"];

for (const r of reports) {
  // Required fields
  for (const field of requiredFields) {
    if (!r[field]) fail(`Report "${r.slug || r.title || "?"}": missing field "${field}"`);
  }

  // File exists
  const filePath = resolve(dataDir, r.file);
  if (!existsSync(filePath)) {
    fail(`Report "${r.slug}": file "data/${r.file}" not found`);
  }

  // Client exists in clients.json
  if (r.client && !clients[r.client]) {
    fail(`Report "${r.slug}": client "${r.client}" not in clients.json`);
  }

  // Project exists in correct client
  if (r.project && r.client && clients[r.client]) {
    const clientProjects = clients[r.client].projects || {};
    if (!clientProjects[r.project]) {
      fail(`Report "${r.slug}": project "${r.project}" not in clients.json[${r.client}].projects`);
    }
  }

  // Tags is array
  if (r.tags && !Array.isArray(r.tags)) {
    fail(`Report "${r.slug}": tags must be an array`);
  }

  // Date format YYYY-MM-DD
  if (r.date && !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
    fail(`Report "${r.slug}": date "${r.date}" not in YYYY-MM-DD format`);
  }
}

// ─── Duplicate slugs ───
const slugs = reports.map((r) => r.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
for (const d of dupes) fail(`Duplicate slug: "${d}"`);

// ─── Summary ───
const dataFiles = readdirSync(dataDir).filter((f) => f.endsWith(".html"));
const downloadFiles = existsSync(resolve(dataDir, "downloads"))
  ? readdirSync(resolve(dataDir, "downloads"))
  : [];

console.log("");
console.log("  Reports Hub Validation");
console.log("  ----------------------");
console.log("  JSON entries:   " + reports.length);
console.log("  HTML in data/:  " + dataFiles.length);
console.log("  Downloads:      " + downloadFiles.length);
console.log("  Clients:        " + Object.keys(clients).length);
console.log("  Errors:         " + errors);
console.log("");
console.log("  " + (errors === 0 ? "All good" : errors + " issue(s) found"));
console.log("");

if (errors > 0) process.exit(1);
