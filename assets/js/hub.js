(function () {
  'use strict';

  var PAGE_SIZE = 15;
  var currentPage = 1;
  var reports = [];
  var clients = {};
  var activeClient = 'all';
  var activeProject = null;
  var activeTags = new Set();
  var currentView = 'list';

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
  var treeAllBtn = document.getElementById('tree-all-btn');
  var countAll = document.getElementById('count-all');
  var tagFiltersEl = document.getElementById('tag-filters');
  var mainTitle = document.getElementById('main-title');
  var dashboardArea = document.getElementById('dashboard-area');
  var timelineView = document.getElementById('timeline-view');
  var paginationNav = document.getElementById('pagination-nav');

  // New report modal
  var newReportBtn = document.getElementById('new-report-btn');
  var newReportModal = document.getElementById('new-report-modal');
  var nrTitle = document.getElementById('nr-title');
  var nrClient = document.getElementById('nr-client');
  var nrProject = document.getElementById('nr-project');
  var nrDesc = document.getElementById('nr-desc');
  var nrOutput = document.getElementById('nr-output');
  var nrCommand = document.getElementById('nr-command');
  var nrCopy = document.getElementById('nr-copy');
  var nrCancel = document.getElementById('nr-cancel');
  var nrGenerate = document.getElementById('nr-generate');

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
    if (window.IXCharts) window.IXCharts.applyTheme(next === 'dark');
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

  // ─── Sidebar Tree ───
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

  // ─── Tags ───
  function renderTags() {
    tagFiltersEl.textContent = '';
    var allTags = new Set();
    reports.forEach(function (r) {
      (r.tags || []).forEach(function (t) { allTags.add(t); });
    });

    Array.from(allTags).sort().forEach(function (tag) {
      var btn = el('button', {
        className: 'sidebar-tag',
        'data-tag': tag,
        textContent: capitalize(tag)
      });
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

    if (client === 'all') {
      mainTitle.textContent = 'Relatorios';
    } else if (clients[client]) {
      mainTitle.textContent = clients[client].name;
      if (project && project !== '__none__' && clients[client].projects && clients[client].projects[project]) {
        mainTitle.textContent += ' / ' + clients[client].projects[project].name;
      }
    }
  }

  function updateTreeActive() {
    treeAllBtn.classList.toggle('active', activeClient === 'all');

    document.querySelectorAll('.tree-client-btn').forEach(function (btn) {
      var isActive = btn.dataset.client === activeClient && !activeProject;
      btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.tree-project-btn').forEach(function (btn) {
      var isActive = btn.dataset.client === activeClient && btn.dataset.project === activeProject;
      btn.classList.toggle('active', isActive);
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

    if (currentView === 'list') {
      paginate();
    }

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

    if (currentView === 'timeline' && window.IXTimeline) {
      window.IXTimeline.render(filtered);
    }

    if (currentView === 'dashboard' && window.IXCharts) {
      window.IXCharts.update(filtered, clients);
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

  // ─── View toggle ───
  document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.dataset.view;
      currentView = view;

      document.querySelectorAll('.view-toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.view === view);
      });

      reportsList.classList.toggle('hidden', view !== 'list');
      timelineView.classList.toggle('active', view === 'timeline');
      dashboardArea.classList.toggle('hidden', view !== 'dashboard');
      paginationNav.classList.toggle('hidden', view !== 'list');

      if (view === 'timeline' && window.IXTimeline) {
        window.IXTimeline.render(getFilteredReports());
      }
      if (view === 'dashboard' && window.IXCharts) {
        window.IXCharts.update(getFilteredReports(), clients);
      }
      if (view === 'list') {
        applyFilters();
      }
    });
  });

  // ─── New Report Modal ───
  newReportBtn.addEventListener('click', function () {
    nrOutput.classList.add('hidden');
    nrTitle.value = '';
    nrDesc.value = '';
    newReportModal.classList.add('active');
    nrTitle.focus();
  });

  nrCancel.addEventListener('click', function () {
    newReportModal.classList.remove('active');
  });

  newReportModal.addEventListener('click', function (e) {
    if (e.target === newReportModal) newReportModal.classList.remove('active');
  });

  nrGenerate.addEventListener('click', function () {
    var title = nrTitle.value.trim();
    var client = nrClient.value;
    var project = nrProject.value;
    var desc = nrDesc.value.trim();

    if (!title) { nrTitle.focus(); return; }

    var cmd = 'claude "gera relatorio ix-reports: titulo=\'' + title + '\'';
    if (client) cmd += ', client=\'' + client + '\'';
    if (project) cmd += ', project=\'' + project + '\'';
    if (desc) cmd += '. ' + desc;
    cmd += '"';

    nrCommand.textContent = cmd;
    nrOutput.classList.remove('hidden');
  });

  nrCopy.addEventListener('click', function () {
    var cmd = nrCommand.textContent;
    navigator.clipboard.writeText(cmd).then(function () {
      showToast('Comando copiado!');
    });
  });

  function populateModalSelects() {
    nrClient.textContent = '';
    Object.keys(clients).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = clients[key].name;
      nrClient.appendChild(opt);
    });

    nrClient.addEventListener('change', updateProjectSelect);
    updateProjectSelect();
  }

  function updateProjectSelect() {
    nrProject.textContent = '';
    var none = document.createElement('option');
    none.value = '';
    none.textContent = 'Nenhum';
    nrProject.appendChild(none);

    var c = clients[nrClient.value];
    if (c && c.projects) {
      Object.keys(c.projects).forEach(function (pKey) {
        var opt = document.createElement('option');
        opt.value = pKey;
        opt.textContent = c.projects[pKey].name;
        nrProject.appendChild(opt);
      });
    }
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
    renderTags();
    renderAll();
    populateModalSelects();
    readHash();

    if (window.IXCmdK) window.IXCmdK.setData(reports, clients);
  }).catch(function (err) {
    console.error('Failed to load data:', err);
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = 'Erro ao carregar relatorios.';
  });
})();
