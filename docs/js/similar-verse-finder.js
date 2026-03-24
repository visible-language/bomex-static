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

  function findBookByKey(bookKey) {
    var books = getBooks();
    for (var i = 0; i < books.length; i++) {
      if (books[i].key === bookKey) return books[i];
    }
    return null;
  }

  function renderResultsVerseSidebar(state, navLevel, handlers) {
    var sidebarEl = document.getElementById('svf-verse-sidebar');
    var listEl = document.getElementById('svf-verse-list');
    var rootCrumbEl = document.getElementById('svf-crumb-root');
    var bookCrumbEl = document.getElementById('svf-crumb-book');
    var chapterCrumbEl = document.getElementById('svf-crumb-chapter');

    if (!sidebarEl || !listEl || !rootCrumbEl || !bookCrumbEl || !chapterCrumbEl) return;
    if (!state || !state.bookKey || !state.chapter) {
      sidebarEl.style.display = 'none';
      return;
    }

    var book = findBookByKey(state.bookKey);
    if (!book) {
      sidebarEl.style.display = 'none';
      return;
    }

    sidebarEl.style.removeProperty('display');
  var bookLabel = titleCaseBookKey(state.bookKey);
    rootCrumbEl.textContent = 'Book of Mormon';
  bookCrumbEl.textContent = bookLabel;
    chapterCrumbEl.textContent = 'Chap. ' + state.chapter;

  var showBook = navLevel !== 'books';
  var showChapter = navLevel === 'verses';
  bookCrumbEl.classList.toggle('is-hidden', !showBook);
  chapterCrumbEl.classList.toggle('is-hidden', !showChapter);

    var rootIsCurrent = !showBook;
    var bookIsCurrent = showBook && !showChapter;
    var chapterIsCurrent = showChapter;

    rootCrumbEl.classList.toggle('is-current', rootIsCurrent);
    bookCrumbEl.classList.toggle('is-current', bookIsCurrent);
    chapterCrumbEl.classList.toggle('is-current', chapterIsCurrent);

    rootCrumbEl.onclick = function (e) {
      e.preventDefault();
      if (rootIsCurrent) return;
      handlers.onChooseBooks();
    };
    bookCrumbEl.onclick = function (e) {
      e.preventDefault();
      if (bookIsCurrent) return;
      handlers.onChooseChapters();
    };
    chapterCrumbEl.onclick = function (e) {
      e.preventDefault();
      if (chapterIsCurrent) return;
      handlers.onChooseChapters();
    };

    var items = [];
    var i;
    if (navLevel === 'books') {
      var books = getBooks();
      for (i = 0; i < books.length; i++) {
        var bookItemLabel = titleCaseBookKey(books[i].key);
        var bookActiveClass = books[i].key === state.bookKey ? ' is-active' : '';
        items.push(
          '<button type="button" class="svf-verse-item' + bookActiveClass + '" data-book="' + escapeText(books[i].key) + '">' +
            escapeText(bookItemLabel) +
          '</button>'
        );
      }

      listEl.innerHTML = items.join('');
      var bookButtons = listEl.querySelectorAll('button[data-book]');
      for (i = 0; i < bookButtons.length; i++) {
        bookButtons[i].addEventListener('click', function () {
          handlers.onSelectBook(this.getAttribute('data-book'));
        });
      }
      return;
    }

    if (navLevel === 'chapters') {
      var chapterCount = book.versesByChapter.length;
      for (i = 1; i <= chapterCount; i++) {
        var chapterActiveClass = i === state.chapter ? ' is-active' : '';
        items.push(
          '<button type="button" class="svf-verse-item' + chapterActiveClass + '" data-chapter="' + i + '">Chapter ' + i + '</button>'
        );
      }

      listEl.innerHTML = items.join('');
      var chapterButtons = listEl.querySelectorAll('button[data-chapter]');
      for (i = 0; i < chapterButtons.length; i++) {
        chapterButtons[i].addEventListener('click', function () {
          handlers.onSelectChapter(parseInt(this.getAttribute('data-chapter'), 10));
        });
      }
      return;
    }

    var verseCount = book.versesByChapter[state.chapter - 1] || 0;
    for (i = 1; i <= verseCount; i++) {
      var activeClass = (i === state.verse) ? ' is-active' : '';
      items.push(
        '<button type="button" class="svf-verse-item' + activeClass + '" data-verse="' + i + '">Verse ' + i + '</button>'
      );
    }

    listEl.innerHTML = items.join('');
    var verseButtons = listEl.querySelectorAll('button[data-verse]');
    for (i = 0; i < verseButtons.length; i++) {
      verseButtons[i].addEventListener('click', function () {
        var verse = parseInt(this.getAttribute('data-verse'), 10);
        if (!verse || verse === state.verse) return;
        handlers.onSelectVerse(verse);
      });
    }
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
    container.innerHTML = '<div class="svf-widget"><p class="widget-shell-error">Similar Verse Finder mount is unavailable.</p></div>';
    container.__svfCleanup = null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var rootPrefix = getRootPrefix();
    var inputEl = document.getElementById('svf-input');
    var submitEl = document.getElementById('svf-submit');
    var panelEl = document.getElementById('svf-panel');
    if (!panelEl) return;

    // Results page: no selector input, just render widget
    if (!inputEl || !submitEl) {
      var initialRef = getQueryParam('reference') || '';
      var hasInitialRef = !!initialRef;
      var current = clampState(parseReference(initialRef));
      var navLevel = 'books';

      var sidebarEl = document.getElementById('svf-verse-sidebar');
      var sidebarToggleEl = document.getElementById('svf-sidebar-toggle');
      var sidebarCloseEl = document.getElementById('svf-sidebar-close');
      var sidebarBackdropEl = document.getElementById('svf-sidebar-backdrop');

      function setSidebarOpen(isOpen) {
        if (!sidebarEl) return;
        sidebarEl.classList.toggle('is-open', !!isOpen);
        if (sidebarBackdropEl) sidebarBackdropEl.classList.toggle('is-open', !!isOpen);
        if (sidebarToggleEl) sidebarToggleEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }

      function isMobileViewport() {
        return !!(window.matchMedia && window.matchMedia('(max-width: 1023px)').matches);
      }

      if (!current.bookKey) {
        var books = getBooks();
        if (books.length) {
          current = {
            bookKey: books[0].key,
            chapter: 1,
            verse: 1
          };
        }
      } else if (!current.chapter) {
        current = {
          bookKey: current.bookKey,
          chapter: 1,
          verse: 1
        };
      } else if (!current.verse) {
        current = {
          bookKey: current.bookKey,
          chapter: current.chapter,
          verse: 1
        };
      }

      if (hasInitialRef) {
        var parsed = clampState(parseReference(initialRef));
        if (parsed.bookKey && !parsed.chapter) navLevel = 'chapters';
        else if (parsed.bookKey && parsed.chapter) navLevel = 'verses';
      }

      if (isMobileViewport()) {
        setSidebarOpen(true);
      }

      if (sidebarToggleEl) {
        sidebarToggleEl.addEventListener('click', function () {
          var isOpen = sidebarEl && sidebarEl.classList.contains('is-open');
          setSidebarOpen(!isOpen);
        });
      }

      if (sidebarCloseEl) {
        sidebarCloseEl.addEventListener('click', function () {
          setSidebarOpen(false);
        });
      }

      if (sidebarBackdropEl) {
        sidebarBackdropEl.addEventListener('click', function () {
          setSidebarOpen(false);
        });
      }

      function renderSidebarOnly() {
        renderResultsVerseSidebar(current, navLevel, {
          onChooseBooks: function () {
            navLevel = 'books';
            renderSidebarOnly();
          },
          onChooseChapters: function () {
            navLevel = 'chapters';
            renderSidebarOnly();
          },
          onChooseVerses: function () {
            navLevel = 'verses';
            renderSidebarOnly();
          },
          onSelectBook: function (bookKey) {
            current = clampState({ bookKey: bookKey, chapter: 1, verse: 1 });
            navLevel = 'chapters';
            applyCurrentState();
          },
          onSelectChapter: function (chapter) {
            current = clampState({ bookKey: current.bookKey, chapter: chapter, verse: 1 });
            navLevel = 'verses';
            applyCurrentState();
          },
          onSelectVerse: function (verse) {
            current = clampState({ bookKey: current.bookKey, chapter: current.chapter, verse: verse });
            navLevel = 'verses';
            applyCurrentState();
            if (isMobileViewport()) {
              setSidebarOpen(false);
            }
          }
        });
      }

      function applyCurrentState() {
        var ref = prettyRef(current);
        setQueryParam('reference', ref);
        renderWidget(panelEl, rootPrefix, ref);
        renderSidebarOnly();
      }

      applyCurrentState();
      return;
    }

    // Selector page
    var initialRef = getQueryParam('reference');
    if (initialRef) inputEl.value = initialRef;

    var state = clampState(parseReference(inputEl.value));

    function setState(next) {
      state = clampState(next);

      if (!state.bookKey) {
        inputEl.value = '';
        setQueryParam('reference', '');
        renderBooks(panelEl, rootPrefix, function (s) {
          inputEl.value = titleCaseBookKey(s.bookKey);
          setState(s);
        });
        return;
      }

      var bookLabel = titleCaseBookKey(state.bookKey);

      if (state.bookKey && state.chapter && state.verse) {
        var ref = prettyRef(state);
        window.location.href = 'index.html?reference=' + encodeURIComponent(ref);
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
      if (parsed && parsed.bookKey && parsed.chapter && !parsed.verse) {
        setState(parsed);
        return;
      }
      if (parsed && parsed.bookKey && !parsed.chapter) {
        setState(parsed);
        return;
      }
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
