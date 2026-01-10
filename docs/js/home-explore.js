(function () {
  function normalizeSlugFromPeopleHref(href) {
    if (!href) return '';
    var cleaned = href.split('#')[0].split('?')[0];
    if (cleaned.endsWith('.html')) cleaned = cleaned.slice(0, -5);
    return cleaned;
  }

  function fetchPeopleList() {
    return fetch('people/index.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var cards = doc.querySelectorAll('.person-card');
        var people = [];

        for (var i = 0; i < cards.length; i++) {
          var href = cards[i].getAttribute('href');
          var slug = normalizeSlugFromPeopleHref(href);
          var nameEl = cards[i].querySelector('.person-name');
          var name = nameEl ? nameEl.textContent.trim() : slug;
          if (slug) people.push({ slug: slug, name: name });
        }

        return people;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var selectEl = document.getElementById('home-person-select');
    if (!selectEl) return;

    fetchPeopleList()
      .then(function (people) {
        // Preserve the first option ("Select a Name")
        while (selectEl.options.length > 1) {
          selectEl.remove(1);
        }

        for (var i = 0; i < people.length; i++) {
          var opt = document.createElement('option');
          opt.value = people[i].slug;
          opt.textContent = people[i].name;
          selectEl.appendChild(opt);
        }
      })
      .catch(function () {
        // Leave the default option if fetch fails.
      });

    selectEl.addEventListener('change', function () {
      var slug = selectEl.value;
      if (!slug) return;
      window.location.href = 'explore-by-person/?person=' + encodeURIComponent(slug) + '&tab=message';
    });
  });
})();

(function () {
  function go() {
    var input = document.getElementById('home-similar-verse');
    if (!input) return;
    var ref = String(input.value || '').trim();
    var url = 'similar-verse-finder/';
    if (ref) url += '?reference=' + encodeURIComponent(ref);
    window.location.href = url;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('home-similar-verse');
    var btn = document.getElementById('home-similar-verse-submit');
    if (!input || !btn) return;

    btn.addEventListener('click', go);
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        go();
      }
    });
  });
})();

(function () {
  var TOOLS = [
    { key: 'timeline', title: 'Timeline' },
    { key: 'connections', title: 'Connections' },
    { key: 'word-bubbles', title: 'Word Bubbles' },
    { key: 'conversation-network', title: 'Conversation Network' },
    { key: 'similar-topic-diagram', title: 'Similar Topic Diagram' },
    { key: 'semantic-map', title: 'Semantic Map' },
    { key: 'stylo-xr', title: 'Stylo XR' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var selectEl = document.getElementById('home-tool-select');
    if (!selectEl) return;

    // Preserve the first option ("Select a Tool")
    while (selectEl.options.length > 1) {
      selectEl.remove(1);
    }

    var allOpt = document.createElement('option');
    allOpt.value = '__all__';
    allOpt.textContent = 'See All';
    selectEl.appendChild(allOpt);

    for (var i = 0; i < TOOLS.length; i++) {
      var opt = document.createElement('option');
      opt.value = TOOLS[i].key;
      opt.textContent = TOOLS[i].title;
      selectEl.appendChild(opt);
    }

    selectEl.addEventListener('change', function () {
      var v = selectEl.value;
      if (!v) return;
      if (v === '__all__') {
        window.location.href = 'explore-by-tool/';
        return;
      }
      window.location.href = 'explore-by-tool/' + v + '.html';
    });
  });
})();
