/**
 * MCP Report Publisher — Configuration
 * Reads from environment variables.
 */

export const config = {
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || 'camillodev',
    repo: process.env.GITHUB_REPO || 'ix-reports',
    branch: process.env.GITHUB_BRANCH || 'master',
  },
  site: {
    domain: process.env.SITE_DOMAIN || 'reports.impactxlab.com',
  },
};

export function validateConfig(): string[] {
  const errors: string[] = [];
  if (!config.github.token) errors.push('GITHUB_TOKEN is required');
  return errors;
}
