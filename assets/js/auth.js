/**
 * IX Auth — Token-based access control for Relatório X.
 *
 * Users enter a level (Admin / Empresa) + a simple password.
 * The password is stored as "ix_own_{pw}" or "ix_emp_{pw}" in a cookie.
 * The middleware validates the full prefixed token against env vars.
 *
 * On the client side, we only control visibility (hide/show reports).
 * The middleware is the real gatekeeper for /data/private/* and /data/empresa/*.
 *
 * Exposes window.IXAuth API consumed by hub.js
 */
(function () {
  'use strict';

  // ─── Cookie helpers ───
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';path=/;expires=' + d.toUTCString() + ';SameSite=Lax';
  }

  function deleteCookie(name) {
    document.cookie = name + '=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // ─── Token parsing ───
  function getToken() {
    return getCookie('ix_auth') || getCookie('ix_pvt') || null;
  }

  function getLevel(token) {
    if (!token) return 'public';
    if (token.startsWith('ix_own_')) return 'owner';
    if (token.startsWith('ix_emp_')) return 'empresa';
    if (token.startsWith('ix_inv_')) return 'invite';
    // Unknown prefix → not authenticated (reject)
    return 'public';
  }

  // ─── Access check ───
  function canAccess(report) {
    var access = report.access || 'public';
    if (access === 'public') return true;

    var token = getToken();
    var level = getLevel(token);

    // Not authenticated → only public
    if (level === 'public') return false;

    // Owner sees everything
    if (level === 'owner') return true;

    // Empresa level: sees public + empresa
    if (access === 'empresa') return level === 'empresa';

    // Pessoal: only owner
    if (access === 'pessoal') return false;

    // Private: check if token is in allowedTokens
    if (access === 'private') {
      if (!token || !report.allowedTokens) return false;
      return report.allowedTokens.indexOf(token) !== -1;
    }

    return false;
  }

  // ─── Auth UI ───
  function updateAuthUI() {
    var badge = document.getElementById('auth-badge');
    if (!badge) return;

    var token = getToken();
    var level = getLevel(token);

    if (level === 'public') {
      badge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-ix-sm text-xs font-semibold cursor-pointer bg-ix-surface-2 border border-ix-border text-ix-muted hover:text-ix-ink';
      badge.innerHTML = '<i class="bi bi-key"></i> Entrar';
      badge.onclick = openAuthModal;
    } else {
      var labels = { owner: 'Admin', empresa: 'Empresa', invite: 'Convidado' };
      var colors = { owner: 'bg-ix-green text-white', empresa: 'bg-blue-500 text-white', invite: 'bg-amber-500 text-white' };
      badge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-ix-sm text-xs font-semibold cursor-pointer ' + (colors[level] || '');
      badge.innerHTML = '<i class="bi bi-shield-check"></i> ' + (labels[level] || level);
      badge.onclick = function () {
        if (confirm('Sair do acesso ' + (labels[level] || level) + '?')) {
          signOut();
        }
      };
    }
  }

  // ─── Auth Modal ───
  function openAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      var input = document.getElementById('auth-token-input');
      var levelSelect = document.getElementById('auth-level-select');
      var errorEl = document.getElementById('auth-error');
      if (input) { input.value = ''; input.focus(); }
      if (levelSelect) levelSelect.value = 'empresa';
      if (errorEl) errorEl.classList.add('hidden');
    }
  }

  function closeAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function saveToken() {
    var input = document.getElementById('auth-token-input');
    var levelSelect = document.getElementById('auth-level-select');
    var errorEl = document.getElementById('auth-error');
    var password = (input && input.value || '').trim();
    var level = levelSelect ? levelSelect.value : 'empresa';

    if (!password) {
      if (errorEl) { errorEl.textContent = 'Digite a senha de acesso.'; errorEl.classList.remove('hidden'); }
      return;
    }

    // Build the prefixed token based on selected level
    var prefixMap = { owner: 'ix_own_', empresa: 'ix_emp_' };
    var prefix = prefixMap[level] || 'ix_emp_';
    var fullToken = prefix + password;

    setCookie('ix_auth', fullToken, 30);
    closeAuthModal();
    updateAuthUI();

    // Trigger hub refresh
    if (window.IXHub && window.IXHub.refreshFilters) {
      window.IXHub.refreshFilters();
    }
  }

  function signOut() {
    deleteCookie('ix_auth');
    deleteCookie('ix_pvt');
    deleteCookie('ix_emp');
    updateAuthUI();
    if (window.IXHub && window.IXHub.refreshFilters) {
      window.IXHub.refreshFilters();
    }
  }

  // ─── Init ───
  // Check URL param ?t= for token (one-time)
  var urlParams = new URLSearchParams(window.location.search);
  var urlToken = urlParams.get('t');
  if (urlToken) {
    setCookie('ix_auth', urlToken, 30);
    var clean = new URL(window.location.href);
    clean.searchParams.delete('t');
    history.replaceState(null, '', clean.toString());
  }

  // Bind modal events
  document.addEventListener('DOMContentLoaded', function () {
    updateAuthUI();
    var saveBtn = document.getElementById('auth-token-save');
    var closeBtn = document.getElementById('auth-modal-close');
    var modalBg = document.getElementById('auth-modal');
    var tokenInput = document.getElementById('auth-token-input');

    if (saveBtn) saveBtn.addEventListener('click', saveToken);
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if (modalBg) modalBg.addEventListener('click', function (e) {
      if (e.target === modalBg) closeAuthModal();
    });
    if (tokenInput) tokenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveToken();
      if (e.key === 'Escape') closeAuthModal();
    });
  });

  // ─── Public API ───
  window.IXAuth = {
    getToken: getToken,
    getLevel: function () { return getLevel(getToken()); },
    canAccess: canAccess,
    isAuthenticated: function () { return getLevel(getToken()) !== 'public'; },
    signOut: signOut,
    openAuthModal: openAuthModal,
    updateUI: updateAuthUI,
  };
})();
