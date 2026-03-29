#!/usr/bin/env node
/**
 * IX Report Publisher — MCP Server
 *
 * Tools:
 *   publish_report  — Publishes HTML report to GitHub → Vercel auto-deploys → returns URL
 *   list_reports    — Lists published reports with filters and links
 *
 * Transport: stdio (for Claude Desktop, Claude Code, or any MCP client)
 *
 * Required env vars:
 *   GITHUB_TOKEN    — GitHub PAT with repo Contents read/write
 *   GITHUB_OWNER    — Repository owner (default: camillodev)
 *   GITHUB_REPO     — Repository name (default: ix-reports)
 *   GITHUB_BRANCH   — Target branch (default: master)
 *   SITE_DOMAIN     — Deployed domain (default: reports.impactxlab.com)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateConfig } from './config.js';
import { PublishReportInput, ListReportsInput } from './schemas/index.js';
import { publishReport } from './tools/publish-report.js';
import { listReports } from './tools/list-reports.js';
const server = new McpServer({
    name: 'ix-report-publisher',
    version: '1.0.0',
});
// ─── Tool: publish_report ───
server.tool('publish_report', `Publishes a new HTML report to the Relatório X platform.
The HTML must follow the gold standard template (topbar, tab-nav, report-header, footer).
Pushes the HTML file and updated reports.json atomically to GitHub.
Vercel auto-deploys and the final URL is returned.

Access levels:
- "public"  → visible to everyone (data/)
- "empresa" → company members with token (data/)
- "pessoal" → personal/owner only (data/private/)
- "private" → invited users with specific tokens (data/private/)`, PublishReportInput.shape, async ({ filename, html_content_base64, title, slug, date, meta, client, project, tags, icon, access, pinned, allowedTokens }) => {
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        return { content: [{ type: 'text', text: `Configuration error: ${configErrors.join(', ')}` }] };
    }
    const result = await publishReport({
        filename,
        html_content_base64,
        title,
        slug,
        date,
        meta,
        client,
        project: project ?? null,
        tags,
        icon: icon || 'file-earmark-text',
        access: access || 'public',
        pinned: pinned || false,
        allowedTokens,
    });
    if (!result.success) {
        const errorText = [
            `Error: ${result.error}`,
            ...(result.details ? result.details.map((d) => `  - ${d}`) : []),
            ...(result.warnings ? ['Warnings:', ...result.warnings.map((w) => `  ⚠ ${w}`)] : []),
        ].join('\n');
        return { content: [{ type: 'text', text: errorText }] };
    }
    const successText = [
        `Report published successfully!`,
        ``,
        `  URL:    ${result.url}`,
        `  Slug:   ${result.slug}`,
        `  Access: ${result.access}`,
        `  Commit: ${result.commitSha?.slice(0, 7)}`,
        ...(result.warnings ? ['', 'Warnings:', ...result.warnings.map((w) => `  ⚠ ${w}`)] : []),
    ].join('\n');
    return { content: [{ type: 'text', text: successText }] };
});
// ─── Tool: list_reports ───
server.tool('list_reports', `Lists published reports from the Relatório X platform.
Returns title, URL, date, client, tags, and access level for each report.
Supports optional filters by client, tag, and access level.`, ListReportsInput.shape, async ({ client, tag, access, limit }) => {
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        return { content: [{ type: 'text', text: `Configuration error: ${configErrors.join(', ')}` }] };
    }
    const result = await listReports({
        client,
        tag,
        access,
        limit: limit || 50,
    });
    if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
    }
    const total = result.total ?? 0;
    const showing = result.showing ?? 0;
    const lines = [
        `Relatório X — ${total} reports${showing < total ? ` (showing ${showing})` : ''}`,
        '',
    ];
    for (const r of result.reports) {
        const badge = r.access !== 'public' ? ` [${r.access}]` : '';
        const pin = r.pinned ? ' 📌' : '';
        lines.push(`• ${r.title}${pin}${badge}`);
        lines.push(`  ${r.url}`);
        lines.push(`  ${r.date} · ${r.client} · ${r.tags.join(', ')}`);
        lines.push('');
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
});
// ─── Start server ───
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error('MCP server failed to start:', err);
    process.exit(1);
});
