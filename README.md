# IX Reports

Reports hub for Impact X — reports.rafaelcamillo.com

## Stack

- Vanilla HTML/CSS/JS (no framework)
- Static site deployed on Vercel
- amCharts 5 (CDN) for dashboard charts

## Structure

```
index.html              # Hub — sidebar tree + main content
assets/
  css/
    tokens.css          # Design tokens (colors, spacing, z-index)
    hub.css             # Hub-specific styles
    report.css          # Shared report chrome (topbar, tabs, typography)
    cmd-k.css           # Command palette styles
    timeline.css        # Timeline view styles
  js/
    hub.js              # Hub logic (sidebar tree, filters, router)
    cmd-k.js            # Cmd+K command palette
    timeline.js         # Timeline view
    charts.js           # amCharts dashboard
    report.js           # Shared report JS (tabs, back btn)
data/
  reports.json          # Report registry (title, slug, date, client, project, tags)
  clients.json          # Client/project metadata (name, color, icon, projects)
  *.html                # Individual report files
  downloads/            # PDF/MD files
scripts/
  validate.mjs          # Validates reports.json, clients.json, file existence
vercel.json             # Redirect rules (old filenames -> new slugs)
```

## How to run locally

```bash
npx serve .
# or
python3 -m http.server 8000
```

Open http://localhost:8000

## How to add a report

1. Create `data/your-report.html` following the gold standard (`data/plano-automacao.html`)
2. Add entry to `data/reports.json`
3. Run `node scripts/validate.mjs` to check
4. If the report's `client` or `project` don't exist in `data/clients.json`, add them

## reports.json schema

```json
{
  "title": "Report Title",
  "slug": "report-slug",
  "file": "report-slug.html",
  "date": "2026-03-22",
  "meta": "22 Mar 2026 · Short description",
  "client": "impact-x",
  "project": "automacao",
  "tags": ["tech", "operacoes"],
  "icon": "file-earmark-text",
  "type": "html",
  "num": "01",
  "description": "Optional longer description",
  "status": "published",
  "pinned": false
}
```

Required: `title`, `slug`, `file`, `date`, `client`, `tags`, `type`.
Optional: `meta`, `project`, `icon`, `num`, `description`, `status`, `pinned`, `quarter`.

## Report HTML template

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Impact X — Report Title</title>
<link href="../assets/css/report.css" rel="stylesheet">
<style>
/* Report-specific overrides only */
</style>
</head>
<body class="ix-report">

<header class="topbar">
  <button type="button" class="back-btn" aria-label="Voltar">← Voltar</button>
  <a href="/" class="brand">IMPACT <span class="x">X</span></a>
  <span class="topbar-title">Report Title</span>
</header>

<nav class="tab-nav" role="tablist">
  <button type="button" class="tab-btn active" data-tab="overview">Overview</button>
</nav>

<div class="tab-panel active" data-tab="overview" role="tabpanel">
  <div class="report-header">
    <div class="hdr-brand">IMPACT <span class="x">X</span></div>
    <div class="hdr-title">Report Title</div>
    <div class="hdr-sub">Subtitle</div>
    <div class="hdr-meta"><span>Date</span><span>Author</span></div>
  </div>
  <div class="content">
    <!-- content here -->
  </div>
</div>

<footer>
  <div class="brand">IMPACT <span class="x">X</span></div>
  Feito por Impact X — Rafael Camillo
</footer>

<script src="../assets/js/report.js"></script>
</body>
</html>
```

## Deploy

Push to `master` branch. Vercel auto-deploys.

## Tests

```bash
node scripts/validate.mjs    # Validates JSON schemas and file existence
node scripts/test.mjs         # Runs all verification tests
```
