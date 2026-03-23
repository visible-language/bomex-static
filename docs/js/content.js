(function () {
  function initAutoOpenSingleAccordion() {
    var single = document.querySelector('details.accordion[data-auto-open="true"]');
    if (single) {
      single.open = true;
    }
  }

  function initDetailIndexSidebar() {
    var layout = document.querySelector('.content-detail-layout[data-index-source]');
    if (!layout) return;

    var sidebar = layout.querySelector('.content-index-sidebar');
    if (!sidebar) return;

    var source = layout.getAttribute('data-index-source') || 'index.html';
    var title = layout.getAttribute('data-index-title') || '';

    fetch(source)
      .then(function (response) {
        if (!response.ok) throw new Error('Unable to load section index');
        return response.text();
      })
      .then(function (sourceHtml) {
        var doc = new DOMParser().parseFromString(sourceHtml, 'text/html');
        var rows = doc.querySelectorAll('.person-card, .list-row');
        if (!rows.length) return;

        var current = (window.location.pathname.split('/').pop() || '')
          .split('?')[0]
          .split('#')[0];
        var frag = document.createDocumentFragment();

        if (title) {
          var heading = document.createElement('div');
          heading.className = 'content-index-sidebar-title';
          heading.textContent = title;
          frag.appendChild(heading);
        }

        var list = document.createElement('div');
        list.className = 'content-index-list';

        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var href = (row.getAttribute('href') || '').trim();
          if (!href) continue;

          var cleanHref = href.split('#')[0].split('?')[0];
          var label = '';

          if (row.classList.contains('person-card')) {
            var nameEl = row.querySelector('.person-name');
            label = nameEl ? nameEl.textContent.trim() : '';
          } else {
            var spanEl = row.querySelector('span');
            label = spanEl ? spanEl.textContent.trim() : row.textContent.trim();
          }

          if (!label) continue;

          var link = document.createElement('a');
          link.className = 'content-index-link';
          link.href = href;
          link.textContent = label;

          if (cleanHref === current) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
          }

          list.appendChild(link);
        }

        if (!list.children.length) return;

        frag.appendChild(list);
        sidebar.innerHTML = '';
        sidebar.appendChild(frag);
      })
      .catch(function () {
        sidebar.innerHTML = '';
      });
  }

  function initPersonWidgetAccordions() {
    var container = document.querySelector('section.page-content') || document.body;
    var accordions = container.querySelectorAll('details.accordion[data-widget]');
    if (!accordions.length) return;

    for (var i = 0; i < accordions.length; i++) {
      (function (det) {
        det.addEventListener('toggle', function () {
          if (!det.open) return;

          var parent = det.parentElement;
          if (parent) {
            var siblings = parent.querySelectorAll('details.accordion[data-widget]');
            for (var j = 0; j < siblings.length; j++) {
              if (siblings[j] !== det && siblings[j].open) siblings[j].open = false;
            }
          }

          var frame = det.querySelector('.explore-widget-frame');
          if (!frame || frame.querySelector('.widget-shell')) return;

          var src = frame.getAttribute('data-src');
          if (!src) return;

          if (window.WidgetShell && typeof window.WidgetShell.renderFrame === 'function') {
            window.WidgetShell.renderFrame(frame, {
              title: frame.getAttribute('data-widget-title') || '',
              src: src,
              widgetKey: frame.getAttribute('data-widget-key') || '',
              speaker: frame.getAttribute('data-speaker') || '',
              context: 'person',
              allowSpeakerSelect: false,
            });
          }
        });
      })(accordions[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAutoOpenSingleAccordion();
    initDetailIndexSidebar();
    initPersonWidgetAccordions();
  });
})();
