/**
 * IX Auth — Token-based access control for Relatório X.
 *
 * Token prefixes:
 *   ix_own_  → owner/admin (sees everything)
 *   ix_emp_  → empresa (sees public + empresa)
 *   ix_inv_  → invite (sees public + specific private reports with matching token)
 *
 * Tokens stored in cookies: ix_auth (main token)
 * Also checks legacy ix_pvt cookie for backward compat.
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
    // Legacy tokens (no prefix) → treat as private/invite
    return 'invite';
  }

  // ─── Access check ───
  function canAccess(report) {
    var access = report.access || 'public';
    if (access === 'public') return true;

    var token = getToken();
    var level = getLevel(token);

    // Owner sees everything
    if (level === 'owner') return true;

    // Empresa level: sees public + empresa
    if (access === 'empresa') return level === 'empresa' || level === 'owner';

    // Pessoal: only owner
    if (access === 'pessoal') return level === 'owner';

    // Private: check if token is in allowedTokens
    if (access === 'private') {
      if (level === 'owner') return true;
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

    if (!token || level === 'public') {
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
      if (input) { input.value = ''; input.focus(); }
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
    var token = (input && input.value || '').trim();
    if (!token) return;
    setCookie('ix_auth', token, 30);
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
    // Clean URL
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
    isAuthenticated: function () { return !!getToken(); },
    signOut: signOut,
    openAuthModal: openAuthModal,
    updateUI: updateAuthUI,
  };
})();
