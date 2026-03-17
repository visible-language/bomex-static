(function () {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  var TOOL_GROUPS = [
    {
      label: 'Main Tools',
      tools: [
        { key: 'timeline', title: 'Timeline' },
        { key: 'connections', title: 'Connections' },
        { key: 'words', title: 'Words' }
      ]
    },
    {
      label: 'Advanced Tools',
      tools: [
        { key: '__main__', title: '← Back to main tools' },
        { key: 'conversation-network', title: 'Conversation Network' },
        { key: 'similar-topic-diagram', title: 'Similar Topic Diagram' },
        { key: 'semantic-map', title: 'Semantic Map' },
        { key: 'stylo-xr', title: 'Stylo XR' }
      ]
    }
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

    for (var g = 0; g < TOOL_GROUPS.length; g++) {
      var group = TOOL_GROUPS[g];
      var optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      for (var i = 0; i < group.tools.length; i++) {
        var opt = document.createElement('option');
        opt.value = group.tools[i].key;
        opt.textContent = group.tools[i].title;
        optgroup.appendChild(opt);
      }
      selectEl.appendChild(optgroup);
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

    if (window.WidgetShell && typeof window.WidgetShell.initExploreByToolPage === 'function') {
      window.WidgetShell.initExploreByToolPage();
    }

    wireSingleOpenAccordions(document.querySelector('.tool-widget') || document.body);

    var selectEl = document.getElementById('tool-select');
    if (!selectEl) return;

    ensureOptions(selectEl);

    var current = getCurrentTool();
    if (current) setSelected(selectEl, current);

    selectEl.addEventListener('change', function () {
      var v = selectEl.value;
      if (!v) return;
      if (v === '__all__' || v === '__main__') {
        window.location.href = rootPrefix + 'explore-by-tool/';
        return;
      }
      window.location.href = rootPrefix + 'explore-by-tool/' + v + '.html';
    });
  });
})();
