(function () {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setParam(name, value) {
    var url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url.toString());
  }

  function normalizeSlugFromPeopleHref(href) {
    if (!href) return '';
    var cleaned = href.split('#')[0].split('?')[0];
    if (cleaned.endsWith('.html')) cleaned = cleaned.slice(0, -5);
    return cleaned;
  }

  // Mapping from content person slug -> widget speaker IDs.
  // Widgets use a few different conventions.
  var PERSON_WIDGET_MAP = {
    'abinadi-new': { bubbles: 'abinadi', timeline: 'Abinadi', social: 'Abinadi', connections: 'Abinadi', avatar: 'Abinadi' },
    'alma-e': { bubbles: 'alma', timeline: 'Alma', social: 'Alma', connections: 'Alma', avatar: 'Alma' },
    'alma-y-writing': { bubbles: 'alma2', timeline: 'Alma2', social: 'Alma2', connections: 'Alma2', avatar: 'Alma2' },
    'amaleki': { bubbles: 'amaleki', timeline: 'Amaleki', social: 'Amaleki', connections: 'Amaleki', avatar: 'Amaleki' },
    'ammon-m': { bubbles: 'ammon1', timeline: 'Ammon', social: 'Ammon', connections: 'Ammon', avatar: 'Ammon' },
    'ammon-z': { bubbles: 'ammon2', timeline: 'Ammon2', social: 'Ammon2', connections: 'Ammon2', avatar: 'Ammon2' },
    'ammoron': { bubbles: 'ammoron', timeline: 'Ammoron', social: 'Ammoron', connections: 'Ammoron', avatar: 'Ammoron' },
    'benjamin-new': { bubbles: 'benjamin', timeline: 'Benjamin', social: 'Benjamin', connections: 'Benjamin', avatar: 'Benjamin' },
    'brother-jared': { bubbles: 'jared-brother', timeline: 'BrotherJared', social: 'BrotherJared', connections: 'BrotherJared', avatar: 'BrotherJared' },
    'cap-moroni': { bubbles: 'moroni1', timeline: 'CaptainMoroni', social: 'CaptainMoroni', connections: 'CaptainMoroni', avatar: 'CaptainMoroni' },
    'christ-america': { bubbles: 'christ', timeline: 'Christ', social: 'Christ', connections: 'ChristAmerica', avatar: 'ChristAmerica' },
    'enos': { bubbles: 'enos', timeline: 'Enos', social: 'Enos', connections: 'Enos', avatar: 'Enos' },
    'giddianhi-new': { bubbles: 'giddianhi', timeline: 'Giddianhi', social: 'Giddianhi', connections: 'Giddianhi', avatar: 'Giddianhi' },
    'gideon': { bubbles: 'gideon', timeline: 'Gideon', social: 'Gideon', connections: 'Gideon', avatar: 'Gideon' },
    'helaman-a': { bubbles: 'helaman1', timeline: 'Helaman', social: 'Helaman', connections: 'Helaman', avatar: 'Helaman' },
    'helaman-h': { bubbles: 'helaman2', timeline: 'Helaman2', social: 'Helaman2', connections: 'Helaman2', avatar: 'Helaman2' },
    'isaiah-bofm': { bubbles: 'isaiah', timeline: 'Isaiah', social: 'Isaiah', connections: 'Isaiah', avatar: 'Isaiah' },
    'jacob-l': { bubbles: 'jacob', timeline: 'Jacob', social: 'Jacob', connections: 'Jacob', avatar: 'Jacob' },
    'jarom': { bubbles: 'jarom', timeline: 'Jarom', social: 'Jarom', connections: 'Jarom', avatar: 'Jarom' },
    'korihor': { bubbles: 'korihor', timeline: 'Korihor', social: 'Korihor', connections: 'Korihor', avatar: 'Korihor' },
    'lamoni-wife': { avatar: 'WifeLamoni' },
    'lehi': { bubbles: 'lehi', timeline: 'Lehi', social: 'Lehi', connections: 'Lehi', avatar: 'Lehi' },
    'limhi': { bubbles: 'limhi', timeline: 'Limhi', social: 'Limhi', connections: 'Limhi', avatar: 'Limhi' },
    'mormon': { bubbles: 'mormon', timeline: 'Mormon', social: 'Mormon', connections: 'Mormon', avatar: 'Mormon' },
    'moroni': { bubbles: 'moroni2', timeline: 'Moroni', social: 'Moroni', connections: 'Moroni', avatar: 'Moroni' },
    'mosiah': { bubbles: 'mosiah', timeline: 'Mosiah', social: 'Mosiah', connections: 'Mosiah', avatar: 'Mosiah' },
    'nephi-h': { bubbles: 'nephi2', timeline: 'Nephi2', social: 'Nephi2', connections: 'Nephi2', avatar: 'Nephi2' },
    'nephi-l': { bubbles: 'nephi1', timeline: 'Nephi', social: 'Nephi', connections: 'Nephi', avatar: 'Nephi' },
    'pahoran': { bubbles: 'pahoran', timeline: 'Pahoran', social: 'Pahoran', connections: 'Pahoran', avatar: 'Pahoran' },
    'samuel': { bubbles: 'samuel-lamanite', timeline: 'SamuelLamanite', social: 'SamuelLamanite', connections: 'SamuelLamanite', avatar: 'SamuelLamanite' },
    'sariah': { bubbles: 'sariah', timeline: 'Sariah', social: 'Sariah', connections: 'Sariah', avatar: 'Sariah' },
    'zeniff': { bubbles: 'zeniff', timeline: 'Zeniff', social: 'Zeniff', connections: 'Zeniff', avatar: 'Zeniff' },
    'zenos': { bubbles: 'zenos', timeline: 'Zenos', social: 'Zenos', connections: 'Zenos', avatar: 'Zenos' }
  };

  function getWidgetIdsForSlug(slug) {
    return PERSON_WIDGET_MAP[slug] || {};
  }

  function escapeText(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderBio(text) {
    var safe = escapeText(text);
    var paragraphs = safe.split(/\n\s*\n/g).filter(Boolean);
    if (!paragraphs.length) paragraphs = [safe];
    return paragraphs.map(function (p) {
      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function buildWidgetList(rootPrefix, slug, tab) {
    var ids = getWidgetIdsForSlug(slug);

    function withSpeaker(url, speaker) {
      if (!speaker) return url;
      var u = new URL(url, window.location.href);
      u.searchParams.set('speaker', speaker);
      return u.toString();
    }

    var widgetsMessage = [
      {
        key: 'bubbles',
        title: 'Word Bubbles',
        subtitle: 'Uncover key words of this speaker and their impact',
        icon: 'fa-circle-nodes',
        src: withSpeaker(rootPrefix + 'widgets/Widgets/Bubbles/index.html', ids.bubbles)
      },
      {
        key: 'topic',
        title: 'Similar Topic Diagram',
        subtitle: 'Explore how topics cluster together',
        icon: 'fa-diagram-project',
        src: withSpeaker(rootPrefix + 'widgets/Widgets/SpeakersNetwork/index.html', ids.timeline)
      }
    ];

    var widgetsLife = [
      {
        key: 'timeline',
        title: 'Timeline',
        subtitle: 'Explore connections between this speaker and events',
        icon: 'fa-clock',
        src: withSpeaker(rootPrefix + 'widgets/Widgets/Timeline/index.html', ids.timeline)
      },
      {
        key: 'conversation',
        title: 'Conversation Network',
        subtitle: 'Find who this speaker talked to',
        icon: 'fa-share-nodes',
        src: withSpeaker(rootPrefix + 'widgets/Widgets/SocialNetwork/index.html', ids.social)
      },
      {
        key: 'connections',
        title: 'Connections',
        subtitle: 'View social and spiritual connections',
        icon: 'fa-people-group',
        src: withSpeaker(rootPrefix + 'widgets/Widgets/Connections/index.html', ids.connections)
      }
    ];

    var list = tab === 'life' ? widgetsLife : widgetsMessage;

    return list.map(function (w) {
      return (
        '<details class="accordion" data-widget>' +
          '<summary>' +
            '<div class="explore-widget-summary">' +
              '<i class="fa-solid ' + w.icon + '" aria-hidden="true"></i>' +
              '<div class="explore-widget-text">' +
                '<div class="explore-widget-title">' + escapeText(w.title) + '</div>' +
                '<div class="explore-widget-subtitle">' + escapeText(w.subtitle) + '</div>' +
              '</div>' +
            '</div>' +
            '<i class="fas fa-chevron-down" aria-hidden="true"></i>' +
          '</summary>' +
          '<div class="accordion-body">' +
            '<div class="explore-widget-frame" data-src="' + escapeText(w.src) + '"></div>' +
          '</div>' +
        '</details>'
      );
    }).join('');
  }

  function wireAccordions(container) {
    if (!container) return;

    var accordions = container.querySelectorAll('details[data-widget]');
    for (var i = 0; i < accordions.length; i++) {
      (function (detailsEl) {
        detailsEl.addEventListener('toggle', function () {
          if (!detailsEl.open) return;
          var target = detailsEl.querySelector('.explore-widget-frame');
          if (!target) return;
          if (target.querySelector('iframe')) return;

          var src = target.getAttribute('data-src');
          if (!src) return;

          var iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.loading = 'lazy';
          iframe.title = 'Widget';
          iframe.setAttribute('referrerpolicy', 'no-referrer');
          target.appendChild(iframe);
        });
      })(accordions[i]);
    }
  }

  function setActiveTab(tab) {
    var btnMessage = document.getElementById('tab-message');
    var btnLife = document.getElementById('tab-life');
    var isLife = tab === 'life';

    if (btnMessage) btnMessage.setAttribute('aria-selected', String(!isLife));
    if (btnLife) btnLife.setAttribute('aria-selected', String(isLife));

    if (btnMessage) btnMessage.classList.toggle('is-active', !isLife);
    if (btnLife) btnLife.classList.toggle('is-active', isLife);
  }

  function setAvatar(rootPrefix, slug) {
    var img = document.getElementById('person-avatar');
    if (!img) return;

    img.alt = '';

    var contentImg = rootPrefix + 'content/people/' + slug + '/main.jpg';
    var ids = getWidgetIdsForSlug(slug);
    var fallbackKey = ids.avatar || ids.timeline || ids.connections || '';
    var fallbackImg = fallbackKey ? (rootPrefix + 'widgets/Images/' + fallbackKey + '.jpg') : '';

    img.onerror = function () {
      if (fallbackImg && img.src !== fallbackImg) {
        img.src = fallbackImg;
        return;
      }
      img.removeAttribute('src');
      img.style.display = 'none';
    };

    img.style.display = '';
    img.src = contentImg;
  }

  function setSelectedPerson(selectEl, slug) {
    if (!selectEl) return;
    selectEl.value = slug;
  }

  function loadPerson(rootPrefix, slug, tab) {
    var bioEl = document.getElementById('person-bio');
    var listEl = document.getElementById('widget-list');
    if (!bioEl || !listEl) return;

    setAvatar(rootPrefix, slug);

    var detailsUrl = rootPrefix + 'content/people/' + slug + '/person-details.json';
    fetch(detailsUrl)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        bioEl.innerHTML = renderBio(data && data.description);
      })
      .catch(function () {
        bioEl.innerHTML = '<p>Biography not available.</p>';
      })
      .finally(function () {
        listEl.innerHTML = buildWidgetList(rootPrefix, slug, tab);
        wireAccordions(listEl);
      });
  }

  function fetchPeopleList(rootPrefix) {
    // Use the generated People index as a static, runtime-friendly list.
    var url = rootPrefix + 'people/index.html';
    return fetch(url)
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
    var rootPrefix = getRootPrefix();
    var selectEl = document.getElementById('person-select');
    var tabMessage = document.getElementById('tab-message');
    var tabLife = document.getElementById('tab-life');

    var tab = getParam('tab') === 'life' ? 'life' : 'message';
    setActiveTab(tab);

    fetchPeopleList(rootPrefix)
      .then(function (people) {
        if (!selectEl) return { people: people, slug: '' };

        selectEl.innerHTML = '';
        for (var i = 0; i < people.length; i++) {
          var opt = document.createElement('option');
          opt.value = people[i].slug;
          opt.textContent = people[i].name;
          selectEl.appendChild(opt);
        }

        // Use `person` to avoid collisions with host tools that add `id=` query params.
        var requested = getParam('person') || getParam('id');
        var defaultSlug = (requested && people.some(function (p) { return p.slug === requested; }))
          ? requested
          : '';

        if (!defaultSlug) {
          // Prefer Nephi (Son of Lehi) to match the mock.
          var hasNephi = people.some(function (p) { return p.slug === 'nephi-l'; });
          defaultSlug = hasNephi ? 'nephi-l' : (people[0] ? people[0].slug : '');
        }

        if (defaultSlug) {
          setParam('person', defaultSlug);
          setParam('tab', tab);
          setSelectedPerson(selectEl, defaultSlug);
          loadPerson(rootPrefix, defaultSlug, tab);
        }

        return { people: people, slug: defaultSlug };
      })
      .catch(function () {
        if (selectEl) selectEl.innerHTML = '<option value="">No people found</option>';
      });

    if (selectEl) {
      selectEl.addEventListener('change', function () {
        var slug = selectEl.value;
        if (!slug) return;
        setParam('person', slug);
        loadPerson(rootPrefix, slug, getParam('tab') === 'life' ? 'life' : 'message');
      });
    }

    if (tabMessage) {
      tabMessage.addEventListener('click', function () {
        setParam('tab', 'message');
        setActiveTab('message');
        var slug = getParam('person') || (selectEl ? selectEl.value : '');
        if (slug) loadPerson(rootPrefix, slug, 'message');
      });
    }

    if (tabLife) {
      tabLife.addEventListener('click', function () {
        setParam('tab', 'life');
        setActiveTab('life');
        var slug = getParam('person') || (selectEl ? selectEl.value : '');
        if (slug) loadPerson(rootPrefix, slug, 'life');
      });
    }
  });
})();
