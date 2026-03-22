(function () {
  'use strict';

  var chartsLoaded = false;
  var pendingUpdate = null;

  var MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // CDN URLs for amCharts 5
  var cdnBase = 'https://cdn.amcharts.com/lib/5/';
  var scripts = [
    cdnBase + 'index.js',
    cdnBase + 'xy.js',
    cdnBase + 'percent.js',
    cdnBase + 'themes/Animated.js'
  ];

  var monthlyChart = null;
  var clientChart = null;
  var tagChart = null;

  function loadScripts(urls, callback) {
    var loaded = 0;
    urls.forEach(function (url) {
      var script = document.createElement('script');
      script.src = url;
      script.defer = true;
      script.onload = function () {
        loaded++;
        if (loaded === urls.length) callback();
      };
      script.onerror = function () {
        console.warn('amCharts failed to load:', url);
      };
      document.head.appendChild(script);
    });
  }

  function ensureLoaded(callback) {
    if (chartsLoaded) {
      callback();
      return;
    }
    if (typeof am5 !== 'undefined') {
      chartsLoaded = true;
      callback();
      return;
    }
    loadScripts(scripts, function () {
      chartsLoaded = true;
      callback();
    });
  }

  function disposeCharts() {
    if (monthlyChart) { monthlyChart.dispose(); monthlyChart = null; }
    if (clientChart) { clientChart.dispose(); clientChart = null; }
    if (tagChart) { tagChart.dispose(); tagChart = null; }
  }

  function createMonthlyBar(reports) {
    var container = document.getElementById('chart-monthly');
    if (!container || typeof am5 === 'undefined') return;

    // Aggregate by month
    var counts = {};
    reports.forEach(function (r) {
      if (!r.date) return;
      var parts = r.date.split('-');
      var key = MONTHS[parseInt(parts[1], 10) - 1] + ' ' + parts[0].slice(2);
      counts[key] = (counts[key] || 0) + 1;
    });

    var data = Object.keys(counts).map(function (k) {
      return { month: k, count: counts[k] };
    }).reverse();

    var root = am5.Root.new('chart-monthly');
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5xy.XYChart.new(root, { panX: false, panY: false })
    );

    var xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'month',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 })
      })
    );
    xAxis.data.setAll(data);

    var yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    var series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'count',
        categoryXField: 'month'
      })
    );
    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      fill: am5.color('#11c76f'),
      stroke: am5.color('#11c76f')
    });
    series.data.setAll(data);

    monthlyChart = root;
  }

  function createClientDonut(reports, clients) {
    var container = document.getElementById('chart-client');
    if (!container || typeof am5 === 'undefined') return;

    var counts = {};
    reports.forEach(function (r) {
      var c = r.client || 'outros';
      counts[c] = (counts[c] || 0) + 1;
    });

    var data = Object.keys(counts).map(function (k) {
      return {
        client: clients[k] ? clients[k].name : k,
        count: counts[k],
        color: clients[k] ? clients[k].color : '#6b7280'
      };
    });

    var root = am5.Root.new('chart-client');
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5percent.PieChart.new(root, { innerRadius: am5.percent(50) })
    );

    var series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'count',
        categoryField: 'client'
      })
    );

    series.slices.template.adapters.add('fill', function (fill, target) {
      var dataItem = target.dataItem;
      if (dataItem && dataItem.dataContext && dataItem.dataContext.color) {
        return am5.color(dataItem.dataContext.color);
      }
      return fill;
    });

    series.labels.template.setAll({ fontSize: 12 });
    series.data.setAll(data);

    clientChart = root;
  }

  function createTagBar(reports) {
    var container = document.getElementById('chart-tags');
    if (!container || typeof am5 === 'undefined') return;

    var counts = {};
    reports.forEach(function (r) {
      (r.tags || []).forEach(function (t) {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    var data = Object.keys(counts).map(function (k) {
      return { tag: k, count: counts[k] };
    }).sort(function (a, b) { return b.count - a.count; });

    var root = am5.Root.new('chart-tags');
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5xy.XYChart.new(root, { panX: false, panY: false })
    );

    var yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'tag',
        renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 20 })
      })
    );
    yAxis.data.setAll(data);

    var xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    );

    var series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: 'count',
        categoryYField: 'tag'
      })
    );
    series.columns.template.setAll({
      cornerRadiusBR: 4,
      cornerRadiusTR: 4,
      fill: am5.color('#11c76f'),
      stroke: am5.color('#11c76f'),
      height: am5.percent(60)
    });
    series.data.setAll(data);

    tagChart = root;
  }

  function update(reports, clients) {
    ensureLoaded(function () {
      disposeCharts();
      createMonthlyBar(reports);
      createClientDonut(reports, clients);
      createTagBar(reports);
    });
  }

  function applyTheme(isDark) {
    // amCharts handles theme internally; re-render on theme change
    if (window.IXHub && chartsLoaded) {
      var filtered = window.IXHub.getFilteredReports();
      var clients = window.IXHub.getClients();
      disposeCharts();
      createMonthlyBar(filtered);
      createClientDonut(filtered, clients);
      createTagBar(filtered);
    }
  }

  window.IXCharts = {
    update: update,
    applyTheme: applyTheme
  };
})();
