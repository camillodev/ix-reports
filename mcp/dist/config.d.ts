/**
 * MCP Report Publisher — Configuration
 * Reads from environment variables.
 */
export declare const config: {
    github: {
        token: string;
        owner: string;
        repo: string;
        branch: string;
    };
    site: {
        domain: string;
    };
};
export declare function validateConfig(): string[];
