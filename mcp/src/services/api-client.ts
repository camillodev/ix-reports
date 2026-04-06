import { config } from '../config.js';

export async function callPublishApi(method: 'POST' | 'PUT' | 'DELETE', body: object) {
  const res = await fetch(config.publishApiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.publishToken}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function fetchReportsJson(): Promise<unknown[]> {
  const url = `https://${config.siteDomain}/data/reports.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reports.json: ${res.status}`);
  return res.json();
}
