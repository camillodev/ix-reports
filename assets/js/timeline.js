(function () {
  'use strict';

  var container = document.getElementById('timeline-view');

  var MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  function getMonthKey(dateStr) {
    if (!dateStr) return 'Sem data';
    var parts = dateStr.split('-');
    var y = parts[0];
    var m = parseInt(parts[1], 10);
    return MONTHS[m - 1] + ' ' + y;
  }

  function getQuarter(dateStr) {
    if (!dateStr) return 'Sem data';
    var parts = dateStr.split('-');
    var y = parts[0];
    var m = parseInt(parts[1], 10);
    var q = Math.ceil(m / 3);
    return 'Q' + q + ' ' + y;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function render(reports, groupBy) {
    container.textContent = '';
    groupBy = groupBy || 'month';

    // Group reports
    var groups = {};
    reports.forEach(function (r) {
      var key = groupBy === 'quarter' ? getQuarter(r.date) : getMonthKey(r.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    var keys = Object.keys(groups).sort(function (a, b) {
      // Sort desc by getting first report's date in each group
      var dateA = groups[a][0] ? groups[a][0].date : '';
      var dateB = groups[b][0] ? groups[b][0].date : '';
      return dateB.localeCompare(dateA);
    });

    keys.forEach(function (key) {
      var group = document.createElement('div');
      group.className = 'timeline-group';

      // Header
      var header = document.createElement('div');
      header.className = 'timeline-group-header';

      var chevron = document.createElement('span');
      chevron.className = 'timeline-group-chevron';
      chevron.textContent = '\u25BC';
      header.appendChild(chevron);

      var title = document.createElement('span');
      title.className = 'timeline-group-title';
      title.textContent = key;
      header.appendChild(title);

      var count = document.createElement('span');
      count.className = 'timeline-group-count';
      count.textContent = groups[key].length + ' reports';
      header.appendChild(count);

      var line = document.createElement('span');
      line.className = 'timeline-group-line';
      header.appendChild(line);

      header.addEventListener('click', function () {
        group.classList.toggle('collapsed');
      });

      group.appendChild(header);

      // Items
      var itemsWrap = document.createElement('div');
      itemsWrap.className = 'timeline-items';

      groups[key].forEach(function (r) {
        var item = document.createElement('div');
        item.className = 'timeline-item';

        var a = document.createElement('a');
        a.className = 'report-row';
        a.href = 'data/' + r.file;
        if (r.type === 'pdf' || r.type === 'md') a.setAttribute('target', '_blank');

        var icon = document.createElement('span');
        icon.className = 'rr-icon';
        var i = document.createElement('i');
        i.className = 'bi bi-' + (r.icon || 'file-earmark-text');
        icon.appendChild(i);
        a.appendChild(icon);

        var info = document.createElement('div');
        info.className = 'rr-info';

        var titleEl = document.createElement('div');
        titleEl.className = 'rr-title';
        if (r.num) {
          var num = document.createElement('span');
          num.className = 'rr-num';
          num.textContent = r.num;
          titleEl.appendChild(num);
        }
        titleEl.appendChild(document.createTextNode(r.title));

        var meta = document.createElement('div');
        meta.className = 'rr-meta';
        meta.textContent = r.meta || r.date;

        info.appendChild(titleEl);
        info.appendChild(meta);
        a.appendChild(info);

        if (r.client) {
          var tag = document.createElement('span');
          tag.className = 'rr-tag rr-tag-empresa';
          tag.textContent = capitalize(r.client);
          var clients = window.IXHub ? window.IXHub.getClients() : {};
          if (clients[r.client]) tag.style.background = clients[r.client].color;
          a.appendChild(tag);
        }

        var arrow = document.createElement('span');
        arrow.className = 'rr-arrow';
        arrow.textContent = '\u203A';
        a.appendChild(arrow);

        item.appendChild(a);
        itemsWrap.appendChild(item);
      });

      group.appendChild(itemsWrap);
      container.appendChild(group);
    });

    if (reports.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      var p = document.createElement('p');
      p.textContent = 'Nenhum relatorio para exibir na timeline.';
      empty.appendChild(p);
      container.appendChild(empty);
    }
  }

  window.IXTimeline = {
    render: render
  };
})();
