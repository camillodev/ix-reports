/**
 * Tool: publish_report
 *
 * Publishes a new HTML report to the ix-reports repository.
 * 1. Decodes base64 HTML content
 * 2. Validates structure against gold standard (LLM.md rules)
 * 3. Fetches current reports.json
 * 4. Checks for duplicate slug
 * 5. Determines file path based on access level
 * 6. Atomically commits HTML + updated reports.json
 * 7. Returns the final URL
 */
import { config } from '../config.js';
import { PublishReportInput, type ReportEntry } from '../schemas/index.js';
import { getFileContent, pushFilesAtomically } from '../services/github.js';
import { validateReportHtml } from '../services/validator.js';

export const publishReportSchema = PublishReportInput;

export async function publishReport(input: typeof PublishReportInput._type) {
  // 1. Decode base64
  let html: string;
  try {
    html = Buffer.from(input.html_content_base64, 'base64').toString('utf-8');
  } catch {
    return { success: false, error: 'Invalid base64 encoding in html_content_base64' };
  }

  if (html.length < 100) {
    return { success: false, error: 'Decoded HTML is too short — likely invalid' };
  }

  // 2. Validate HTML structure
  const validation = validateReportHtml(html);
  if (!validation.valid) {
    return {
      success: false,
      error: 'HTML validation failed',
      details: validation.errors,
      warnings: validation.warnings,
    };
  }

  // 3. Fetch current reports.json
  let reportsJson: string;
  let reports: ReportEntry[];
  try {
    reportsJson = await getFileContent('data/reports.json');
    reports = JSON.parse(reportsJson);
  } catch (err) {
    return { success: false, error: `Failed to fetch reports.json: ${err}` };
  }

  // 4. Check for duplicate slug
  if (reports.some((r) => r.slug === input.slug)) {
    return {
      success: false,
      error: `Slug "${input.slug}" already exists. Use a unique slug.`,
    };
  }

  // 5. Determine file path based on access level
  const isProtected = input.access === 'pessoal' || input.access === 'private';
  const filePath = isProtected
    ? `data/private/${input.filename}`
    : `data/${input.filename}`;

  const fileField = isProtected
    ? `private/${input.filename}`
    : input.filename;

  // 6. Build new report entry
  const newEntry: ReportEntry = {
    title: input.title,
    slug: input.slug,
    file: fileField,
    date: input.date,
    meta: input.meta,
    client: input.client,
    project: input.project ?? null,
    tags: input.tags,
    icon: input.icon,
    type: 'html',
    pinned: input.pinned || false,
    access: input.access,
  };

  if (input.allowedTokens && input.allowedTokens.length > 0) {
    newEntry.allowedTokens = input.allowedTokens;
  }

  // 7. Prepend new entry to reports array (newest first)
  reports.unshift(newEntry);

  const updatedReportsJson = JSON.stringify(reports, null, 2) + '\n';

  // 8. Atomic commit: HTML file + updated reports.json
  const commitMessage = `docs: publish report "${input.title}" [${input.access}]`;
  try {
    const result = await pushFilesAtomically(
      [
        { path: filePath, content: html },
        { path: 'data/reports.json', content: updatedReportsJson },
      ],
      commitMessage
    );

    const url = `https://${config.site.domain}/${filePath}`;

    return {
      success: true,
      url,
      slug: input.slug,
      access: input.access,
      commitSha: result.sha,
      commitUrl: result.url,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    };
  } catch (err) {
    return { success: false, error: `GitHub push failed: ${err}` };
  }
}
