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

  function renderBooks(container, onPick) {
    var books = getBooks();
    var rows = books.map(function (b) {
      return (
        '<button type="button" class="list-row svf-row" data-book="' + escapeText(b.key) + '">' +
          '<span>' + escapeText(b.name) + '</span>' +
          '<i class="fas fa-chevron-right" aria-hidden="true"></i>' +
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
    var src = rootPrefix + 'widgets/Widgets/SimilarVerse/index.html?reference=' + encodeURIComponent(reference);
    container.innerHTML =
      '<div class="svf-widget">' +
        '<iframe class="svf-iframe" title="Similar Verse Finder" loading="lazy" referrerpolicy="no-referrer" src="' + escapeText(src) + '"></iframe>' +
      '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var rootPrefix = getRootPrefix();
    var inputEl = document.getElementById('svf-input');
    var submitEl = document.getElementById('svf-submit');
    var panelEl = document.getElementById('svf-panel');
    if (!inputEl || !submitEl || !panelEl) return;

    var initialRef = getQueryParam('reference');
    if (initialRef) inputEl.value = initialRef;

    var state = clampState(parseReference(inputEl.value));

    function setState(next) {
      state = clampState(next);

      if (!state.bookKey) {
        inputEl.value = '';
        setQueryParam('reference', '');
        renderBooks(panelEl, function (s) {
          inputEl.value = titleCaseBookKey(s.bookKey);
          setState(s);
        });
        return;
      }

      var bookLabel = titleCaseBookKey(state.bookKey);

      if (state.bookKey && state.chapter && state.verse) {
        var ref = prettyRef(state);
        inputEl.value = ref;
        setQueryParam('reference', ref);
        renderWidget(panelEl, rootPrefix, ref);
        return;
      }

      var books = getBooks();
      var book = null;
      for (var i = 0; i < books.length; i++) {
        if (books[i].key === state.bookKey) book = books[i];
      }
      if (!book) {
        setState({});
        return;
      }

      if (state.bookKey && state.chapter) {
        inputEl.value = bookLabel + ' ' + state.chapter;
        setQueryParam('reference', '');
        var verseCount = book.versesByChapter[state.chapter - 1] || 0;
        renderGrid(panelEl, 'Verses', verseCount, state.verse, function (n) {
          setState({ bookKey: state.bookKey, chapter: state.chapter, verse: n });
        });
        return;
      }

      inputEl.value = bookLabel;
      setQueryParam('reference', '');
      renderGrid(panelEl, 'Chapters', book.versesByChapter.length, state.chapter, function (n) {
        setState({ bookKey: state.bookKey, chapter: n });
      });
    }

    function submit() {
      var parsed = parseReference(inputEl.value);
      if (parsed && parsed.bookKey && parsed.chapter && parsed.verse) {
        setState(parsed);
        return;
      }

      // If user typed only book or book+chapter, use menus.
      if (parsed && parsed.bookKey && parsed.chapter && !parsed.verse) {
        setState(parsed);
        return;
      }
      if (parsed && parsed.bookKey && !parsed.chapter) {
        setState(parsed);
        return;
      }

      // Otherwise: reset to books.
      setState({});
    }

    submitEl.addEventListener('click', submit);
    inputEl.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });

    inputEl.addEventListener('input', function () {
      if (!inputEl.value.trim()) {
        setState({});
      }
    });

    // First render
    if (state && state.bookKey) setState(state);
    else setState({});
  });
})();
