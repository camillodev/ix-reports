import { callPublishApi } from '../services/api-client.js';
import { UpdateReportInput } from '../schemas/index.js';

export const updateReportSchema = UpdateReportInput;

export async function updateReport(input: typeof UpdateReportInput._type) {
  let html: string;
  try {
    html = Buffer.from(input.html_content_base64, 'base64').toString('utf-8');
  } catch {
    return { success: false, error: 'Invalid base64 encoding in html_content_base64' };
  }

  const body = {
    html,
    slug: input.slug,
    title: input.title,
    date: input.date,
    meta: input.meta,
    client: input.client,
    project: input.project ?? null,
    tags: input.tags,
    icon: input.icon || 'file-earmark-text',
    access: input.access || 'public',
    pinned: input.pinned || false,
    ...(input.owner ? { owner: input.owner } : {}),
  };

  try {
    const result = await callPublishApi('PUT', body);
    return result;
  } catch (err) {
    return { success: false, error: `API call failed: ${err}` };
  }
}
