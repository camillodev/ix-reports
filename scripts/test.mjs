/**
 * IX Reports — Verification Tests
 * Run: node scripts/test.mjs
 *
 * Pure JS tests that validate report structure, hub files,
 * JSON schemas, and cross-references before merge.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "data");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(name);
    console.error("  FAIL: " + name);
  }
}

// ─── Helpers ───
function readFile(path) {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

function loadJSON(path) {
  const content = readFile(path);
  return content ? JSON.parse(content) : null;
}

// ═══════════════════════════════════════════
// 1. reports.json and clients.json validity
// ═══════════════════════════════════════════
console.log("\n  1. JSON Schema Validation");
console.log("  -------------------------");

const reports = loadJSON(resolve(dataDir, "reports.json"));
const clients = loadJSON(resolve(dataDir, "clients.json"));

assert(reports !== null, "reports.json exists and is valid JSON");
assert(clients !== null, "clients.json exists and is valid JSON");
assert(Array.isArray(reports), "reports.json is an array");
assert(typeof clients === "object" && clients !== null, "clients.json is an object");

if (reports && clients) {
  // Required fields
  const requiredFields = ["title", "slug", "file", "date", "client", "tags", "type"];
  for (const r of reports) {
    for (const field of requiredFields) {
      assert(!!r[field], `Report "${r.slug || "?"}": has required field "${field}"`);
    }
  }

  // No duplicate slugs
  const slugs = reports.map((r) => r.slug);
  const uniqueSlugs = new Set(slugs);
  assert(slugs.length === uniqueSlugs.size, "No duplicate slugs in reports.json");

  // All clients referenced exist
  for (const r of reports) {
    if (r.client) {
      assert(!!clients[r.client], `Report "${r.slug}": client "${r.client}" exists in clients.json`);
    }
  }

  // All projects referenced exist in correct client
  for (const r of reports) {
    if (r.project && r.client && clients[r.client]) {
      const projects = clients[r.client].projects || {};
      assert(!!projects[r.project], `Report "${r.slug}": project "${r.project}" exists in clients.json[${r.client}]`);
    }
  }

  // Date format
  for (const r of reports) {
    if (r.date) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(r.date), `Report "${r.slug}": date format YYYY-MM-DD`);
    }
  }

  // Files exist
  for (const r of reports) {
    const filePath = resolve(dataDir, r.file);
    assert(existsSync(filePath), `Report "${r.slug}": file "data/${r.file}" exists`);
  }
}

// ═══════════════════════════════════════════
// 2. Report HTML structure validation
// ═══════════════════════════════════════════
console.log("\n  2. Report HTML Structure");
console.log("  -----------------------");

const htmlReports = reports ? reports.filter((r) => r.type === "html") : [];
const goldStandard = "plano-automacao.html";

for (const r of htmlReports) {
  const filePath = resolve(dataDir, r.file);
  const html = readFile(filePath);
  if (!html) continue;

  const name = r.file;

  // report.css link with correct path
  assert(
    html.includes('href="../assets/css/report.css"') || html.includes("href='../assets/css/report.css'"),
    `${name}: imports ../assets/css/report.css`
  );

  // <style> after <link> to report.css (not before)
  const linkIdx = html.indexOf("report.css");
  const styleIdx = html.indexOf("<style>");
  if (linkIdx !== -1 && styleIdx !== -1) {
    assert(styleIdx > linkIdx, `${name}: <style> comes AFTER report.css <link>`);
  }

  // body has ix-report class
  assert(
    /class="[^"]*ix-report[^"]*"/.test(html) || /class='[^']*ix-report[^']*'/.test(html),
    `${name}: <body> has ix-report class`
  );

  // topbar present
  assert(
    html.includes('class="topbar"'),
    `${name}: has <header class="topbar">`
  );

  // tab-nav present (can be <nav class="tab-nav">, <div class="tab-nav">, or class="tabs-nav tab-nav")
  assert(
    html.includes("tab-nav"),
    `${name}: has tab-nav element`
  );

  // report.js script
  assert(
    html.includes('src="../assets/js/report.js"') || html.includes("src='../assets/js/report.js'"),
    `${name}: imports ../assets/js/report.js`
  );

  // footer present (can be <footer> or <div class="report-footer">)
  assert(
    html.includes("<footer") || html.includes("report-footer"),
    `${name}: has footer`
  );
}

// ═══════════════════════════════════════════
// 3. Hub files exist
// ═══════════════════════════════════════════
console.log("\n  3. Hub Files");
console.log("  -----------");

const hubFiles = [
  "index.html",
  "assets/css/tokens.css",
  "assets/css/hub.css",
  "assets/css/cmd-k.css",
  "assets/js/hub.js",
  "assets/js/cmd-k.js",
  "vercel.json",
  "LLM.md",
];

for (const f of hubFiles) {
  assert(existsSync(resolve(root, f)), `${f} exists`);
}

// ═══════════════════════════════════════════
// 4. Hub index.html structure
// ═══════════════════════════════════════════
console.log("\n  4. Hub Structure");
console.log("  ----------------");

const indexHtml = readFile(resolve(root, "index.html"));
if (indexHtml) {
  assert(indexHtml.includes("tokens.css"), "index.html imports tokens.css");
  assert(indexHtml.includes("hub.css"), "index.html imports hub.css");
  assert(indexHtml.includes("cmd-k.css"), "index.html imports cmd-k.css");
  assert(indexHtml.includes("hub.js"), "index.html imports hub.js");
  assert(indexHtml.includes("cmd-k.js"), "index.html imports cmd-k.js");
  assert(indexHtml.includes("sidebar"), "index.html has sidebar");
  assert(indexHtml.includes("Cmd") || indexHtml.includes("cmd-k"), "index.html has Cmd+K trigger");
  assert(indexHtml.includes("theme-toggle") || indexHtml.includes("theme_toggle"), "index.html has theme toggle");
  assert(indexHtml.includes("data-theme") || indexHtml.includes("dark"), "index.html supports dark mode");
  assert(indexHtml.includes("sidebar-tree"), "index.html has clients section in sidebar");
  assert(indexHtml.includes("tag-filters"), "index.html has categories/tags section in sidebar");
  assert(indexHtml.includes("Relatorio"), "index.html brand is Relatorio X");
  assert(indexHtml.includes("view-toggle"), "index.html has view toggle (list/grid)");
}

// ═══════════════════════════════════════════
// 5. Vercel redirects
// ═══════════════════════════════════════════
console.log("\n  5. Vercel Redirects");
console.log("  ------------------");

const vercelJson = loadJSON(resolve(root, "vercel.json"));
if (vercelJson) {
  assert(Array.isArray(vercelJson.redirects), "vercel.json has redirects array");
  if (vercelJson.redirects) {
    for (const redirect of vercelJson.redirects) {
      assert(!!redirect.source, `Redirect has source: ${redirect.source}`);
      assert(!!redirect.destination, `Redirect "${redirect.source}" has destination`);
      // Check destination file exists
      const destPath = resolve(root, redirect.destination.replace(/^\//, ""));
      assert(existsSync(destPath), `Redirect destination exists: ${redirect.destination}`);
    }
  }
}

// ═══════════════════════════════════════════
// 6. Dark mode support
// ═══════════════════════════════════════════
console.log("\n  6. Dark Mode");
console.log("  -----------");

const hubCss = readFile(resolve(root, "assets/css/hub.css"));
if (hubCss) {
  assert(hubCss.includes('[data-theme="dark"]') || hubCss.includes("data-theme"), "hub.css has dark mode styles");
}

const tokensCss = readFile(resolve(root, "assets/css/tokens.css"));
if (tokensCss) {
  assert(tokensCss.includes('[data-theme="dark"]'), "tokens.css has dark mode variables");
}

// ═══════════════════════════════════════════
// 7. Mobile responsiveness
// ═══════════════════════════════════════════
console.log("\n  7. Mobile Responsive");
console.log("  -------------------");

if (hubCss) {
  assert(hubCss.includes("@media") && hubCss.includes("768"), "hub.css has mobile breakpoint at 768px");
  assert(hubCss.includes("sidebar-overlay") || hubCss.includes("overlay"), "hub.css has sidebar overlay for mobile");
}

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════
console.log("\n  ═══════════════════════════════");
console.log("  Total:  " + (passed + failed) + " tests");
console.log("  Passed: " + passed);
console.log("  Failed: " + failed);

if (failures.length > 0) {
  console.log("\n  Failures:");
  for (const f of failures) {
    console.log("    - " + f);
  }
}

console.log("  " + (failed === 0 ? "ALL TESTS PASSED" : failed + " TESTS FAILED"));
console.log("");

process.exit(failed > 0 ? 1 : 0);
