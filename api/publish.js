/**
 * POST   /api/publish — create new report
 * PUT    /api/publish — update existing report
 * DELETE /api/publish — remove report
 *
 * Vercel Serverless Function — publishes an HTML report to the ix-reports repo.
 *
 * Body (JSON) for POST/PUT:
 *   html       — full HTML string
 *   title      — report title
 *   slug       — kebab-case unique slug
 *   date       — YYYY-MM-DD
 *   meta       — one-line description
 *   client     — impact-x | kumon | g2i | pessoal
 *   tags       — string[]
 *   project    — optional string
 *   icon       — optional Bootstrap Icons name (default: file-earmark-text)
 *   access     — public | empresa | pessoal (default: public)
 *   pinned     — optional boolean
 *
 * Body (JSON) for DELETE:
 *   slug       — slug of the report to remove
 *
 * Auth: Authorization: Bearer <PUBLISH_TOKEN>
 * Env:  PUBLISH_TOKEN, GITHUB_TOKEN
 */

const GITHUB_OWNER = 'camillodev';
const GITHUB_REPO = 'ix-reports';
const GITHUB_BRANCH = 'master';
const SITE_DOMAIN = 'reports.impactxlabs.com';

// ── Validation ──────────────────────────────────────────────────────────────

function validateHtml(html) {
  const errors = [];
  const warnings = [];

  if (!html.includes('assets/css/report.css')) {
    errors.push('Missing report.css link');
  }

  const cssPos = html.indexOf('assets/css/report.css');
  const stylePos = html.indexOf('<style');
  if (stylePos !== -1 && cssPos !== -1 && stylePos < cssPos) {
    errors.push('<style> must appear AFTER report.css link');
  }

  if (!/class="[^"]*ix-report/.test(html)) {
    errors.push('Missing <body class="ix-report">');
  }

  if (!html.includes('class="topbar"')) {
    errors.push('Missing <header class="topbar">');
  }

  if (!html.includes('class="tab-nav"')) {
    errors.push('Missing <nav class="tab-nav">');
  } else if (!html.includes('tab-btn')) {
    errors.push('Tab nav present but no tab-btn found');
  }

  if (!html.includes('report-header')) {
    errors.push('Missing .report-header');
  }

  if (!/<footer[\s>]/.test(html)) {
    errors.push('Missing <footer>');
  }

  if (!html.includes('assets/js/report.js')) {
    errors.push('Missing report.js script');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateInput(body) {
  const errors = [];

  if (!body.html || typeof body.html !== 'string' || body.html.length < 100) {
    errors.push('html is required and must be >= 100 chars');
  }
  if (!body.title || typeof body.title !== 'string') {
    errors.push('title is required');
  }
  if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug)) {
    errors.push('slug is required and must be kebab-case');
  }
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push('date is required (YYYY-MM-DD)');
  }
  if (!body.meta || typeof body.meta !== 'string') {
    errors.push('meta is required');
  }
  if (!body.client || typeof body.client !== 'string') {
    errors.push('client is required');
  }
  if (!Array.isArray(body.tags) || body.tags.length === 0) {
    errors.push('tags must be a non-empty array');
  }

  const validAccess = ['public', 'empresa', 'pessoal', 'private'];
  if (body.access && !validAccess.includes(body.access)) {
    errors.push(`access must be one of: ${validAccess.join(', ')}`);
  }

  return errors;
}

// ── GitHub API (atomic commit) ──────────────────────────────────────────────

async function githubApi(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }

  return res.json();
}

async function getFileContent(path) {
  const data = await githubApi(`contents/${path}?ref=${GITHUB_BRANCH}`);
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

async function pushFilesAtomically(files, commitMessage) {
  // 1. Get HEAD ref
  const refData = await githubApi(`git/ref/heads/${GITHUB_BRANCH}`);
  const headSha = refData.object.sha;

  // 2. Get base tree
  const commitData = await githubApi(`git/commits/${headSha}`);
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blob = await githubApi('git/blobs', {
        method: 'POST',
        body: JSON.stringify({
          content: Buffer.from(file.content, 'utf-8').toString('base64'),
          encoding: 'base64',
        }),
      });
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      };
    })
  );

  // 4. Create tree
  const newTree = await githubApi('git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  // 5. Create commit
  const newCommit = await githubApi('git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });

  // 6. Update ref
  await githubApi(`git/refs/heads/${GITHUB_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { sha: newCommit.sha, url: newCommit.html_url };
}

async function deleteFilesAtomically(filesToDelete, updatedFiles, commitMessage) {
  // 1. Get HEAD ref
  const refData = await githubApi(`git/ref/heads/${GITHUB_BRANCH}`);
  const headSha = refData.object.sha;

  // 2. Get base tree
  const commitData = await githubApi(`git/commits/${headSha}`);
  const baseTreeSha = commitData.tree.sha;

  // 3. Build tree: deleted files get sha: null, updated files get new blobs
  const deleteItems = filesToDelete.map((filePath) => ({
    path: filePath,
    mode: '100644',
    type: 'blob',
    sha: null,
  }));

  const updateItems = await Promise.all(
    updatedFiles.map(async (file) => {
      const blob = await githubApi('git/blobs', {
        method: 'POST',
        body: JSON.stringify({
          content: Buffer.from(file.content, 'utf-8').toString('base64'),
          encoding: 'base64',
        }),
      });
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      };
    })
  );

  const treeItems = [...deleteItems, ...updateItems];

  // 4. Create tree
  const newTree = await githubApi('git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  // 5. Create commit
  const newCommit = await githubApi('git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });

  // 6. Update ref
  await githubApi(`git/refs/heads/${GITHUB_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { sha: newCommit.sha, url: newCommit.html_url };
}

// ── Path helpers ─────────────────────────────────────────────────────────────

function resolveFilePaths(slug, access) {
  const filename = `${slug}.html`;
  if (access === 'pessoal' || access === 'private') {
    return { filePath: `data/private/${filename}`, fileField: `private/${filename}` };
  } else if (access === 'empresa') {
    return { filePath: `data/empresa/${filename}`, fileField: `empresa/${filename}` };
  }
  return { filePath: `data/${filename}`, fileField: filename };
}

// ── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token || token !== process.env.PUBLISH_TOKEN) {
    return res.status(401).json({ error: 'Invalid or missing PUBLISH_TOKEN' });
  }

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  const body = req.body;

  // ── POST: create new report ─────────────────────────────────────────────

  if (req.method === 'POST') {
    // Validate input
    const inputErrors = validateInput(body);
    if (inputErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: inputErrors });
    }

    // Validate HTML structure
    const htmlValidation = validateHtml(body.html);
    if (!htmlValidation.valid) {
      return res.status(400).json({
        error: 'HTML validation failed',
        details: htmlValidation.errors,
        warnings: htmlValidation.warnings,
      });
    }

    // Fetch current reports.json
    let reports;
    try {
      const raw = await getFileContent('data/reports.json');
      reports = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: `Failed to fetch reports.json: ${err.message}` });
    }

    // Check duplicate slug
    if (reports.some((r) => r.slug === body.slug)) {
      return res.status(409).json({ error: `Slug "${body.slug}" already exists` });
    }

    // Determine file path
    const access = body.access || 'public';
    const { filePath, fileField } = resolveFilePaths(body.slug, access);

    // Build entry
    const entry = {
      title: body.title,
      slug: body.slug,
      file: fileField,
      date: body.date,
      meta: body.meta,
      client: body.client,
      project: body.project || null,
      tags: body.tags,
      icon: body.icon || 'file-earmark-text',
      type: 'html',
      pinned: body.pinned || false,
      access,
      ...(body.owner ? { owner: body.owner } : {}),
    };

    reports.unshift(entry);
    const updatedJson = JSON.stringify(reports, null, 2) + '\n';

    // Atomic commit
    try {
      const result = await pushFilesAtomically(
        [
          { path: filePath, content: body.html },
          { path: 'data/reports.json', content: updatedJson },
        ],
        `docs: publish "${body.title}" [${access}]`
      );

      return res.status(200).json({
        success: true,
        url: `https://${SITE_DOMAIN}/${filePath}`,
        slug: body.slug,
        access,
        commitSha: result.sha,
        warnings: htmlValidation.warnings.length > 0 ? htmlValidation.warnings : undefined,
      });
    } catch (err) {
      return res.status(500).json({ error: `GitHub push failed: ${err.message}` });
    }
  }

  // ── PUT: update existing report ─────────────────────────────────────────

  if (req.method === 'PUT') {
    // Validate input
    const inputErrors = validateInput(body);
    if (inputErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: inputErrors });
    }

    // Validate HTML structure
    const htmlValidation = validateHtml(body.html);
    if (!htmlValidation.valid) {
      return res.status(400).json({
        error: 'HTML validation failed',
        details: htmlValidation.errors,
        warnings: htmlValidation.warnings,
      });
    }

    // Fetch current reports.json
    let reports;
    try {
      const raw = await getFileContent('data/reports.json');
      reports = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: `Failed to fetch reports.json: ${err.message}` });
    }

    // Find existing entry
    const index = reports.findIndex((r) => r.slug === body.slug);
    if (index === -1) {
      return res.status(404).json({ error: `Slug "${body.slug}" not found` });
    }

    // Determine file path
    const access = body.access || 'public';
    const { filePath, fileField } = resolveFilePaths(body.slug, access);

    // Build updated entry (keep position in array)
    const updatedEntry = {
      title: body.title,
      slug: body.slug,
      file: fileField,
      date: body.date,
      meta: body.meta,
      client: body.client,
      project: body.project || null,
      tags: body.tags,
      icon: body.icon || 'file-earmark-text',
      type: 'html',
      pinned: body.pinned || false,
      access,
      ...(body.owner ? { owner: body.owner } : {}),
    };

    reports[index] = updatedEntry;
    const updatedJson = JSON.stringify(reports, null, 2) + '\n';

    // Atomic commit
    try {
      const result = await pushFilesAtomically(
        [
          { path: filePath, content: body.html },
          { path: 'data/reports.json', content: updatedJson },
        ],
        `docs: update report "${body.title}" [${access}]`
      );

      return res.status(200).json({
        success: true,
        url: `https://${SITE_DOMAIN}/${filePath}`,
        slug: body.slug,
        access,
        commitSha: result.sha,
        warnings: htmlValidation.warnings.length > 0 ? htmlValidation.warnings : undefined,
      });
    } catch (err) {
      return res.status(500).json({ error: `GitHub push failed: ${err.message}` });
    }
  }

  // ── DELETE: remove report ────────────────────────────────────────────────

  if (req.method === 'DELETE') {
    if (!body.slug || typeof body.slug !== 'string') {
      return res.status(400).json({ error: 'slug is required' });
    }

    // Fetch current reports.json
    let reports;
    try {
      const raw = await getFileContent('data/reports.json');
      reports = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: `Failed to fetch reports.json: ${err.message}` });
    }

    // Find existing entry
    const index = reports.findIndex((r) => r.slug === body.slug);
    if (index === -1) {
      return res.status(404).json({ error: `Slug "${body.slug}" not found` });
    }

    const entry = reports[index];
    const { filePath } = resolveFilePaths(entry.slug, entry.access);

    // Remove entry from array
    reports.splice(index, 1);
    const updatedJson = JSON.stringify(reports, null, 2) + '\n';

    // Atomic commit: delete HTML file + update reports.json
    try {
      const result = await deleteFilesAtomically(
        [filePath],
        [{ path: 'data/reports.json', content: updatedJson }],
        `docs: remove report "${entry.title}"`
      );

      return res.status(200).json({
        success: true,
        slug: entry.slug,
        title: entry.title,
        commitSha: result.sha,
      });
    } catch (err) {
      return res.status(500).json({ error: `GitHub push failed: ${err.message}` });
    }
  }
}
