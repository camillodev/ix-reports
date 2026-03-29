(function () {
  'use strict';

  var PAGE_SIZE = 15;
  var currentPage = 1;
  var reports = [];
  var clients = {};
  var activeClient = 'all';
  var activeProject = null;
  var activeTags = new Set();
  var activeAccess = null;
  var currentSort = localStorage.getItem('ix-sort') || 'date-desc';
  var currentViewMode = localStorage.getItem('ix-view-mode') || 'list';

  // DOM refs
  var reportsList = document.getElementById('reports-list');
  var emptyState = document.getElementById('empty-state');
  var activeFiltersBar = document.getElementById('active-filters');
  var resultCount = document.getElementById('result-count');
  var clearBtn = document.getElementById('clear-filters');
  var paginationEl = document.getElementById('pagination');
  var paginationInfo = document.getElementById('pagination-info');
  var totalCountEl = document.getElementById('total-count');
  var footerCountEl = document.getElementById('footer-count');
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  var hamburgerBtn = document.getElementById('hamburger');
  var sidebar = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var sidebarTree = document.getElementById('sidebar-tree');
  var treeAllBtn = document.getElementById('tree-all-btn');
  var countAll = document.getElementById('count-all');
  var tagFiltersEl = document.getElementById('tag-filters');
  var accessFiltersEl = document.getElementById('access-filters');
  var mainTitle = document.getElementById('main-title');
  var sortSelect = document.getElementById('sort-select');
  var toast = document.getElementById('toast');

  // ─── Theme ───
  function initTheme() {
    var saved = localStorage.getItem('ix-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ix-theme', next);
    updateThemeIcon();
  }

  themeToggle.addEventListener('click', toggleTheme);

  // ─── Hamburger (mobile) ───
  hamburgerBtn.addEventListener('click', function () {
    sidebar.classList.toggle('sidebar-open');
    sidebarOverlay.classList.toggle('hidden');
  });

  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  function closeMobileSidebar() {
    sidebar.classList.remove('sidebar-open');
    if (!sidebarOverlay.classList.contains('hidden')) {
      sidebarOverlay.classList.add('hidden');
    }
  }

  // ─── Helpers ───
  function capitalize(str) {
    if (!str) return '';
    var s = str.replace(/-/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'textContent') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      children.forEach(function (c) {
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else if (c) node.appendChild(c);
      });
    }
    return node;
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  // ─── Tag icon map ───
  var tagIcons = {
    'estrategia': 'compass', 'financeiro': 'currency-dollar', 'comercial': 'megaphone',
    'tech': 'cpu', 'operacoes': 'gear', 'cultura': 'people', 'produto': 'box-seam',
    'rh': 'person-badge', 'automacao': 'robot', 'integracao': 'link-45deg',
    'espiritualidade': 'brightness-high', 'carreira': 'briefcase', 'metricas': 'bar-chart',
    'roadmap': 'signpost-split', 'modelo-negocio': 'diagram-3', 'time': 'people-fill',
    'processo': 'kanban', 'entrevista': 'chat-dots', 'educacao': 'mortarboard',
    'people': 'people', 'legal': 'balance-scale', 'ritual': 'brightness-high'
  };

  var accessIcons = {
    'public': 'globe', 'empresa': 'building', 'pessoal': 'person-lock', 'private': 'lock'
  };

  function getTagIcon(tag) { return tagIcons[tag] || 'tag'; }

  // ─── Sorting ───
  function sortReports(arr) {
    var sorted = arr.slice();
    // Always pin first
    sorted.sort(function (a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (currentSort) {
        case 'date-asc':
          return (a.date || '').localeCompare(b.date || '');
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'client-asc':
          return (a.client || '').localeCompare(b.client || '') || (b.date || '').localeCompare(a.date || '');
        default: // date-desc
          return (b.date || '').localeCompare(a.date || '');
      }
    });
    return sorted;
  }

  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', function () {
      currentSort = sortSelect.value;
      localStorage.setItem('ix-sort', currentSort);
      currentPage = 1;
      renderAll();
    });
  }

  // ─── Router (hash-based) ───
  function readHash() {
    var hash = (location.hash || '').replace('#', '');
    if (!hash) { setFilter('all', null); return; }
    var parts = hash.split('/');
    if (parts.length === 2) setFilter(parts[0], parts[1]);
    else setFilter(parts[0], null);
  }

  function setHash(client, project) {
    if (client === 'all') history.replaceState(null, '', location.pathname);
    else if (project) history.replaceState(null, '', '#' + client + '/' + project);
    else history.replaceState(null, '', '#' + client);
  }

  window.addEventListener('hashchange', readHash);

  // ─── Sidebar: Clients ───
  function renderTree() {
    sidebarTree.textContent = '';
    var clientKeys = Object.keys(clients);
    clientKeys.forEach(function (key) {
      var c = clients[key];
      var count = reports.filter(function (r) { return r.client === key; }).length;
      var btn = el('button', { className: 'nav-item', 'data-client': key });
      btn.appendChild(el('i', { className: 'bi bi-' + (c.icon || 'building') + ' nav-icon' }));
      btn.appendChild(el('span', { className: 'nav-label', textContent: c.name }));
      btn.appendChild(el('span', { className: 'nav-count', textContent: String(count) }));
      btn.addEventListener('click', function () {
        setFilter(key, null);
        setHash(key, null);
        closeMobileSidebar();
      });
      sidebarTree.appendChild(btn);
    });
    countAll.textContent = reports.length;
  }

  // ─── Sidebar: Tags ───
  function renderTags() {
    tagFiltersEl.textContent = '';
    var tagMap = {};
    reports.forEach(function (r) {
      (r.tags || []).forEach(function (t) { tagMap[t] = (tagMap[t] || 0) + 1; });
    });
    var sortedTags = Object.keys(tagMap).sort(function (a, b) { return tagMap[b] - tagMap[a]; });
    sortedTags.forEach(function (tag) {
      var btn = el('button', { className: 'nav-item', 'data-tag': tag });
      btn.appendChild(el('i', { className: 'bi bi-' + getTagIcon(tag) + ' nav-icon' }));
      btn.appendChild(el('span', { className: 'nav-label', textContent: capitalize(tag) }));
      btn.appendChild(el('span', { className: 'nav-count', textContent: String(tagMap[tag]) }));
      btn.addEventListener('click', function () {
        if (activeTags.has(tag)) { activeTags.delete(tag); btn.classList.remove('active'); }
        else { activeTags.add(tag); btn.classList.add('active'); }
        currentPage = 1;
        applyFilters();
      });
      tagFiltersEl.appendChild(btn);
    });
  }

  // ─── Sidebar: Access Levels ───
  function renderAccessFilters() {
    if (!accessFiltersEl) return;
    accessFiltersEl.textContent = '';
    var levels = ['public', 'empresa', 'pessoal', 'private'];
    var labels = { public: 'Publico', empresa: 'Empresa', pessoal: 'Pessoal', private: 'Privado' };

    levels.forEach(function (lvl) {
      var count = reports.filter(function (r) {
        return (r.access || 'public') === lvl && (!window.IXAuth || window.IXAuth.canAccess(r));
      }).length;
      if (count === 0) return; // Don't show empty levels

      var btn = el('button', { className: 'nav-item', 'data-access': lvl });
      btn.appendChild(el('i', { className: 'bi bi-' + (accessIcons[lvl] || 'shield') + ' nav-icon' }));
      btn.appendChild(el('span', { className: 'nav-label', textContent: labels[lvl] }));
      btn.appendChild(el('span', { className: 'nav-count', textContent: String(count) }));
      btn.addEventListener('click', function () {
        if (activeAccess === lvl) {
          activeAccess = null;
          btn.classList.remove('active');
        } else {
          activeAccess = lvl;
          accessFiltersEl.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        }
        currentPage = 1;
        applyFilters();
      });
      accessFiltersEl.appendChild(btn);
    });
  }

  // ─── Filter logic ───
  function setFilter(client, project) {
    activeClient = client;
    activeProject = project;
    currentPage = 1;
    updateTreeActive();
    applyFilters();

    if (client === 'all' && !project) {
      mainTitle.textContent = 'Relatorios';
    } else if (clients[client]) {
      mainTitle.textContent = clients[client].name;
      if (project && project !== '__none__' && clients[client].projects && clients[client].projects[project]) {
        mainTitle.textContent += ' / ' + clients[client].projects[project].name;
      }
    }
  }

  function updateTreeActive() {
    treeAllBtn.classList.toggle('active', activeClient === 'all' && !activeProject);
    document.querySelectorAll('#sidebar-tree .nav-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.client === activeClient);
    });
  }

  treeAllBtn.addEventListener('click', function () {
    setFilter('all', null);
    setHash('all', null);
    closeMobileSidebar();
  });

  clearBtn.addEventListener('click', function () {
    activeClient = 'all';
    activeProject = null;
    activeTags.clear();
    activeAccess = null;
    currentPage = 1;
    mainTitle.textContent = 'Relatorios';
    setHash('all', null);
    updateTreeActive();
    document.querySelectorAll('#tag-filters .nav-item.active').forEach(function (t) { t.classList.remove('active'); });
    if (accessFiltersEl) accessFiltersEl.querySelectorAll('.nav-item.active').forEach(function (t) { t.classList.remove('active'); });
    applyFilters();
  });

  // ─── Report rendering ───
  function getClientColor(clientSlug) {
    return clients[clientSlug] ? clients[clientSlug].color : 'var(--ix-green)';
  }

  function createReportRow(r) {
    var href = 'data/' + r.file;
    var iconClass = 'bi bi-' + (r.icon || 'file-earmark-text');
    var a = el('a', {
      className: 'report-row',
      href: href,
      'data-client': r.client || '',
      'data-project': r.project || '',
      'data-tags': (r.tags || []).join(','),
      'data-slug': r.slug,
      'data-access': r.access || 'public'
    });
    if (r.type === 'pdf' || r.type === 'md') a.setAttribute('target', '_blank');
    a.style.borderLeftColor = 'transparent';
    a.addEventListener('mouseenter', function () { a.style.borderLeftColor = getClientColor(r.client); });
    a.addEventListener('mouseleave', function () { a.style.borderLeftColor = 'transparent'; });

    a.appendChild(el('span', { className: 'rr-icon' }, [el('i', { className: iconClass })]));

    var titleDiv = el('div', { className: 'rr-title' });
    if (r.pinned) {
      var pin = el('span', { className: 'rr-pin' });
      pin.appendChild(el('i', { className: 'bi bi-pin-fill' }));
      titleDiv.appendChild(pin);
    }
    if (r.num) titleDiv.appendChild(el('span', { className: 'rr-num', textContent: r.num }));
    titleDiv.appendChild(document.createTextNode(r.title));

    var metaDiv = el('div', { className: 'rr-meta', textContent: r.meta || r.date });
    a.appendChild(el('div', { className: 'rr-info' }, [titleDiv, metaDiv]));

    var tagsDiv = el('div', { className: 'rr-tags' });
    if (r.client) {
      var tag = el('span', { className: 'rr-tag rr-tag-empresa', textContent: capitalize(r.client) });
      tag.style.background = getClientColor(r.client);
      tagsDiv.appendChild(tag);
    }
    if (r.project) {
      tagsDiv.appendChild(el('span', { className: 'rr-tag rr-tag-projeto', textContent: capitalize(r.project) }));
    }
    if (r.tags && r.tags[0]) {
      tagsDiv.appendChild(el('span', { className: 'rr-tag rr-tag-area', textContent: capitalize(r.tags[0]) }));
    }
    // Access badge for non-public
    var access = r.access || 'public';
    if (access !== 'public') {
      var accessLabels = { empresa: 'Empresa', pessoal: 'Pessoal', private: 'Privado' };
      tagsDiv.appendChild(el('span', { className: 'rr-tag rr-tag-access', textContent: '🔒 ' + (accessLabels[access] || access) }));
    }
    a.appendChild(tagsDiv);
    return a;
  }

  function renderAll() {
    while (reportsList.firstChild) reportsList.removeChild(reportsList.firstChild);

    // Filter by access first (hide inaccessible)
    var accessible = reports.filter(function (r) {
      return !window.IXAuth || window.IXAuth.canAccess(r);
    });

    var sorted = sortReports(accessible);
    sorted.forEach(function (r) { reportsList.appendChild(createReportRow(r)); });

    totalCountEl.textContent = accessible.length;
    footerCountEl.textContent = reports.length;
    applyFilters();
  }

  // ─── Filters ───
  function getFilteredReports() {
    return reports.filter(function (r) {
      // Access check
      if (window.IXAuth && !window.IXAuth.canAccess(r)) return false;

      var matchesClient = activeClient === 'all' || r.client === activeClient;
      var matchesProject = !activeProject ||
        (activeProject === '__none__' ? !r.project : r.project === activeProject);
      var matchesTags = activeTags.size === 0 ||
        (r.tags || []).some(function (t) { return activeTags.has(t); });
      var matchesAccess = !activeAccess || (r.access || 'public') === activeAccess;
      return matchesClient && matchesProject && matchesTags && matchesAccess;
    });
  }

  function applyFilters() {
    var filtered = getFilteredReports();
    var hasFilters = activeClient !== 'all' || activeProject || activeTags.size > 0 || activeAccess;
    var filteredSlugs = new Set(filtered.map(function (r) { return r.slug; }));

    var rows = reportsList.querySelectorAll('.report-row');
    rows.forEach(function (row) {
      row.classList.toggle('filter-hidden', !filteredSlugs.has(row.dataset.slug));
      row.classList.remove('page-hidden');
    });

    paginate();
    var visibleCount = filtered.length;

    if (visibleCount === 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');

    if (hasFilters) {
      activeFiltersBar.classList.remove('hidden');
      resultCount.textContent = visibleCount + ' de ' + reports.length + ' relatorios';
    } else {
      activeFiltersBar.classList.add('hidden');
    }
    totalCountEl.textContent = visibleCount;
  }

  function paginate() {
    var visible = Array.from(reportsList.querySelectorAll('.report-row:not(.filter-hidden)'));
    var totalPages = Math.ceil(visible.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    visible.forEach(function (row, i) {
      row.classList.toggle('page-hidden', i < (currentPage - 1) * PAGE_SIZE || i >= currentPage * PAGE_SIZE);
    });

    // Info text
    if (paginationInfo && visible.length > 0) {
      var start = (currentPage - 1) * PAGE_SIZE + 1;
      var end = Math.min(currentPage * PAGE_SIZE, visible.length);
      paginationInfo.textContent = 'Mostrando ' + start + '-' + end + ' de ' + visible.length;
    } else if (paginationInfo) {
      paginationInfo.textContent = '';
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    while (paginationEl.firstChild) paginationEl.removeChild(paginationEl.firstChild);
    if (totalPages <= 1) return;

    // Prev
    addPageItem('\u2039', currentPage > 1, function () { currentPage--; applyFilters(); scrollToList(); });

    // Smart page range: first, ..., current-1, current, current+1, ..., last
    var pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (var i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    pages.forEach(function (p) {
      if (p === '...') {
        addEllipsis();
      } else {
        addPageItem(String(p), true, function () { currentPage = p; applyFilters(); scrollToList(); }, p === currentPage);
      }
    });

    // Next
    addPageItem('\u203A', currentPage < totalPages, function () { currentPage++; applyFilters(); scrollToList(); });
  }

  function addPageItem(label, enabled, onClick, active) {
    var li = document.createElement('li');
    li.className = 'page-item' + (!enabled ? ' disabled' : '') + (active ? ' active' : '');
    var a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (enabled && !active) onClick();
    });
    li.appendChild(a);
    paginationEl.appendChild(li);
  }

  function addEllipsis() {
    var li = document.createElement('li');
    li.className = 'page-item ellipsis';
    var span = document.createElement('span');
    span.className = 'page-link';
    span.textContent = '...';
    li.appendChild(span);
    paginationEl.appendChild(li);
  }

  function scrollToList() {
    reportsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Keyboard pagination ───
  document.addEventListener('keydown', function (e) {
    // Don't capture if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      currentPage--;
      applyFilters();
      scrollToList();
    } else if (e.key === 'ArrowRight') {
      var visible = reportsList.querySelectorAll('.report-row:not(.filter-hidden)');
      var totalPages = Math.ceil(visible.length / PAGE_SIZE);
      if (currentPage < totalPages) {
        currentPage++;
        applyFilters();
        scrollToList();
      }
    }
  });

  // ─── View toggle (list/grid) ───
  function initViewToggle() {
    if (currentViewMode === 'grid') reportsList.classList.add('grid-view');
    document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === currentViewMode);
      btn.addEventListener('click', function () {
        var view = btn.dataset.view;
        currentViewMode = view;
        localStorage.setItem('ix-view-mode', view);
        document.querySelectorAll('.view-toggle-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.view === view);
        });
        reportsList.classList.toggle('grid-view', view === 'grid');
      });
    });
  }

  // ─── Public API ───
  window.IXHub = {
    getReports: function () { return reports; },
    getClients: function () { return clients; },
    getFilteredReports: getFilteredReports,
    toggleTheme: toggleTheme,
    showToast: showToast,
    refreshFilters: function () {
      renderAccessFilters();
      renderAll();
    }
  };

  // ─── Init ───
  initTheme();
  initViewToggle();

  Promise.all([
    fetch('data/reports.json').then(function (r) { return r.json(); }),
    fetch('data/clients.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    reports = results[0];
    clients = results[1];

    renderTree();
    renderTags();
    renderAccessFilters();
    renderAll();
    readHash();

    if (window.IXCmdK) window.IXCmdK.setData(reports, clients);
  }).catch(function (err) {
    console.error('Failed to load data:', err);
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = 'Erro ao carregar relatorios.';
  });
})();
