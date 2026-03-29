interface FileChange {
    path: string;
    content: string;
}
/**
 * Fetch a file's content from the repo (UTF-8 text).
 */
export declare function getFileContent(path: string): Promise<string>;
/**
 * Atomically push multiple file changes in a single commit.
 * Uses the Git Tree API: createBlob → createTree → createCommit → updateRef.
 */
export declare function pushFilesAtomically(files: FileChange[], commitMessage: string): Promise<{
    sha: string;
    url: string;
}>;
export {};
