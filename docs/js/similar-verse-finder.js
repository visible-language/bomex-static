(function () {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function escapeText(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function normalize(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/;/g, ':')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s\s+/g, ' ');
  }

  function titleCaseBookKey(bookKey) {
    return String(bookKey || '')
      .split(' ')
      .map(function (w) {
        if (!w) return w;
        if (/^\d+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  function getBooks() {
    return (window.BOM_STRUCTURE || []).map(function (b) {
      return {
        key: b.key,
        name: b.name,
        versesByChapter: b.versesByChapter
      };
    });
  }

  function findBookByPrefix(normalizedInput) {
    var books = getBooks();
    // Match longest names first (e.g., words of mormon before mormon)
    books.sort(function (a, b) { return b.key.length - a.key.length; });
    for (var i = 0; i < books.length; i++) {
      if (normalizedInput === books[i].key) return { book: books[i], rest: '' };
      if (normalizedInput.startsWith(books[i].key + ' ')) {
        return { book: books[i], rest: normalizedInput.slice(books[i].key.length + 1) };
      }
    }
    return null;
  }

  function parseReference(raw) {
    var s = normalize(raw);
    if (!s) return { };

    var match = findBookByPrefix(s);
    if (!match) return { raw: s };

    var rest = match.rest.trim();
    if (!rest) return { bookKey: match.book.key };

    var m1 = rest.match(/^(\d+)$/);
    if (m1) return { bookKey: match.book.key, chapter: parseInt(m1[1], 10) };

    var m2 = rest.match(/^(\d+):(\d+)$/);
    if (m2) {
      return {
        bookKey: match.book.key,
        chapter: parseInt(m2[1], 10),
        verse: parseInt(m2[2], 10)
      };
    }

    return { bookKey: match.book.key, raw: s };
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setQueryParam(name, value) {
    var url = new URL(window.location.href);
    if (!value) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState({}, '', url.toString());
  }

  function prettyRef(state) {
    if (!state || !state.bookKey || !state.chapter || !state.verse) return '';
    return titleCaseBookKey(state.bookKey) + ' ' + state.chapter + ':' + state.verse;
  }

  function clampState(state) {
    if (!state || !state.bookKey) return {};

    var books = getBooks();
    var book = null;
    for (var i = 0; i < books.length; i++) {
      if (books[i].key === state.bookKey) book = books[i];
    }
    if (!book) return {};

    var maxCh = book.versesByChapter.length;
    var chapter = state.chapter;
    var verse = state.verse;

    if (chapter != null) {
      if (chapter < 1) chapter = 1;
      if (chapter > maxCh) chapter = maxCh;
    }

    if (chapter != null && verse != null) {
      var maxV = book.versesByChapter[chapter - 1] || 0;
      if (verse < 1) verse = 1;
      if (verse > maxV) verse = maxV;
    }

    var out = { bookKey: book.key };
    if (chapter != null) out.chapter = chapter;
    if (verse != null) out.verse = verse;
    return out;
  }

  function renderBooks(container, rootPrefix, onPick) {
    var books = getBooks();
    var chevronSrc = rootPrefix + 'img/chevron-right.svg';
    var rows = books.map(function (b) {
      return (
        '<button type="button" class="list-row svf-row" data-book="' + escapeText(b.key) + '">' +
          '<span>' + escapeText(b.name) + '</span>' +
          '<img class="icon" src="' + escapeText(chevronSrc) + '" alt="" aria-hidden="true">' +
        '</button>'
      );
    }).join('');

    container.innerHTML = '<h2 class="svf-heading">Search or Select a Verse</h2>' +
      '<div class="list">' + rows + '</div>';

    var buttons = container.querySelectorAll('button[data-book]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        onPick({ bookKey: this.getAttribute('data-book') });
      });
    }
  }

  function renderGrid(container, title, count, active, onPick) {
    var tiles = [];
    for (var i = 1; i <= count; i++) {
      var isActive = (active === i);
      tiles.push(
        '<button type="button" class="svf-tile' + (isActive ? ' is-active' : '') + '" data-n="' + i + '">' + i + '</button>'
      );
    }

    container.innerHTML = '<h2 class="svf-heading">' + escapeText(title) + '</h2>' +
      '<div class="svf-grid">' + tiles.join('') + '</div>';

    var buttons = container.querySelectorAll('button[data-n]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function () {
        onPick(parseInt(this.getAttribute('data-n'), 10));
      });
    }
  }

  function renderWidget(container, rootPrefix, reference) {
    if (typeof container.__svfCleanup === 'function') {
      container.__svfCleanup();
      container.__svfCleanup = null;
    }

    var registry = window.WidgetMountRegistry || {};
    var entry = registry['similar-verse'];
    if (entry && typeof entry.mount === 'function') {
      container.innerHTML = '<div class="svf-widget"><div class="svf-widget-host"></div></div>';
      var host = container.querySelector('.svf-widget-host');
      if (host) {
        var mounted = entry.mount(host, { reference: reference });
        container.__svfCleanup = function () {
          if (mounted && typeof mounted.destroy === 'function') {
            mounted.destroy();
          }
        };
        return;
      }
    }

    var src = rootPrefix + 'widgets/Widgets/SimilarVerse/index.html?reference=' + encodeURIComponent(reference);
    container.innerHTML =
      '<div class="svf-widget">' +
        '<iframe class="svf-iframe" title="Similar Verse Finder" loading="lazy" referrerpolicy="no-referrer" src="' + escapeText(src) + '"></iframe>' +
      '</div>';
    container.__svfCleanup = null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var rootPrefix = getRootPrefix();
    var panelEl = document.getElementById('svf-panel');
    if (!panelEl) return;

    var initialRef = getQueryParam('reference') || '';
    renderWidget(panelEl, rootPrefix, initialRef);
  });
})();
