import { ListReportsInput } from '../schemas/index.js';
export declare const listReportsSchema: import("zod").ZodObject<{
    client: import("zod").ZodOptional<import("zod").ZodString>;
    tag: import("zod").ZodOptional<import("zod").ZodString>;
    access: import("zod").ZodOptional<import("zod").ZodEnum<["public", "empresa", "pessoal", "private"]>>;
    limit: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
}, "strip", import("zod").ZodTypeAny, {
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
export declare function listReports(input: typeof ListReportsInput._type): Promise<{
    success: boolean;
    error: string;
    total?: undefined;
    showing?: undefined;
    reports?: undefined;
} | {
    success: boolean;
    total: number;
    showing: number;
    reports: {
        title: string;
        slug: string;
        url: string;
        date: string;
        client: string;
        project: string | null;
        tags: string[];
        access: "public" | "empresa" | "pessoal" | "private";
        pinned: boolean;
        type: "html" | "pdf" | "md";
    }[];
    error?: undefined;
}>;
