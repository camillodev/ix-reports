/**
 * HTTP MCP endpoint — ix-report-publisher
 * Vercel Serverless Function
 *
 * Exposes the same 4 MCP tools as the stdio server but via Streamable HTTP,
 * enabling access from Claude.ai chat, cowork, and mobile (not just Claude Code).
 *
 * Auth: Authorization: Bearer <PUBLISH_TOKEN>
 *
 * Register in Claude.ai settings → MCP servers:
 *   {
 *     "ix-report-publisher": {
 *       "type": "http",
 *       "url": "https://reports.impactxlabs.com/api/mcp",
 *       "headers": { "Authorization": "Bearer YOUR_PUBLISH_TOKEN" }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const SITE_DOMAIN = process.env.SITE_DOMAIN ?? 'reports.impactxlab.com';
const PUBLISH_API_URL = process.env.PUBLISH_API_URL ?? `https://${SITE_DOMAIN}/api/publish`;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AccessLevel = z.enum(['public', 'empresa', 'pessoal', 'private']);

const PublishInput = z.object({
  filename: z.string().regex(/^[a-z0-9-]+\.html$/),
  html_content_base64: z.string().min(100),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meta: z.string().min(1),
  client: z.string().min(1),
  project: z.string().nullable().optional(),
  tags: z.array(z.string()).min(1),
  icon: z.string().optional().default('file-earmark-text'),
  access: AccessLevel.optional().default('empresa'),
  pinned: z.boolean().optional().default(false),
  owner: z.string().optional(),
  allowedTokens: z.array(z.string()).optional(),
});

const UpdateInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  filename: z.string().regex(/^[a-z0-9-]+\.html$/),
  html_content_base64: z.string().min(100),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meta: z.string().min(1),
  client: z.string().min(1),
  project: z.string().nullable().optional(),
  tags: z.array(z.string()).min(1),
  icon: z.string().optional().default('file-earmark-text'),
  access: AccessLevel.optional().default('empresa'),
  pinned: z.boolean().optional().default(false),
  owner: z.string().optional(),
});

const DeleteInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

const ListInput = z.object({
  client: z.string().optional(),
  tag: z.string().optional(),
  access: AccessLevel.optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callPublishApi(method: 'POST' | 'PUT' | 'DELETE', body: object) {
  const res = await fetch(PUBLISH_API_URL, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PUBLISH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

function createServer() {
  const server = new McpServer({ name: 'ix-report-publisher', version: '2.0.0' });

  // ── publish_report ──
  server.tool(
    'publish_report',
    `Publishes a new HTML report to the Relatorio X platform (reports.impactxlabs.com).
HTML must follow the gold-standard template (topbar, tab-nav, report-header, footer).
Returns the live URL. Access defaults to "empresa".`,
    PublishInput.shape,
    async (input) => {
      let html: string;
      try {
        html = Buffer.from(input.html_content_base64, 'base64').toString('utf-8');
      } catch {
        return { content: [{ type: 'text' as const, text: 'Error: Invalid base64 in html_content_base64' }] };
      }

      const result = await callPublishApi('POST', {
        html,
        title: input.title,
        slug: input.slug,
        date: input.date,
        meta: input.meta,
        client: input.client,
        project: input.project ?? null,
        tags: input.tags,
        icon: input.icon ?? 'file-earmark-text',
        access: input.access ?? 'empresa',
        pinned: input.pinned ?? false,
        allowedTokens: input.allowedTokens,
        ...(input.owner ? { owner: input.owner } : {}),
      });

      if (!result.success) {
        const lines = [`Error: ${result.error}`];
        if (Array.isArray(result.details)) lines.push(...(result.details as string[]).map((d) => `  - ${d}`));
        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      }

      const text = [
        'Report published!',
        '',
        `  URL:    ${result.url}`,
        `  Slug:   ${result.slug}`,
        `  Access: ${result.access}`,
        `  Commit: ${(result.commitSha as string)?.slice(0, 7)}`,
        '',
        'Para PDF: abrir URL → Ctrl+P → Salvar como PDF',
      ].join('\n');
      return { content: [{ type: 'text' as const, text }] };
    }
  );

  // ── update_report ──
  server.tool(
    'update_report',
    'Updates an existing HTML report by slug. Replaces HTML content and metadata.',
    UpdateInput.shape,
    async (input) => {
      let html: string;
      try {
        html = Buffer.from(input.html_content_base64, 'base64').toString('utf-8');
      } catch {
        return { content: [{ type: 'text' as const, text: 'Error: Invalid base64 in html_content_base64' }] };
      }

      const result = await callPublishApi('PUT', {
        html,
        slug: input.slug,
        title: input.title,
        date: input.date,
        meta: input.meta,
        client: input.client,
        project: input.project ?? null,
        tags: input.tags,
        icon: input.icon ?? 'file-earmark-text',
        access: input.access ?? 'empresa',
        pinned: input.pinned ?? false,
        ...(input.owner ? { owner: input.owner } : {}),
      });

      if (!result.success) {
        return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] };
      }

      const text = ['Report updated!', '', `  URL:    ${result.url}`, `  Slug:   ${result.slug}`, `  Commit: ${(result.commitSha as string)?.slice(0, 7)}`].join('\n');
      return { content: [{ type: 'text' as const, text }] };
    }
  );

  // ── delete_report ──
  server.tool(
    'delete_report',
    'Deletes a report from the platform by slug. Removes the HTML file and the index entry.',
    DeleteInput.shape,
    async (input) => {
      const result = await callPublishApi('DELETE', { slug: input.slug });
      if (!result.success) {
        return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text' as const, text: `Report "${input.slug}" deleted.` }] };
    }
  );

  // ── list_reports ──
  server.tool(
    'list_reports',
    'Lists published reports from reports.impactxlabs.com. Supports filters by client, tag, and access level.',
    ListInput.shape,
    async (input) => {
      const res = await fetch(`https://${SITE_DOMAIN}/data/reports.json`);
      if (!res.ok) {
        return { content: [{ type: 'text' as const, text: `Error: failed to fetch reports (${res.status})` }] };
      }

      let reports = (await res.json()) as Array<Record<string, unknown>>;

      if (input.client) reports = reports.filter((r) => r.client === input.client);
      if (input.tag) reports = reports.filter((r) => Array.isArray(r.tags) && (r.tags as string[]).includes(input.tag!));
      if (input.access) reports = reports.filter((r) => (r.access ?? 'public') === input.access);

      reports.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return ((b.date as string) ?? '').localeCompare((a.date as string) ?? '');
      });

      const limited = reports.slice(0, input.limit ?? 50);
      const lines = [`Relatorio X — ${reports.length} reports`, ''];

      for (const r of limited) {
        const badge = r.access !== 'public' ? ` [${r.access}]` : '';
        const pin = r.pinned ? ' [pinned]' : '';
        const owner = r.owner ? ` · ${r.owner}` : '';
        lines.push(`* ${r.title}${pin}${badge}${owner}`);
        lines.push(`  https://${SITE_DOMAIN}/data/${r.file}`);
        lines.push(`  ${r.date} · ${r.client} · ${(r.tags as string[])?.join(', ')}`);
        lines.push('');
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  return server;
}

// ─── Vercel handler ───────────────────────────────────────────────────────────

// Vercel parses the body before the handler — pass it to MCP transport via parsedBody
export const config = { api: { bodyParser: true } };

export default async function handler(req: any, res: any) {
  // CORS — needed for Claude.ai web client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Auth
  const authHeader = (req.headers['authorization'] ?? '') as string;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || !process.env.PUBLISH_TOKEN || token !== process.env.PUBLISH_TOKEN) {
    return res.status(401).json({ error: 'Invalid or missing PUBLISH_TOKEN' });
  }

  try {
    const server = createServer();
    // stateless mode: no session ID, each request is independent (serverless-friendly)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    // Pass req.body (already parsed by Vercel) so transport doesn't need to read the stream
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: `MCP handler error: ${err}` });
    }
  }
}
