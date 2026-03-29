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
export declare function validateReportHtml(html: string): ValidationResult;
