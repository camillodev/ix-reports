/**
 * One-off / batch: add shared report.css, topbar, tab panels to diagnostic HTML files.
 * Usage: node scripts/migrate-report-layout.mjs
 */
import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "data");

function extractDiv(html, className) {
  const open = `<div class="${className}">`;
  const start = html.indexOf(open);
  if (start === -1) return "";
  let i = start + open.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const o = html.indexOf("<div", i);
    const c = html.indexOf("</div>", i);
    if (c === -1) break;
    if (o !== -1 && o < c) {
      depth++;
      i = o + 4;
    } else {
      depth--;
      i = c + 6;
    }
  }
  return html.slice(start, i);
}

function stripStyle(html) {
  return html.replace(/<style>[\s\S]*?<\/style>/i, "");
}

function topbarHtml(shortTitle) {
  return `<header class="topbar">
  <button type="button" class="back-btn" aria-label="Voltar">← Voltar</button>
  <a href="/" class="brand">IMPACT <span class="x">X</span></a>
  <span class="topbar-title">${shortTitle}</span>
</header>`;
}

function migrateIndex(path) {
  let html = fs.readFileSync(path, "utf8");
  html = stripStyle(html);
  const headEnd = html.indexOf("</head>");
  const link =
    '\n<link rel="stylesheet" href="../assets/css/report.css">\n';
  html = html.slice(0, headEnd) + link + html.slice(headEnd);
  html = html.replace("<body>", '<body class="ix-report">');
  const hdr = extractDiv(html, "hdr");
  const titleMatch = html.match(/<div class="hdr-title">([^<]*)/);
  const shortTitle = titleMatch
    ? titleMatch[1].replace(/&amp;/g, "&").trim()
    : "Índice";
  const c0 = html.indexOf('<div class="content">');
  const f0 = html.indexOf("<footer>");
  if (c0 === -1 || f0 === -1) throw new Error("index: content/footer not found");
  const inner = html.slice(
    c0 + '<div class="content">'.length,
    f0
  ).trim();
  const footer = html.slice(f0, html.indexOf("</body>"));
  const head = html.slice(0, html.indexOf("<body"));
  const out =
    head +
    `<body class="ix-report">
${topbarHtml(shortTitle)}

<nav class="tab-nav" role="tablist">
  <button type="button" class="tab-btn active" data-tab="index" role="tab">Índice</button>
</nav>

${hdr}

<div class="tab-panel active" data-tab="index" id="panel-index" role="tabpanel" aria-hidden="false">
<div class="content">
${inner}
</div>
</div>

${footer}
<script src="../assets/js/report.js"></script>
</body>
</html>`;
  fs.writeFileSync(path, out);
}

function tabLabelFromH1(h1Inner) {
  let t = h1Inner.replace(/<[^>]+>/g, "").trim();
  t = t.replace(/^\d+\.\s*/, "");
  if (t.length > 40) t = t.slice(0, 38) + "…";
  return t || "Seção";
}

function migrateMultiSection(path, shortTitleOverride) {
  let html = fs.readFileSync(path, "utf8");
  html = stripStyle(html);
  const headEnd = html.indexOf("</head>");
  html =
    html.slice(0, headEnd) +
    '\n<link rel="stylesheet" href="../assets/css/report.css">\n' +
    html.slice(headEnd);
  html = html.replace("<body>", '<body class="ix-report">');
  const hdr = extractDiv(html, "hdr");
  const titleMatch = html.match(/<div class="hdr-title">([^<]*)/);
  const shortTitle =
    shortTitleOverride ||
    (titleMatch
      ? titleMatch[1].replace(/&amp;/g, "&").trim()
      : "Relatório");
  const c0 = html.indexOf('<div class="content">');
  const f0 = html.indexOf("<footer>");
  if (c0 === -1 || f0 === -1) throw new Error("content/footer not found " + path);
  let inner = html.slice(
    c0 + '<div class="content">'.length,
    f0
  );
  const footer = html.slice(f0, html.indexOf("</body>"));
  const head = html.slice(0, html.indexOf("<body"));

  const marker = "<section";
  const indices = [];
  let pos = 0;
  while (true) {
    const i = inner.indexOf(marker, pos);
    if (i === -1) break;
    indices.push(i);
    pos = i + 1;
  }
  if (indices.length === 0) throw new Error("no sections " + path);

  const sections = [];
  for (let k = 0; k < indices.length; k++) {
    const from = indices[k];
    const to = k + 1 < indices.length ? indices[k + 1] : inner.length;
    let chunk = inner.slice(from, to).trim();
    let idMatch = chunk.match(/^<section\s+id="([^"]+)"/);
    let sid;
    if (idMatch) {
      sid = idMatch[1];
    } else {
      sid = `sec-${k + 1}`;
      chunk = chunk.replace(/^<section>/, `<section id="${sid}">`);
    }
    const h1m = chunk.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const label = h1m ? tabLabelFromH1(h1m[1]) : `§${k + 1}`;
    sections.push({ id: sid, label, chunk });
  }

  const nav = sections
    .map(
      (s, i) =>
        `  <button type="button" class="tab-btn${i === 0 ? " active" : ""}" data-tab="${s.id}" role="tab">${s.label}</button>`
    )
    .join("\n");

  const panels = sections
    .map((s, i) => {
      const act = i === 0 ? " active" : "";
      const ah = i === 0 ? "false" : "true";
      const pre = i === 0 ? `${hdr}\n` : "";
      return `${pre}<div class="tab-panel${act}" data-tab="${s.id}" id="panel-${s.id}" role="tabpanel" aria-hidden="${ah}">
<div class="content">
${s.chunk}
</div>
</div>`;
    })
    .join("\n\n");

  const out =
    head +
    `<body class="ix-report">
${topbarHtml(shortTitle)}

<nav class="tab-nav" role="tablist">
${nav}
</nav>

${panels}

${footer}
<script src="../assets/js/report.js"></script>
</body>
</html>`;
  fs.writeFileSync(path, out);
}

function migrateReportHeaderMulti(path, shortTitleOverride) {
  let html = fs.readFileSync(path, "utf8");
  html = stripStyle(html);
  const headEnd = html.indexOf("</head>");
  html =
    html.slice(0, headEnd) +
    '\n<link rel="stylesheet" href="../assets/css/report.css">\n' +
    html.slice(headEnd);
  html = html.replace("<body>", '<body class="ix-report">');
  const hdr = extractDiv(html, "report-header");
  const titleMatch = html.match(/<div class="report-title">([^<]*)/);
  const shortTitle =
    shortTitleOverride ||
    (titleMatch
      ? titleMatch[1].replace(/<br\s*\/?>/gi, " ").replace(/&amp;/g, "&").trim()
      : "Documento");
  const c0 = html.indexOf('<div class="content">');
  const f0 = html.indexOf("<footer>");
  if (c0 === -1 || f0 === -1) throw new Error("content/footer not found " + path);
  let inner = html.slice(
    c0 + '<div class="content">'.length,
    f0
  );
  const footer = html.slice(f0, html.indexOf("</body>"));
  const head = html.slice(0, html.indexOf("<body"));

  const marker = "<section";
  const indices = [];
  let pos = 0;
  while (true) {
    const i = inner.indexOf(marker, pos);
    if (i === -1) break;
    indices.push(i);
    pos = i + 1;
  }
  if (indices.length === 0) throw new Error("no sections " + path);

  const sections = [];
  for (let k = 0; k < indices.length; k++) {
    const from = indices[k];
    const to = k + 1 < indices.length ? indices[k + 1] : inner.length;
    let chunk = inner.slice(from, to).trim();
    let idMatch = chunk.match(/^<section\s+id="([^"]+)"/);
    let sid;
    if (idMatch) {
      sid = idMatch[1];
    } else {
      sid = `sec-${k + 1}`;
      chunk = chunk.replace(/^<section>/, `<section id="${sid}">`);
    }
    const h1m = chunk.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const label = h1m ? tabLabelFromH1(h1m[1]) : `§${k + 1}`;
    sections.push({ id: sid, label, chunk });
  }

  const nav = sections
    .map(
      (s, i) =>
        `  <button type="button" class="tab-btn${i === 0 ? " active" : ""}" data-tab="${s.id}" role="tab">${s.label}</button>`
    )
    .join("\n");

  const panels = sections
    .map((s, i) => {
      const act = i === 0 ? " active" : "";
      const ah = i === 0 ? "false" : "true";
      const pre = i === 0 ? `${hdr}\n` : "";
      return `${pre}<div class="tab-panel${act}" data-tab="${s.id}" id="panel-${s.id}" role="tabpanel" aria-hidden="${ah}">
<div class="content">
${s.chunk}
</div>
</div>`;
    })
    .join("\n\n");

  const out =
    head +
    `<body class="ix-report">
${topbarHtml(shortTitle)}

<nav class="tab-nav" role="tablist">
${nav}
</nav>

${panels}

${footer}
<script src="../assets/js/report.js"></script>
</body>
</html>`;
  fs.writeFileSync(path, out);
}

const indexFile = resolve(dataDir, "ImpactX_Diagnostico_00_Index_202603.html");
const multiFiles = [
  "ImpactX_Diagnostico_01_ModeloNegocio_202603.html",
  "ImpactX_Diagnostico_02_ProjecaoFinanceira_202603.html",
  "ImpactX_Diagnostico_05_EstrategiaComercial_202603.html",
  "ImpactX_Diagnostico_06_Metricas_202603.html",
  "ImpactX_Diagnostico_07_TimeMinimo_202603.html",
  "ImpactX_Diagnostico_08_Roadmap2026_202603.html",
  "ImpactX_Diagnostico_09_ActionItems_202603.html",
  "ImpactX_Diagnostico_10_G2iEntrevista_202603.html",
  "ImpactX_Diagnostico_11_ProcessoComercialMVP_202603.html",
];

const instFiles = [
  "ImpactX_MissaoVisaoValores_202603.html",
  "ImpactX_CulturaePeople_202603.html",
  "ImpactX_SistemaClaudeOS_202603.html",
  "ImpactX_AnaliseFinanceiraKumon_202606.html",
  "ImpactX_SkillsV2_MapaCompleto_202603.html",
];

const runDiag = process.argv.includes("--diag");
const runInst = process.argv.includes("--inst");
const runAll = !runDiag && !runInst;

if (runAll || runDiag) {
  migrateIndex(indexFile);
  for (const f of multiFiles) {
    migrateMultiSection(resolve(dataDir, f));
  }
  console.log("Diagnostics:", 1 + multiFiles.length);
}
if (runAll || runInst) {
  for (const f of instFiles) {
    migrateReportHeaderMulti(resolve(dataDir, f));
  }
  console.log("Institutional:", instFiles.length);
}
