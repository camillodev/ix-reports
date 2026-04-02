# ix-reports SKILL.md — Patch: Visual Style Guidelines

**Instrução**: Cole este bloco ANTES da seção "## CSS Components Available" no arquivo `~/.claude/skills/ix-reports/SKILL.md`

---

## Visual Style — Gold Standard (Pimenta style)

Every new report MUST follow these visual principles. The reference is
`ImpactX_EstrategiaComercialPimenta_202603.html`.

### Mandatory rules

1. **No gradients** — NEVER use `linear-gradient` or `radial-gradient` on hero
   sections, backgrounds, or cards. Background is always white (`#fff`) or
   `var(--ix-bg)`.
2. **No dark hero sections** — Use `.report-header[data-ix-watermark="X"]`
   instead. Light background, green tint, watermark "X".
3. **Spacious, web-native layout** — generous padding, wide `max-width`,
   breathing room between sections (`margin-bottom: 24–32px`).
4. **Few accent colors** — stick to green (`var(--ix-green)`) as primary accent.
   Use Tailwind-style tint pills for status (see below). Avoid adding new
   colors unless essential.
5. **Minimal custom CSS** — the `<style>` block should ONLY contain
   report-specific components (pills, small cards, grids). Everything else
   comes from `report.css`. If you need more than ~40 lines of custom CSS,
   you're overdesigning.
6. **Pills for status/frequency** — use inline pill classes instead of icons
   or colored blocks:
   ```html
   <span class="pill-green">Semanal</span>
   <span class="pill-yellow">Conforme demanda</span>
   <span class="pill-red">Fora</span>
   <span class="pill-gray">Opcional</span>
   <span class="pill-obg">obrigatório</span>   <!-- red tint -->
   <span class="pill-ben">benefício</span>      <!-- blue tint -->
   ```
   Define these in the report `<style>` block with background tints and
   `border-radius: 99px`.
7. **Tables over cards** — prefer `<table>` for structured data. Cards
   (`.metric-card`, `.day-card`) only for KPI dashboards and calendar grids.
8. **`<strong>` for inline emphasis** — no `<span style="font-weight:700">`.
9. **Callouts for important notes only** — one or two per tab, not five.
   Use `.callout info`, `.callout success`, `.callout warning`, `.callout danger`.

### What NOT to do

- No dark hero with `background: linear-gradient(135deg, #0A1628 ...)`
- No custom card components with heavy CSS (`.contract-section`, `.value-card`, etc.)
- No multiple accent colors competing (green + blue + purple + yellow all at once)
- No emojis as primary iconography (use sparingly, never in headers)
- No more than 60 lines of `<style>` overrides
