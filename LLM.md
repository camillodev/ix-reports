# LLM Guide — IX Reports

Instructions for LLMs generating or modifying reports in this codebase.

## Gold Standard

`data/plano-automacao.html` is the reference implementation. All reports must follow its structure.

## Report Checklist

Every `data/*.html` report MUST have:

1. `<link href="../assets/css/report.css" rel="stylesheet">` — always with `../` prefix (files live in `data/`)
2. `<style>` block AFTER the `<link>`, never before — for report-specific overrides only
3. `<body class="ix-report">` — additional classes ok (e.g., `ix-report manifesto-page`)
4. `<header class="topbar">` with back-btn, brand, topbar-title
5. `<nav class="tab-nav" role="tablist">` with at least one tab-btn
6. First tab-panel contains `report-header` with: hdr-brand, hdr-title, hdr-sub, hdr-meta
7. `<footer>` with brand
8. `<script src="../assets/js/report.js"></script>` before `</body>`

## Available CSS Variables

From `report.css`:
```
--ix-ink, --ix-muted, --ix-green, --ix-green-dark, --ix-green-light,
--ix-green-bg, --ix-green-tint, --ix-surface, --ix-surface-2,
--ix-card-bg, --ix-border, --ix-bg, --ix-shadow-sm, --ix-shadow-md,
--ix-radius-sm (10px), --ix-radius-md (16px), --ix-radius-lg (22px),
--ix-font, --ix-font-mono, --ix-yellow, --ix-warning, --ix-danger
```

## Available CSS Components

From `report.css` — use these instead of custom styles:
- `.content` — main content wrapper with padding
- `.metrics-grid` + `.metric-card` — KPI cards grid
- `.callout.info` / `.callout.warning` / `.callout.success` — callout boxes
- `table` — auto-styled tables
- `.badge` + `.badge-green` / `.badge-orange` / `.badge-red` — status badges
- `.tab-panel` + `.tab-btn` — tab system (handled by report.js)
- `.report-header` + `.hdr-brand` / `.hdr-title` / `.hdr-sub` / `.hdr-meta` — report header

## reports.json Entry

When adding a report, add to `data/reports.json`:
```json
{
  "title": "Report Title",
  "slug": "kebab-case-slug",
  "file": "kebab-case-slug.html",
  "date": "YYYY-MM-DD",
  "meta": "DD Mon YYYY · Brief description",
  "client": "impact-x|kumon|g2i|pessoal",
  "project": "project-slug-from-clients-json",
  "tags": ["estrategia", "financeiro", "people", "operacoes", "comercial", "cultura", "legal", "tech", "ritual"],
  "icon": "file-earmark-text",
  "type": "html",
  "access": "public|empresa|pessoal|private",
  "allowedTokens": ["ix_inv_token1"]
}
```

### Access Levels

| Level | File Path | Who Sees |
|-------|-----------|----------|
| `public` | `data/{file}` | Everyone |
| `empresa` | `data/{file}` | Company token holders |
| `pessoal` | `data/private/{file}` | Owner token only |
| `private` | `data/private/{file}` | Specific invite tokens in `allowedTokens` |

Default is `"public"` — omitting `access` field means public.

### MCP Publishing

Use the MCP server (`mcp/`) to publish reports programmatically:
- Tool `publish_report`: pushes HTML + updates reports.json atomically
- Tool `list_reports`: lists reports with optional filters
- Config: set `GITHUB_TOKEN` env var with a PAT that has repo write access

## Clients

Defined in `data/clients.json`. Valid client slugs: `impact-x`, `kumon`, `g2i`, `pessoal`.

## Rules

1. Never modify `plano-automacao.html` — it's the gold standard
2. Never use absolute paths for CSS/JS — always relative with `../`
3. Never put CSS before the report.css `<link>` tag
4. Always use `var(--ix-*)` tokens instead of hardcoded colors
5. Keep report-specific `<style>` blocks minimal — override only, don't redefine base styles
6. Run `node scripts/validate.mjs` after changes
