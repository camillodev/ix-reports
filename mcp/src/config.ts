export const config = {
  publishApiUrl: process.env.PUBLISH_API_URL || 'https://reports.impactxlabs.com/api/publish',
  publishToken: process.env.PUBLISH_TOKEN || '',
  siteDomain: process.env.SITE_DOMAIN || 'reports.impactxlabs.com',
};

export function validateConfig(): string[] {
  const errors: string[] = [];
  if (!config.publishToken) errors.push('PUBLISH_TOKEN is required');
  return errors;
}
