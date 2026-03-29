/**
 * Zod schemas for report entries and MCP tool inputs.
 */
import { z } from 'zod';
// ─── Access Levels ───
export const AccessLevel = z.enum(['public', 'empresa', 'pessoal', 'private']);
// ─── Report Entry (reports.json) ───
export const ReportEntry = z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    file: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    meta: z.string().min(1),
    client: z.string().min(1),
    project: z.string().nullable().optional(),
    tags: z.array(z.string()).min(1),
    icon: z.string().default('file-earmark-text'),
    type: z.enum(['html', 'pdf', 'md']).default('html'),
    pinned: z.boolean().optional(),
    num: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    quarter: z.string().optional(),
    // Access control
    access: AccessLevel.default('public'),
    allowedTokens: z.array(z.string()).optional(),
});
// ─── publish_report input ───
export const PublishReportInput = z.object({
    filename: z.string()
        .regex(/^[a-z0-9-]+\.html$/, 'Filename must be kebab-case ending in .html'),
    html_content_base64: z.string()
        .min(100, 'HTML content seems too short — check base64 encoding'),
    title: z.string().min(1, 'Title is required'),
    slug: z.string()
        .regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    meta: z.string().min(1, 'Meta description is required'),
    client: z.string().min(1, 'Client is required (impact-x, kumon, g2i, pessoal)'),
    project: z.string().nullable().optional(),
    tags: z.array(z.string()).min(1, 'At least one tag is required'),
    icon: z.string().optional().default('file-earmark-text'),
    access: AccessLevel.optional().default('public'),
    pinned: z.boolean().optional().default(false),
    allowedTokens: z.array(z.string()).optional(),
});
// ─── list_reports input ───
export const ListReportsInput = z.object({
    client: z.string().optional(),
    tag: z.string().optional(),
    access: AccessLevel.optional(),
    limit: z.number().min(1).max(100).optional().default(50),
});
