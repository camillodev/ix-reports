/**
 * Vercel Edge Middleware — Impact X Reports
 * Protects /data/private/* with token-based access control.
 *
 * Tokens are stored in the PRIVATE_TOKENS env var (comma-separated).
 * Each person gets a unique token. Share link as:
 *   https://reports.impactxlab.com/data/private/FILE.html?t=TOKEN
 *
 * After first visit, a cookie is set so subsequent visits don't need ?t=
 *
 * Levels (future): use token prefix — ix_l1_xxx = level 1, ix_l2_xxx = level 2
 */

export const config = {
  matcher: '/data/private/:path*',
};

const ACCESS_DENIED_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acesso Restrito — Impact X</title>
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
    <div class="brand">IMPACT <span>X</span></div>
    <h1>Acesso Restrito</h1>
    <p>Este documento requer autorização.<br>
    Solicite o link de acesso ao <a href="mailto:hello@rafaelcamillo.com">Impact X</a>.</p>
  </div>
</body>
</html>`;

export default async function middleware(request) {
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('t');

  // Parse cookie header
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieToken = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('ix_pvt='))
    ?.slice('ix_pvt='.length);

  // Load valid tokens from env
  const rawTokens = process.env.PRIVATE_TOKENS || '';
  const validTokens = rawTokens
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const token = tokenParam || cookieToken;

  // No valid tokens configured → deny (avoids misconfigured open access)
  if (!validTokens.length) {
    return new Response(ACCESS_DENIED_HTML, {
      status: 403,
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  }

  // Token not present or invalid → 403
  if (!token || !validTokens.includes(token)) {
    return new Response(ACCESS_DENIED_HTML, {
      status: 403,
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  }

  // Valid token from URL param → set cookie then redirect to clean URL
  if (tokenParam) {
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('t');
    return new Response(null, {
      status: 302,
      headers: {
        Location: cleanUrl.toString(),
        'Set-Cookie': `ix_pvt=${token}; Path=/data/private/; HttpOnly; Max-Age=604800; SameSite=Lax`,
      },
    });
  }

  // Cookie valid → forward to static file
  return fetch(request);
}
