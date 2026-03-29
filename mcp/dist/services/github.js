/**
 * GitHub Service — Atomic multi-file push via Git Tree API.
 *
 * Uses Octokit to create a single commit with multiple file changes,
 * ensuring reports.json and the HTML file are always consistent.
 */
import { Octokit } from 'octokit';
import { config } from '../config.js';
let _octokit = null;
function getOctokit() {
    if (!_octokit) {
        _octokit = new Octokit({ auth: config.github.token });
    }
    return _octokit;
}
const { owner, repo, branch } = config.github;
/**
 * Fetch a file's content from the repo (UTF-8 text).
 */
export async function getFileContent(path) {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
    });
    if ('content' in data && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    throw new Error(`Unexpected response for ${path} — not a file`);
}
/**
 * Atomically push multiple file changes in a single commit.
 * Uses the Git Tree API: createBlob → createTree → createCommit → updateRef.
 */
export async function pushFilesAtomically(files, commitMessage) {
    const octokit = getOctokit();
    // 1. Get current HEAD ref
    const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
    });
    const headSha = refData.object.sha;
    // 2. Get the tree SHA for HEAD
    const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: headSha,
    });
    const baseTreeSha = commitData.tree.sha;
    // 3. Create blobs for each file
    const treeItems = await Promise.all(files.map(async (file) => {
        const { data: blob } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content, 'utf-8').toString('base64'),
            encoding: 'base64',
        });
        return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
        };
    }));
    // 4. Create new tree with all file changes
    const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: treeItems,
    });
    // 5. Create commit pointing to new tree
    const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [headSha],
    });
    // 6. Update branch ref to new commit
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
    });
    return {
        sha: newCommit.sha,
        url: newCommit.html_url,
    };
}
