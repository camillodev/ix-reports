(function () {
  'use strict';

  var PAGE_SIZE = 15;
  var currentPage = 1;
  var reports = [];
  var clients = {};
  var activeClient = 'all';
  var activeProject = null;
  var activeTags = new Set();
  var currentViewMode = localStorage.getItem('ix-view-mode') || 'list';

  // DOM refs
  var reportsList = document.getElementById('reports-list');
  var emptyState = document.getElementById('empty-state');
  var activeFiltersBar = document.getElementById('active-filters');
  var resultCount = document.getElementById('result-count');
  var clearBtn = document.getElementById('clear-filters');
  var paginationEl = document.getElementById('pagination');
  var totalCountEl = document.getElementById('total-count');
  var footerCountEl = document.getElementById('footer-count');
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  var hamburgerBtn = document.getElementById('hamburger');
  var sidebar = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var sidebarTree = document.getElementById('sidebar-tree');
  var sidebarProjects = document.getElementById('sidebar-projects');
  var treeAllBtn = document.getElementById('tree-all-btn');
  var countAll = document.getElementById('count-all');
  var tagFiltersEl = document.getElementById('tag-filters');
  var mainTitle = document.getElementById('main-title');

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
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
  });

  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  // ─── Helpers ───
  function capitalize(str) {
    if (!str) return '';
    return str.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
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

  // ─── Accordion logic ───
  function initAccordions() {
    var headers = document.querySelectorAll('.accordion-header');
    headers.forEach(function (header) {
      var key = header.dataset.accordion;
      var body = document.getElementById('acc-body-' + key);
      var saved = localStorage.getItem('ix-accordion-' + key);

      // Default: clientes open, others closed
      if (saved === 'open') {
        body.classList.add('open');
        header.classList.add('active');
      } else if (saved === 'closed') {
        body.classList.remove('open');
        header.classList.remove('active');
      }
      // else keep HTML default

      header.addEventListener('click', function () {
        var isOpen = body.classList.contains('open');
        body.classList.toggle('open');
        header.classList.toggle('active');
        localStorage.setItem('ix-accordion-' + key, isOpen ? 'closed' : 'open');
      });
    });
  }

  // ─── Router (hash-based) ───
  function readHash() {
    var hash = (location.hash || '').replace('#', '');
    if (!hash) {
      setFilter('all', null);
      return;
    }
    var parts = hash.split('/');
    if (parts.length === 2) {
      setFilter(parts[0], parts[1]);
    } else {
      setFilter(parts[0], null);
    }
  }

  function setHash(client, project) {
    if (client === 'all') {
      history.replaceState(null, '', location.pathname);
    } else if (project) {
      history.replaceState(null, '', '#' + client + '/' + project);
    } else {
      history.replaceState(null, '', '#' + client);
    }
  }

  window.addEventListener('hashchange', readHash);

  // ─── Sidebar Tree (Clientes accordion) ───
  function renderTree() {
    sidebarTree.textContent = '';
    var clientKeys = Object.keys(clients);

    clientKeys.forEach(function (key) {
      var c = clients[key];
      var count = reports.filter(function (r) { return r.client === key; }).length;
      if (count === 0) return;

      var wrapper = el('div', { className: 'tree-client' });

      // Client button
      var btn = el('button', {
        className: 'tree-client-btn',
        'data-client': key
      });
      var dot = el('span', { className: 'client-dot' });
      dot.style.background = c.color || 'var(--ix-green)';
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(c.name));
      btn.appendChild(el('span', { className: 'tree-count', textContent: String(count) }));
      var chevron = el('span', { className: 'chevron' });
      chevron.textContent = '\u203A';
      btn.appendChild(chevron);

      // Projects
      var projectsWrap = el('div', { className: 'tree-projects' });
      var projects = c.projects || {};
      Object.keys(projects).forEach(function (pKey) {
        var pCount = reports.filter(function (r) {
          return r.client === key && r.project === pKey;
        }).length;
        if (pCount === 0) return;

        var pBtn = el('button', {
          className: 'tree-project-btn',
          'data-client': key,
          'data-project': pKey
        });
        pBtn.appendChild(document.createTextNode(projects[pKey].name));
        pBtn.appendChild(el('span', { className: 'proj-count', textContent: String(pCount) }));
        pBtn.addEventListener('click', function () {
          setFilter(key, pKey);
          setHash(key, pKey);
          closeMobileSidebar();
        });
        projectsWrap.appendChild(pBtn);
      });

      // No-project reports
      var noProjectCount = reports.filter(function (r) {
        return r.client === key && !r.project;
      }).length;
      if (noProjectCount > 0) {
        var npBtn = el('button', {
          className: 'tree-project-btn',
          'data-client': key,
          'data-project': '__none__'
        });
        npBtn.appendChild(document.createTextNode('Sem projeto'));
        npBtn.appendChild(el('span', { className: 'proj-count', textContent: String(noProjectCount) }));
        npBtn.addEventListener('click', function () {
          setFilter(key, '__none__');
          setHash(key, null);
          closeMobileSidebar();
        });
        projectsWrap.appendChild(npBtn);
      }

      // Expand/collapse
      var savedState = localStorage.getItem('ix-tree-' + key);
      var isExpanded = savedState !== 'collapsed';

      btn.addEventListener('click', function () {
        if (activeClient === key && !activeProject) {
          var open = projectsWrap.classList.contains('open');
          projectsWrap.classList.toggle('open');
          btn.classList.toggle('expanded');
          localStorage.setItem('ix-tree-' + key, open ? 'collapsed' : 'expanded');
        } else {
          setFilter(key, null);
          setHash(key, null);
          projectsWrap.classList.add('open');
          btn.classList.add('expanded');
          localStorage.setItem('ix-tree-' + key, 'expanded');
          closeMobileSidebar();
        }
      });

      if (isExpanded) {
        projectsWrap.classList.add('open');
        btn.classList.add('expanded');
      }

      wrapper.appendChild(btn);
      wrapper.appendChild(projectsWrap);
      sidebarTree.appendChild(wrapper);
    });

    countAll.textContent = reports.length;
  }

  // ─── Sidebar Projects accordion (flat list) ───
  function renderProjectsList() {
    sidebarProjects.textContent = '';
    var projectMap = {};

    reports.forEach(function (r) {
      if (!r.project) return;
      if (!projectMap[r.project]) {
        projectMap[r.project] = { name: '', count: 0 };
      }
      projectMap[r.project].count++;
      // Get display name from clients data
      if (!projectMap[r.project].name && r.client && clients[r.client] && clients[r.client].projects && clients[r.client].projects[r.project]) {
        projectMap[r.project].name = clients[r.client].projects[r.project].name;
      }
    });

    var sortedProjects = Object.keys(projectMap).sort(function (a, b) {
      return projectMap[b].count - projectMap[a].count;
    });

    sortedProjects.forEach(function (pKey) {
      var p = projectMap[pKey];
      var btn = el('button', {
        className: 'tree-project-btn sidebar-project-flat',
        'data-project-filter': pKey
      });
      btn.appendChild(document.createTextNode(p.name || capitalize(pKey)));
      btn.appendChild(el('span', { className: 'proj-count', textContent: String(p.count) }));
      btn.addEventListener('click', function () {
        // Filter by project across all clients
        activeClient = 'all';
        activeProject = pKey;
        currentPage = 1;
        updateTreeActive();
        applyFilters();
        mainTitle.textContent = p.name || capitalize(pKey);
        setHash('all', null);
        closeMobileSidebar();
      });
      sidebarProjects.appendChild(btn);
    });
  }

  // ─── Tags ───
  function renderTags() {
    tagFiltersEl.textContent = '';
    var tagMap = {};
    reports.forEach(function (r) {
      (r.tags || []).forEach(function (t) {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });

    var sortedTags = Object.keys(tagMap).sort(function (a, b) {
      return tagMap[b] - tagMap[a];
    });

    sortedTags.forEach(function (tag) {
      var btn = el('button', {
        className: 'sidebar-tag',
        'data-tag': tag
      });
      btn.appendChild(document.createTextNode(capitalize(tag)));
      btn.appendChild(el('span', { className: 'tag-count', textContent: ' (' + tagMap[tag] + ')' }));
      btn.addEventListener('click', function () {
        if (activeTags.has(tag)) {
          activeTags.delete(tag);
          btn.classList.remove('active');
        } else {
          activeTags.add(tag);
          btn.classList.add('active');
        }
        currentPage = 1;
        applyFilters();
      });
      tagFiltersEl.appendChild(btn);
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
    } else if (client === 'all' && project) {
      // Project-only filter (from Projetos accordion)
      mainTitle.textContent = capitalize(project);
    } else if (clients[client]) {
      mainTitle.textContent = clients[client].name;
      if (project && project !== '__none__' && clients[client].projects && clients[client].projects[project]) {
        mainTitle.textContent += ' / ' + clients[client].projects[project].name;
      }
    }
  }

  function updateTreeActive() {
    treeAllBtn.classList.toggle('active', activeClient === 'all' && !activeProject);

    document.querySelectorAll('.tree-client-btn').forEach(function (btn) {
      var isActive = btn.dataset.client === activeClient && !activeProject;
      btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.tree-project-btn').forEach(function (btn) {
      var isActive = btn.dataset.client === activeClient && btn.dataset.project === activeProject;
      btn.classList.toggle('active', isActive);
    });

    // Flat project list highlight
    document.querySelectorAll('.sidebar-project-flat').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.projectFilter === activeProject && activeClient === 'all');
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
    currentPage = 1;
    mainTitle.textContent = 'Relatorios';
    setHash('all', null);
    updateTreeActive();
    document.querySelectorAll('.sidebar-tag.active').forEach(function (t) {
      t.classList.remove('active');
    });
    applyFilters();
  });

  // ─── Report rendering ───
  function getClientColor(clientSlug) {
    if (clients[clientSlug]) return clients[clientSlug].color;
    return 'var(--ix-green)';
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
      'data-slug': r.slug
    });

    if (r.type === 'pdf' || r.type === 'md') a.setAttribute('target', '_blank');

    a.style.borderLeftColor = 'transparent';
    a.addEventListener('mouseenter', function () {
      a.style.borderLeftColor = getClientColor(r.client);
    });
    a.addEventListener('mouseleave', function () {
      a.style.borderLeftColor = 'transparent';
    });

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
    var infoDiv = el('div', { className: 'rr-info' }, [titleDiv, metaDiv]);
    a.appendChild(infoDiv);

    var tagsDiv = el('div', { className: 'rr-tags' });
    if (r.client) {
      var tag = el('span', {
        className: 'rr-tag rr-tag-empresa',
        textContent: capitalize(r.client)
      });
      tag.style.background = getClientColor(r.client);
      tagsDiv.appendChild(tag);
    }
    if (r.project) {
      tagsDiv.appendChild(el('span', {
        className: 'rr-tag rr-tag-projeto',
        textContent: capitalize(r.project)
      }));
    }
    if (r.tags && r.tags[0]) {
      tagsDiv.appendChild(el('span', {
        className: 'rr-tag rr-tag-area',
        textContent: capitalize(r.tags[0])
      }));
    }
    a.appendChild(tagsDiv);

    a.appendChild(el('span', { className: 'rr-arrow', textContent: '\u203A' }));

    return a;
  }

  function renderAll() {
    while (reportsList.firstChild) reportsList.removeChild(reportsList.firstChild);
    reports.forEach(function (r) {
      reportsList.appendChild(createReportRow(r));
    });
    totalCountEl.textContent = reports.length;
    footerCountEl.textContent = reports.length;
    applyFilters();
  }

  // ─── Filters ───
  function getFilteredReports() {
    return reports.filter(function (r) {
      var matchesClient = activeClient === 'all' || r.client === activeClient;
      var matchesProject = !activeProject ||
        (activeProject === '__none__' ? !r.project : r.project === activeProject);
      var matchesTags = activeTags.size === 0 ||
        (r.tags || []).some(function (t) { return activeTags.has(t); });
      return matchesClient && matchesProject && matchesTags;
    });
  }

  function applyFilters() {
    var filtered = getFilteredReports();
    var hasFilters = activeClient !== 'all' || activeProject || activeTags.size > 0;

    var rows = reportsList.querySelectorAll('.report-row');
    var filteredSlugs = new Set(filtered.map(function (r) { return r.slug; }));

    rows.forEach(function (row) {
      row.classList.toggle('filter-hidden', !filteredSlugs.has(row.dataset.slug));
      row.classList.remove('page-hidden');
    });

    paginate();

    var visibleCount = filtered.length;

    if (visibleCount === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }

    if (hasFilters) {
      activeFiltersBar.classList.remove('hidden');
      resultCount.textContent = visibleCount + ' de ' + reports.length + ' relatorios';
    } else {
      activeFiltersBar.classList.add('hidden');
    }
  }

  function paginate() {
    var visible = Array.from(reportsList.querySelectorAll('.report-row:not(.filter-hidden)'));
    var totalPages = Math.ceil(visible.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    visible.forEach(function (row, i) {
      row.classList.toggle('page-hidden', i < (currentPage - 1) * PAGE_SIZE || i >= currentPage * PAGE_SIZE);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    while (paginationEl.firstChild) paginationEl.removeChild(paginationEl.firstChild);
    if (totalPages <= 1) return;

    addPageItem('\u2039', currentPage > 1, function () { currentPage--; applyFilters(); scrollToList(); });
    for (var i = 1; i <= totalPages; i++) {
      (function (page) {
        addPageItem(String(page), true, function () { currentPage = page; applyFilters(); scrollToList(); }, page === currentPage);
      })(i);
    }
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

  function scrollToList() {
    reportsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── View toggle (list/grid) ───
  function initViewToggle() {
    if (currentViewMode === 'grid') {
      reportsList.classList.add('grid-view');
    }
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

  // ─── Expose for other modules ───
  window.IXHub = {
    getReports: function () { return reports; },
    getClients: function () { return clients; },
    getFilteredReports: getFilteredReports,
    toggleTheme: toggleTheme,
    showToast: showToast
  };

  // ─── Init ───
  initTheme();
  initAccordions();
  initViewToggle();

  Promise.all([
    fetch('data/reports.json').then(function (r) { return r.json(); }),
    fetch('data/clients.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    reports = results[0];
    clients = results[1];

    reports.sort(function (a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.date || '').localeCompare(a.date || '');
    });

    renderTree();
    renderProjectsList();
    renderTags();
    renderAll();
    readHash();

    if (window.IXCmdK) window.IXCmdK.setData(reports, clients);
  }).catch(function (err) {
    console.error('Failed to load data:', err);
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = 'Erro ao carregar relatorios.';
  });
})();
