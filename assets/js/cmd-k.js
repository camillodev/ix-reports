(function () {
  'use strict';

  var overlay = document.getElementById('cmdk-overlay');
  var input = document.getElementById('cmdk-input');
  var resultsEl = document.getElementById('cmdk-results');
  var trigger = document.getElementById('cmdk-trigger');

  var reports = [];
  var clients = {};
  var activeIndex = 0;
  var items = [];
  var debounceTimer = null;

  function open() {
    overlay.classList.add('active');
    input.value = '';
    activeIndex = 0;
    renderResults('');
    setTimeout(function () { input.focus(); }, 50);
  }

  function close() {
    overlay.classList.remove('active');
    input.value = '';
  }

  function toggle() {
    if (overlay.classList.contains('active')) close();
    else open();
  }

  // Keyboard shortcut
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggle();
      return;
    }
    if (!overlay.classList.contains('active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[activeIndex]) activateItem(items[activeIndex]);
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  // Trigger button
  trigger.addEventListener('click', open);

  // Search input
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      activeIndex = 0;
      renderResults(input.value.trim().toLowerCase());
    }, 150);
  });

  // ─── Fuzzy scoring ───
  function score(query, item) {
    if (!query) return 1;
    var s = 0;
    var title = (item.title || '').toLowerCase();
    var client = (item.client || '').toLowerCase();
    var project = (item.project || '').toLowerCase();
    var tags = (item.tags || []).join(' ').toLowerCase();
    var meta = (item.meta || '').toLowerCase();

    if (title.indexOf(query) !== -1) s += 10;
    if (client.indexOf(query) !== -1) s += 5;
    if (project.indexOf(query) !== -1) s += 4;
    if (tags.indexOf(query) !== -1) s += 3;
    if (meta.indexOf(query) !== -1) s += 2;

    // Partial word match
    var words = query.split(/\s+/);
    var allMatch = words.every(function (w) {
      return title.indexOf(w) !== -1 || client.indexOf(w) !== -1 ||
        project.indexOf(w) !== -1 || tags.indexOf(w) !== -1 || meta.indexOf(w) !== -1;
    });
    if (allMatch && s === 0) s += 1;

    return s;
  }

  // ─── Render ───
  function renderResults(query) {
    resultsEl.textContent = '';
    items = [];

    // Reports
    var scored = reports.map(function (r) {
      return { item: r, score: score(query, r), type: 'report' };
    }).filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 10);

    // Actions (only if query matches)
    var actions = [
      { title: 'Alternar tema (dark/light)', action: 'toggle-theme', icon: 'moon-fill' },
      { title: 'Novo relatorio', action: 'new-report', icon: 'plus-lg' }
    ];

    var scoredActions = actions.map(function (a) {
      var s = 0;
      if (!query) s = 1;
      else if (a.title.toLowerCase().indexOf(query) !== -1) s = 5;
      return { item: a, score: s, type: 'action' };
    }).filter(function (s) { return s.score > 0; });

    // Render groups
    if (scored.length > 0) {
      var label = document.createElement('div');
      label.className = 'cmdk-group-label';
      label.textContent = 'Relatorios';
      resultsEl.appendChild(label);

      scored.forEach(function (s) {
        var div = createReportItem(s.item);
        items.push({ el: div, data: s.item, type: 'report' });
        resultsEl.appendChild(div);
      });
    }

    if (scoredActions.length > 0) {
      var actionLabel = document.createElement('div');
      actionLabel.className = 'cmdk-group-label';
      actionLabel.textContent = 'Acoes';
      resultsEl.appendChild(actionLabel);

      scoredActions.forEach(function (s) {
        var div = createActionItem(s.item);
        items.push({ el: div, data: s.item, type: 'action' });
        resultsEl.appendChild(div);
      });
    }

    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'cmdk-empty';
      empty.textContent = 'Nenhum resultado encontrado';
      resultsEl.appendChild(empty);
    }

    updateActive();
  }

  function createReportItem(r) {
    var div = document.createElement('div');
    div.className = 'cmdk-item';

    var icon = document.createElement('span');
    icon.className = 'item-icon';
    var i = document.createElement('i');
    i.className = 'bi bi-' + (r.icon || 'file-earmark-text');
    icon.appendChild(i);
    div.appendChild(icon);

    var info = document.createElement('div');
    info.className = 'item-info';
    var title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = r.title;
    var meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = r.meta || r.date;
    info.appendChild(title);
    info.appendChild(meta);
    div.appendChild(info);

    if (r.client && clients[r.client]) {
      var badge = document.createElement('span');
      badge.className = 'item-badge';
      badge.style.background = clients[r.client].color;
      badge.textContent = clients[r.client].name;
      div.appendChild(badge);
    }

    div.addEventListener('click', function () {
      activateItem({ data: r, type: 'report' });
    });

    return div;
  }

  function createActionItem(a) {
    var div = document.createElement('div');
    div.className = 'cmdk-item';

    var icon = document.createElement('span');
    icon.className = 'item-icon';
    var i = document.createElement('i');
    i.className = 'bi bi-' + a.icon;
    icon.appendChild(i);
    div.appendChild(icon);

    var info = document.createElement('div');
    info.className = 'item-info';
    var title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = a.title;
    info.appendChild(title);
    div.appendChild(info);

    div.addEventListener('click', function () {
      activateItem({ data: a, type: 'action' });
    });

    return div;
  }

  function updateActive() {
    items.forEach(function (item, i) {
      item.el.classList.toggle('active', i === activeIndex);
    });
    if (items[activeIndex]) {
      items[activeIndex].el.scrollIntoView({ block: 'nearest' });
    }
  }

  function activateItem(item) {
    close();
    if (item.type === 'report') {
      window.location.href = 'data/' + item.data.file;
    } else if (item.type === 'action') {
      if (item.data.action === 'toggle-theme' && window.IXHub) {
        window.IXHub.toggleTheme();
      } else if (item.data.action === 'new-report') {
        document.getElementById('new-report-btn').click();
      }
    }
  }

  // ─── Public API ───
  window.IXCmdK = {
    open: open,
    close: close,
    toggle: toggle,
    setData: function (r, c) {
      reports = r;
      clients = c;
    }
  };
})();
