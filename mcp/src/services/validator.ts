/**
 * HTML Validator — checks report HTML against the gold standard rules (LLM.md).
 *
 * 8 mandatory checks:
 * 1. <link href="../assets/css/report.css"> present
 * 2. <style> block (if any) appears AFTER the report.css link
 * 3. <body class="ix-report">
 * 4. <header class="topbar"> with back-btn, brand, topbar-title
 * 5. <nav class="tab-nav" role="tablist"> with >= 1 tab-btn
 * 6. First tab-panel has .report-header with .hdr-brand, .hdr-title, .hdr-sub, .hdr-meta
 * 7. <footer> present
 * 8. <script src="../assets/js/report.js"> before </body>
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateReportHtml(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. report.css link
  if (!html.includes('assets/css/report.css')) {
    errors.push('Missing <link href="../assets/css/report.css"> — required for shared styles');
  }

  // 2. <style> must come AFTER report.css link (if any <style> exists)
  const cssLinkPos = html.indexOf('assets/css/report.css');
  const stylePos = html.indexOf('<style');
  if (stylePos !== -1 && cssLinkPos !== -1 && stylePos < cssLinkPos) {
    errors.push('<style> block must appear AFTER the report.css <link>, not before');
  }

  // 3. <body class="ix-report">
  if (!/class="[^"]*ix-report/.test(html)) {
    errors.push('Missing <body class="ix-report"> — required body class');
  }

  // 4. <header class="topbar">
  if (!html.includes('class="topbar"')) {
    errors.push('Missing <header class="topbar"> — required topbar');
  } else {
    if (!html.includes('back-btn')) {
      warnings.push('Topbar missing back-btn element');
    }
    if (!/class="[^"]*brand/.test(html)) {
      warnings.push('Topbar missing brand element');
    }
  }

  // 5. <nav class="tab-nav" role="tablist">
  if (!html.includes('class="tab-nav"')) {
    errors.push('Missing <nav class="tab-nav" role="tablist"> — required tab navigation');
  } else if (!html.includes('tab-btn')) {
    errors.push('Tab nav present but no tab-btn found — at least one tab required');
  }

  // 6. report-header with required children
  if (!html.includes('report-header')) {
    errors.push('Missing .report-header in first tab-panel');
  } else {
    const missing: string[] = [];
    if (!html.includes('hdr-brand')) missing.push('hdr-brand');
    if (!html.includes('hdr-title')) missing.push('hdr-title');
    if (!html.includes('hdr-sub')) missing.push('hdr-sub');
    if (!html.includes('hdr-meta')) missing.push('hdr-meta');
    if (missing.length > 0) {
      warnings.push(`Report header missing: ${missing.join(', ')}`);
    }
  }

  // 7. <footer>
  if (!/<footer[\s>]/.test(html)) {
    errors.push('Missing <footer> element — required at end of report');
  }

  // 8. report.js script before </body>
  if (!html.includes('assets/js/report.js')) {
    errors.push('Missing <script src="../assets/js/report.js"> — required before </body>');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
