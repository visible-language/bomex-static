;(function () {
  var ns = window.BubblesWidget || (window.BubblesWidget = {});

  var W_DEFAULTS = {
    currentDataSet: 'nephi1',
    currentChartType: 'content',
    currentChartData: {},
    currentSpeakerData: {},
    type: 'noun',
    uniqueFilter: 'All',
    sortCol: 'size',
    sortDir: -1,
    _initComplete: false,
    _initRoot: null
  };

  var wState = Object.assign({}, W_DEFAULTS);

  function getOptions() {
    return window.BubblesWidgetOptions || {};
  }

  function getSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  function classifyPos(posName) {
    var val = String(posName || '').toLowerCase();
    return ['noun', 'verb', 'adjective', 'adverb'].indexOf(val) >= 0 ? 'noun' : 'verb';
  }

  function loadData(speaker) {
    wState.currentDataSet = speaker;
    wState.currentChartData = getChartData(speaker, wState.currentChartType);
    wState.currentSpeakerData = getSpeakerDataJSON(speaker);
  }

  function getFilteredRows() {
    var children = (wState.currentChartData && wState.currentChartData.children) || [];
    var uniqueWords = wState.currentSpeakerData && wState.currentSpeakerData.uniqueWords;
    return children.filter(function (item) {
      if (wState.type !== 'all' && classifyPos(item.partOfSpeech) !== wState.type) return false;
      if (wState.uniqueFilter === 'Unique' && (!uniqueWords || uniqueWords.indexOf(item.name) < 0)) return false;
      return true;
    });
  }

  function getSortedRows() {
    var rows = getFilteredRows();
    var col = wState.sortCol;
    var dir = wState.sortDir;
    return rows.slice().sort(function (a, b) {
      var av = col === 'size' ? (a.size || 0) : String(a.name || '').toLowerCase();
      var bv = col === 'size' ? (b.size || 0) : String(b.name || '').toLowerCase();
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return 0;
    });
  }

  function renderTable() {
    var container = document.getElementById('words-table-container');
    if (!container) return;

    var rows = getSortedRows();
    var maxCount = 1;
    for (var i = 0; i < rows.length; i++) {
      if ((rows[i].size || 0) > maxCount) maxCount = rows[i].size;
    }

    var table = document.createElement('table');
    table.className = 'words-table';

    // Header
    var thead = document.createElement('thead');
    var hrow = document.createElement('tr');
    var cols = [
      { key: 'name', label: 'Word' },
      { key: 'size', label: 'Count' },
      { key: 'example', label: 'Example' }
    ];
    cols.forEach(function (col) {
      var th = document.createElement('th');
      th.dataset.col = col.key;
      th.textContent = col.label;
      if (col.key !== 'example') {
        th.classList.add('sortable');
        var arrow = document.createElement('span');
        arrow.className = 'sort-arrow';
        if (wState.sortCol === col.key) {
          th.classList.add('sorted');
          arrow.textContent = wState.sortDir === -1 ? ' \u2193' : ' \u2191';
        } else {
          arrow.textContent = ' \u21c5';
        }
        th.appendChild(arrow);
        (function (key) {
          th.addEventListener('click', function () {
            if (wState.sortCol === key) {
              wState.sortDir = -wState.sortDir;
            } else {
              wState.sortCol = key;
              wState.sortDir = key === 'size' ? -1 : 1;
            }
            renderTable();
          });
        })(col.key);
      }
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    rows.forEach(function (item) {
      var tr = document.createElement('tr');

      // Word/Phrase
      var tdName = document.createElement('td');
      tdName.className = 'wt-name';
      tdName.textContent = item.name || '';
      tr.appendChild(tdName);

      // Count — bar chart background via CSS variable
      var tdCount = document.createElement('td');
      tdCount.className = 'wt-count';
      var pct = Math.round(((item.size || 0) / maxCount) * 100);
      tdCount.style.setProperty('--bar-pct', pct + '%');
      tdCount.textContent = item.size != null ? String(item.size) : '';
      tr.appendChild(tdCount);

      // Example — truncated, click opens modal
      var tdEx = document.createElement('td');
      tdEx.className = 'wt-example';
      var text = item.sourceText || '';
      tdEx.textContent = text;
      if (text) {
        tdEx.setAttribute('role', 'button');
        tdEx.setAttribute('tabindex', '0');
        tdEx.title = 'Click to read full example';
        (function (capturedItem) {
          tdEx.addEventListener('click', function () { openModal(capturedItem); });
          tdEx.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(capturedItem); }
          });
        })(item);
      }
      tr.appendChild(tdEx);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }

  function openModal(item) {
    var container = document.getElementById('words-table-container');
    var scopeRoot = (container && container.closest('.vl-bubbles-root')) || document.body;
    var dlg = scopeRoot.querySelector('#wt-modal');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'wt-modal';
      dlg.innerHTML =
        '<div class="wt-modal-content">' +
          '<button class="wt-modal-close" aria-label="Close">&times;</button>' +
          '<div class="wt-modal-word"></div>' +
          '<div class="wt-modal-text"></div>' +
          '<div class="wt-modal-cite"></div>' +
        '</div>';
      dlg.querySelector('.wt-modal-close').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      scopeRoot.appendChild(dlg);
    }

    dlg.querySelector('.wt-modal-word').textContent = item.name || '';

    var textEl = dlg.querySelector('.wt-modal-text');
    textEl.innerHTML = '';
    var sourceText = item.sourceText || '';
    var word = item.name || '';
    if (word && sourceText) {
      var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('(' + escaped + ')', 'gi');
      var parts = sourceText.split(re);
      for (var pi = 0; pi < parts.length; pi++) {
        if (pi % 2 === 1) {
          var strong = document.createElement('strong');
          strong.textContent = parts[pi];
          textEl.appendChild(strong);
        } else if (parts[pi]) {
          textEl.appendChild(document.createTextNode(parts[pi]));
        }
      }
    } else {
      textEl.textContent = sourceText;
    }

    dlg.querySelector('.wt-modal-cite').textContent = item.sourceReference ? '\u2014 ' + item.sourceReference : '';
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
  }

  function updateStats() {
    var sd = wState.currentSpeakerData || {};
    var s1 = document.getElementById('stat-1');
    var s2 = document.getElementById('stat-2');
    var s3 = document.getElementById('stat-3');
    if (s1) s1.textContent = String(sd.totalCount || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (s2) {
      var pct = (sd.totalCount || 0) / 273275 * 100;
      s2.textContent = pct < 1 ? '< 1%' : pct.toFixed(1) + '%';
    }
    if (s3) s3.textContent = (sd.rank || '') + ' of 83';
  }

  function fillDropDown() {
    var dropdown = document.getElementById('dropdown');
    if (!dropdown) return;
    var idNames = ns.idNames || [];
    var idNameToDisplayName = ns.idNameToDisplayName || function (id) { return id; };
    while (dropdown.options.length > 1) dropdown.remove(1);
    for (var i = 0; i < idNames.length; i++) {
      var opt = document.createElement('option');
      opt.value = idNames[i];
      opt.textContent = idNameToDisplayName(idNames[i]);
      dropdown.appendChild(opt);
    }
    dropdown.value = wState.currentDataSet;
  }

  function applyControlVisibility() {
    var options = getOptions();
    var controls = document.querySelector('.controls');
    var dropdown = document.getElementById('dropdown');
    if (dropdown) dropdown.disabled = options.allowSpeakerSelect === false;
    if (controls) controls.style.display = options.allowSpeakerSelect === false ? 'none' : '';
  }

  function updateSpeakerImage(speaker) {
    var img = document.getElementById('speaker-image');
    if (!img) return;
    var assetBase = window.BubblesWidgetAssetBase || '.';
    img.src = new URL(assetBase + '/images/' + speaker + '.jpg', window.location.href).toString();
  }

  function loadAndRender(speaker) {
    var dropdown = document.getElementById('dropdown');
    if (dropdown) dropdown.value = speaker;
    updateSpeakerImage(speaker);
    loadData(speaker);
    updateStats();
    renderTable();
  }

  function initializeWordsWidget() {
    var container = document.getElementById('words-table-container');
    if (!container) return;
    var currentRoot = container.closest('.vl-bubbles-root') || document.body;
    if (wState._initComplete && wState._initRoot === currentRoot) return;

    wState = Object.assign({}, W_DEFAULTS);
    wState._initComplete = true;
    wState._initRoot = currentRoot;

    fillDropDown();
    applyControlVisibility();

    var dropdown = document.getElementById('dropdown');
    if (dropdown) {
      dropdown.addEventListener('change', function () { loadAndRender(this.value); });
    }

    var uniqueButton = document.getElementById('unique-button');
    if (uniqueButton) {
      uniqueButton.addEventListener('click', function (e) {
        e.preventDefault();
        wState.uniqueFilter = wState.uniqueFilter === 'All' ? 'Unique' : 'All';
        uniqueButton.textContent = 'Unique Words: ' + (wState.uniqueFilter === 'Unique' ? 'On' : 'Off');
        renderTable();
      });
    }

    var typeRadios = document.querySelectorAll('input[name="typeRadios"]');
    for (var i = 0; i < typeRadios.length; i++) {
      (function (radio) {
        radio.addEventListener('change', function () {
          wState.type = this.value;
          renderTable();
        });
      })(typeRadios[i]);
    }

    // Determine initial speaker
    var opts = getOptions();
    var params = getSearchParams();
    var idNames = ns.idNames || [];
    var speaker = String(opts.speaker || params.get('speaker') || '');
    speaker = speaker.charAt(0).toLowerCase() + speaker.slice(1);
    if (!speaker || idNames.indexOf(speaker) < 0) speaker = 'nephi1';
    wState.currentDataSet = speaker;

    loadAndRender(speaker);
  }

  function destroyWordsWidget() {
    wState = Object.assign({}, W_DEFAULTS);
    var container = document.getElementById('words-table-container');
    if (container) container.innerHTML = '';
    var dlg = document.getElementById('wt-modal');
    if (dlg) dlg.remove();
  }

  // Replace the BubblesWidgetApi so the mount.js infrastructure calls our init
  window.BubblesWidgetApi = {
    init: initializeWordsWidget,
    destroy: destroyWordsWidget,
    resize: function () {},
    setOptions: function (options) {
      window.BubblesWidgetOptions = Object.assign({}, window.BubblesWidgetOptions || {}, options || {});
      applyControlVisibility();
    }
  };

  if (document.readyState === 'complete') {
    initializeWordsWidget();
  }
})();
