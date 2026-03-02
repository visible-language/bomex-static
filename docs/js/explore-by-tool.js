(function () {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  var TOOLS = [
    { key: 'timeline', title: 'Timeline' },
    { key: 'connections', title: 'Connections' },
    { key: 'word-bubbles', title: 'Word Bubbles' },
    { key: 'conversation-network', title: 'Conversation Network' },
    { key: 'similar-topic-diagram', title: 'Similar Topic Diagram' },
    { key: 'semantic-map', title: 'Semantic Map' },
    { key: 'stylo-xr', title: 'Stylo XR' }
  ];

  function getCurrentTool() {
    return document.body && document.body.getAttribute('data-tool') || '';
  }

  function setSelected(selectEl, value) {
    if (!selectEl) return;
    for (var i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value === value) {
        selectEl.selectedIndex = i;
        return;
      }
    }
  }

  function ensureOptions(selectEl) {
    if (!selectEl) return;

    while (selectEl.options.length > 1) {
      selectEl.remove(1);
    }

    var optAll = document.createElement('option');
    optAll.value = '__all__';
    optAll.textContent = 'See All';
    selectEl.appendChild(optAll);

    for (var i = 0; i < TOOLS.length; i++) {
      var opt = document.createElement('option');
      opt.value = TOOLS[i].key;
      opt.textContent = TOOLS[i].title;
      selectEl.appendChild(opt);
    }
  }

  function wireSingleOpenAccordions(container) {
    if (!container) return;
    container.addEventListener('toggle', function (event) {
      var target = event.target;
      if (!target || target.tagName !== 'DETAILS' || !target.classList.contains('accordion')) return;
      if (!target.open) return;
      var parent = target.parentElement;
      if (!parent) return;
      var siblings = parent.children;
      for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === target) continue;
        if (sibling.tagName === 'DETAILS' && sibling.classList.contains('accordion') && sibling.open) {
          sibling.open = false;
        }
      }
    }, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var rootPrefix = getRootPrefix();
    var selectEl = document.getElementById('tool-select');
    if (!selectEl) return;

    ensureOptions(selectEl);

    var current = getCurrentTool();
    if (current) setSelected(selectEl, current);

    selectEl.addEventListener('change', function () {
      var v = selectEl.value;
      if (!v) return;
      if (v === '__all__') {
        window.location.href = rootPrefix + 'explore-by-tool/';
        return;
      }
      window.location.href = rootPrefix + 'explore-by-tool/' + v + '.html';
    });

    if (window.WidgetShell && typeof window.WidgetShell.initExploreByToolPage === 'function') {
      window.WidgetShell.initExploreByToolPage();
    }

    wireSingleOpenAccordions(document.querySelector('.tool-widget') || document.body);
  });
})();
