/**
 * Zod schemas for report entries and MCP tool inputs.
 */
import { z } from 'zod';
export declare const AccessLevel: z.ZodEnum<["public", "empresa", "pessoal", "private"]>;
export type AccessLevel = z.infer<typeof AccessLevel>;
export declare const ReportEntry: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    file: z.ZodString;
    date: z.ZodString;
    meta: z.ZodString;
    client: z.ZodString;
    project: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodArray<z.ZodString, "many">;
    icon: z.ZodDefault<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["html", "pdf", "md"]>>;
    pinned: z.ZodOptional<z.ZodBoolean>;
    num: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    quarter: z.ZodOptional<z.ZodString>;
    access: z.ZodDefault<z.ZodEnum<["public", "empresa", "pessoal", "private"]>>;
    allowedTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "html" | "pdf" | "md";
    title: string;
    slug: string;
    file: string;
    date: string;
    meta: string;
    client: string;
    tags: string[];
    icon: string;
    access: "public" | "empresa" | "pessoal" | "private";
    status?: string | undefined;
    project?: string | null | undefined;
    pinned?: boolean | undefined;
    num?: string | undefined;
    description?: string | undefined;
    quarter?: string | undefined;
    allowedTokens?: string[] | undefined;
}, {
    title: string;
    slug: string;
    file: string;
    date: string;
    meta: string;
    client: string;
    tags: string[];
    type?: "html" | "pdf" | "md" | undefined;
    status?: string | undefined;
    project?: string | null | undefined;
    icon?: string | undefined;
    pinned?: boolean | undefined;
    num?: string | undefined;
    description?: string | undefined;
    quarter?: string | undefined;
    access?: "public" | "empresa" | "pessoal" | "private" | undefined;
    allowedTokens?: string[] | undefined;
}>;
export type ReportEntry = z.infer<typeof ReportEntry>;
export declare const PublishReportInput: z.ZodObject<{
    filename: z.ZodString;
    html_content_base64: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    date: z.ZodString;
    meta: z.ZodString;
    client: z.ZodString;
    project: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodArray<z.ZodString, "many">;
    icon: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    access: z.ZodDefault<z.ZodOptional<z.ZodEnum<["public", "empresa", "pessoal", "private"]>>>;
    pinned: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    allowedTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    slug: string;
    date: string;
    meta: string;
    client: string;
    tags: string[];
    icon: string;
    pinned: boolean;
    access: "public" | "empresa" | "pessoal" | "private";
    filename: string;
    html_content_base64: string;
    project?: string | null | undefined;
    allowedTokens?: string[] | undefined;
}, {
    title: string;
    slug: string;
    date: string;
    meta: string;
    client: string;
    tags: string[];
    filename: string;
    html_content_base64: string;
    project?: string | null | undefined;
    icon?: string | undefined;
    pinned?: boolean | undefined;
    access?: "public" | "empresa" | "pessoal" | "private" | undefined;
    allowedTokens?: string[] | undefined;
}>;
export type PublishReportInput = z.infer<typeof PublishReportInput>;
export declare const ListReportsInput: z.ZodObject<{
    client: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    access: z.ZodOptional<z.ZodEnum<["public", "empresa", "pessoal", "private"]>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    client?: string | undefined;
    access?: "public" | "empresa" | "pessoal" | "private" | undefined;
    tag?: string | undefined;
}, {
    client?: string | undefined;
    access?: "public" | "empresa" | "pessoal" | "private" | undefined;
    tag?: string | undefined;
    limit?: number | undefined;
}>;
export type ListReportsInput = z.infer<typeof ListReportsInput>;
