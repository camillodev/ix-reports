/**
 * Tool: list_reports
 *
 * Lists published reports from reports.json with optional filters.
 * Fetches the latest data from the public site URL.
 */
import { config } from '../config.js';
import { ListReportsInput, type ReportEntry } from '../schemas/index.js';
import { fetchReportsJson } from '../services/api-client.js';

export const listReportsSchema = ListReportsInput;

export async function listReports(input: typeof ListReportsInput._type) {
  // Fetch current reports.json
  let reports: ReportEntry[];
  try {
    const data = await fetchReportsJson();
    reports = data as ReportEntry[];
  } catch (err) {
    return { success: false, error: `Failed to fetch reports.json: ${err}` };
  }

  // Apply filters
  let filtered = reports;

  if (input.client) {
    filtered = filtered.filter((r) => r.client === input.client);
  }

  if (input.tag) {
    filtered = filtered.filter((r) => r.tags?.includes(input.tag!));
  }

  if (input.access) {
    filtered = filtered.filter((r) => (r.access || 'public') === input.access);
  }

  // Sort by date descending (pinned first)
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.date || '').localeCompare(a.date || '');
  });

  // Apply limit
  const limited = filtered.slice(0, input.limit);

  // Build response
  const domain = config.siteDomain;
  const items = limited.map((r) => {
    const path = r.file.startsWith('private/') || r.file.startsWith('downloads/')
      ? `data/${r.file}`
      : `data/${r.file}`;
    return {
      title: r.title,
      slug: r.slug,
      url: `https://${domain}/${path}`,
      date: r.date,
      client: r.client,
      project: r.project || null,
      tags: r.tags,
      access: r.access || 'public',
      pinned: r.pinned || false,
      type: r.type,
    };
  });

  return {
    success: true,
    total: filtered.length,
    showing: items.length,
    reports: items,
  };
}
