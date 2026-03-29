/**
 * Vercel Edge Middleware — Relatório X
 *
 * Protects:
 *   /data/private/*   → pessoal + private reports (requires owner or invite token)
 *   /data/empresa/*   → empresa reports (requires empresa or owner token)
 *
 * Token prefix system:
 *   ix_own_xxx  → owner/admin — access everything
 *   ix_emp_xxx  → empresa — access public + empresa
 *   ix_inv_xxx  → invite — access public + specific private reports
 *   (no prefix) → legacy token — treated as invite-level
 *
 * Env vars:
 *   OWNER_TOKENS    — comma-separated owner tokens
 *   EMPRESA_TOKENS  — comma-separated empresa tokens
 *   PRIVATE_TOKENS  — comma-separated private/invite tokens (legacy compat)
 *
 * Access flow:
 *   1. Check token from URL param (?t=) or cookie (ix_auth, ix_emp, ix_pvt)
 *   2. Validate token against env vars
 *   3. If URL param, set cookie and redirect to clean URL
 *   4. If valid, forward request
 *   5. If invalid, return 403
 */

export const config = {
  matcher: ['/data/private/:path*', '/data/empresa/:path*'],
};

const ACCESS_DENIED_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acesso Restrito — Relatório X</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#F4F6F9;color:#1A1D21;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .box{background:#fff;border-radius:22px;padding:48px 40px;text-align:center;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .icon{font-size:48px;margin-bottom:16px}
  .brand{font-weight:800;font-size:20px;margin-bottom:24px;letter-spacing:-.5px}
  .brand span{color:#11C76F}
  h1{font-size:22px;font-weight:800;margin-bottom:10px}
  p{font-size:14px;color:#6B7280;line-height:1.6}
  a{color:#11C76F;font-weight:600;text-decoration:none}
</style>
</head>
<body>
  <div class="box">
    <div class="icon">🔒</div>
    <div class="brand">Relatorio <span>X</span></div>
    <h1>Acesso Restrito</h1>
    <p>Este documento requer autorização.<br>
    Solicite o link de acesso ao <a href="mailto:hello@rafaelcamillo.com">Impact X</a>.</p>
  </div>
</body>
</html>`;

function parseTokens(envVar) {
  return (envVar || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function getTokenLevel(token, ownerTokens, empresaTokens, privateTokens) {
  if (!token) return null;
  if (ownerTokens.includes(token)) return 'owner';
  if (empresaTokens.includes(token)) return 'empresa';
  if (privateTokens.includes(token)) return 'invite';
  return null;
}

function deny() {
  return new Response(ACCESS_DENIED_HTML, {
    status: 403,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const isPrivate = url.pathname.startsWith('/data/private/');
  const isEmpresa = url.pathname.startsWith('/data/empresa/');

  // Parse all token lists
  const ownerTokens = parseTokens(process.env.OWNER_TOKENS);
  const empresaTokens = parseTokens(process.env.EMPRESA_TOKENS);
  const privateTokens = parseTokens(process.env.PRIVATE_TOKENS);
  const allValidTokens = [...ownerTokens, ...empresaTokens, ...privateTokens];

  // No tokens configured at all → deny (safe default)
  if (allValidTokens.length === 0) return deny();

  // Extract token from URL param or cookies
  const tokenParam = url.searchParams.get('t');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const token = tokenParam || cookies.ix_auth || cookies.ix_pvt || cookies.ix_emp || null;

  // Determine token level
  const level = getTokenLevel(token, ownerTokens, empresaTokens, privateTokens);

  // Check access
  if (isPrivate) {
    // Private requires owner or invite-level (with valid token in allValidTokens)
    if (!level) return deny();
    if (level !== 'owner' && level !== 'invite') return deny();
  }

  if (isEmpresa) {
    // Empresa requires owner or empresa level
    if (!level) return deny();
    if (level !== 'owner' && level !== 'empresa') return deny();
  }

  // Valid token from URL param → set cookie then redirect to clean URL
  if (tokenParam && level) {
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('t');

    const cookieName = isPrivate ? 'ix_pvt' : 'ix_emp';
    const cookiePath = isPrivate ? '/data/private/' : '/data/empresa/';

    return new Response(null, {
      status: 302,
      headers: {
        Location: cleanUrl.toString(),
        'Set-Cookie': `${cookieName}=${token}; Path=${cookiePath}; HttpOnly; Max-Age=604800; SameSite=Lax`,
      },
    });
  }

  // Cookie valid → forward to static file
  if (level) return fetch(request);

  // No valid auth
  return deny();
}
