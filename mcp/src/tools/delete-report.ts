import { callPublishApi } from '../services/api-client.js';
import { DeleteReportInput } from '../schemas/index.js';

export const deleteReportSchema = DeleteReportInput;

export async function deleteReport(input: typeof DeleteReportInput._type) {
  try {
    const result = await callPublishApi('DELETE', { slug: input.slug });
    return result;
  } catch (err) {
    return { success: false, error: `API call failed: ${err}` };
  }
}
