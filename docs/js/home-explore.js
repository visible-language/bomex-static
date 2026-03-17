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
    var spotlightLink = document.getElementById('spotlight-link');
    if (!selectEl && !spotlightLink) return;

    fetchPeopleList()
      .then(function (people) {
        if (selectEl) {
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
        }

        if (!spotlightLink || !people.length) return;

        var dayIndex = Math.floor(Date.now() / 86400000);
        var person = people[dayIndex % people.length];
        spotlightLink.setAttribute('href', 'people/' + person.slug + '.html');
        spotlightLink.textContent = 'Meet ' + person.name + ' ';

        var icon = document.createElement('img');
        icon.className = 'icon';
        icon.src = './img/chevron-right.svg';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        spotlightLink.appendChild(icon);
      })
      .catch(function () {
        // Leave the default option if fetch fails.
      });

    if (selectEl) {
      selectEl.addEventListener('change', function () {
        var slug = selectEl.value;
        if (!slug) return;
        window.location.href = 'explore-by-person/?person=' + encodeURIComponent(slug) + '&tab=message';
      });
    }
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
    { key: 'words', title: 'Words' },
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
