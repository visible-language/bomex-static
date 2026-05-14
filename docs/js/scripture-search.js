(function () {
  var ONLY_SCRIPTURE_MESSAGE = 'This search feature is currently only for scripture references.';
  var BOOKS = [
    { id: '1-nephi', display: '1 Nephi', aliases: ['1 nephi', '1 ne', '1st nephi', 'first nephi'] },
    { id: '2-nephi', display: '2 Nephi', aliases: ['2 nephi', '2 ne', '2nd nephi', 'second nephi'] },
    { id: 'jacob', display: 'Jacob', aliases: ['jacob'] },
    { id: 'enos', display: 'Enos', aliases: ['enos'] },
    { id: 'jarom', display: 'Jarom', aliases: ['jarom'] },
    { id: 'omni', display: 'Omni', aliases: ['omni'] },
    { id: 'words-of-mormon', display: 'Words of Mormon', aliases: ['words of mormon', 'w of m', 'w-of-m'] },
    { id: 'mosiah', display: 'Mosiah', aliases: ['mosiah'] },
    { id: 'alma', display: 'Alma', aliases: ['alma'] },
    { id: 'helaman', display: 'Helaman', aliases: ['helaman', 'hel'] },
    { id: '3-nephi', display: '3 Nephi', aliases: ['3 nephi', '3 ne', '3rd nephi', 'third nephi'] },
    { id: '4-nephi', display: '4 Nephi', aliases: ['4 nephi', '4 ne', '4th nephi', 'fourth nephi'] },
    { id: 'mormon', display: 'Mormon', aliases: ['mormon', 'morm'] },
    { id: 'ether', display: 'Ether', aliases: ['ether'] },
    { id: 'moroni', display: 'Moroni', aliases: ['moroni', 'moro'] },
    { id: 'dc', display: 'Doctrine and Covenants', aliases: ['d&c', 'dc', 'doctrine and covenants'] },
    { id: 'official-declaration', display: 'Official Declaration', aliases: ['official declaration', 'od'] },
    { id: 'moses', display: 'Moses', aliases: ['moses'] },
    { id: 'abraham', display: 'Abraham', aliases: ['abraham', 'abr'] },
    { id: 'joseph-smith-matthew', display: 'Joseph Smith-Matthew', aliases: ['joseph smith matthew', 'js-m', 'js m'] },
    { id: 'joseph-smith-history', display: 'Joseph Smith-History', aliases: ['joseph smith history', 'js-h', 'js h'] },
    { id: 'articles-of-faith', display: 'Articles of Faith', aliases: ['articles of faith', 'a of f'] },
    { id: 'matthew', display: 'Matthew', aliases: ['matthew', 'matt'] },
    { id: 'mark', display: 'Mark', aliases: ['mark'] },
    { id: 'luke', display: 'Luke', aliases: ['luke'] },
    { id: 'john', display: 'John', aliases: ['john'] },
    { id: 'acts', display: 'Acts', aliases: ['acts'] },
    { id: 'romans', display: 'Romans', aliases: ['romans', 'rom'] },
    { id: '1-corinthians', display: '1 Corinthians', aliases: ['1 corinthians', '1 cor'] },
    { id: '2-corinthians', display: '2 Corinthians', aliases: ['2 corinthians', '2 cor'] },
    { id: 'galatians', display: 'Galatians', aliases: ['galatians', 'gal'] },
    { id: 'ephesians', display: 'Ephesians', aliases: ['ephesians', 'eph'] },
    { id: 'philippians', display: 'Philippians', aliases: ['philippians', 'philip', 'phil'] },
    { id: 'colossians', display: 'Colossians', aliases: ['colossians', 'col'] },
    { id: '1-thessalonians', display: '1 Thessalonians', aliases: ['1 thessalonians', '1 thes'] },
    { id: '2-thessalonians', display: '2 Thessalonians', aliases: ['2 thessalonians', '2 thes'] },
    { id: '1-timothy', display: '1 Timothy', aliases: ['1 timothy', '1 tim'] },
    { id: '2-timothy', display: '2 Timothy', aliases: ['2 timothy', '2 tim'] },
    { id: 'titus', display: 'Titus', aliases: ['titus'] },
    { id: 'philemon', display: 'Philemon', aliases: ['philemon', 'philem'] },
    { id: 'hebrews', display: 'Hebrews', aliases: ['hebrews', 'heb'] },
    { id: 'james', display: 'James', aliases: ['james'] },
    { id: '1-peter', display: '1 Peter', aliases: ['1 peter', '1 pet'] },
    { id: '2-peter', display: '2 Peter', aliases: ['2 peter', '2 pet'] },
    { id: '1-john', display: '1 John', aliases: ['1 john', '1 jn'] },
    { id: '2-john', display: '2 John', aliases: ['2 john', '2 jn'] },
    { id: '3-john', display: '3 John', aliases: ['3 john', '3 jn'] },
    { id: 'jude', display: 'Jude', aliases: ['jude'] },
    { id: 'revelation', display: 'Revelation', aliases: ['revelation', 'rev'] },
    { id: 'genesis', display: 'Genesis', aliases: ['genesis', 'gen'] },
    { id: 'exodus', display: 'Exodus', aliases: ['exodus', 'ex'] },
    { id: 'leviticus', display: 'Leviticus', aliases: ['leviticus', 'lev'] },
    { id: 'numbers', display: 'Numbers', aliases: ['numbers', 'num'] },
    { id: 'deuteronomy', display: 'Deuteronomy', aliases: ['deuteronomy', 'deut'] },
    { id: 'joshua', display: 'Joshua', aliases: ['joshua', 'josh'] },
    { id: 'judges', display: 'Judges', aliases: ['judges', 'judg'] },
    { id: 'ruth', display: 'Ruth', aliases: ['ruth'] },
    { id: '1-samuel', display: '1 Samuel', aliases: ['1 samuel', '1 sam'] },
    { id: '2-samuel', display: '2 Samuel', aliases: ['2 samuel', '2 sam'] },
    { id: '1-kings', display: '1 Kings', aliases: ['1 kings', '1 kgs'] },
    { id: '2-kings', display: '2 Kings', aliases: ['2 kings', '2 kgs'] },
    { id: '1-chronicles', display: '1 Chronicles', aliases: ['1 chronicles', '1 chr'] },
    { id: '2-chronicles', display: '2 Chronicles', aliases: ['2 chronicles', '2 chr'] },
    { id: 'ezra', display: 'Ezra', aliases: ['ezra'] },
    { id: 'nehemiah', display: 'Nehemiah', aliases: ['nehemiah', 'neh'] },
    { id: 'esther', display: 'Esther', aliases: ['esther', 'esth'] },
    { id: 'job', display: 'Job', aliases: ['job'] },
    { id: 'psalms', display: 'Psalms', aliases: ['psalms', 'psalm', 'ps'] },
    { id: 'proverbs', display: 'Proverbs', aliases: ['proverbs', 'prov'] },
    { id: 'ecclesiastes', display: 'Ecclesiastes', aliases: ['ecclesiastes', 'eccl'] },
    { id: 'song-of-solomon', display: 'Song of Solomon', aliases: ['song of solomon', 'song'] },
    { id: 'isaiah', display: 'Isaiah', aliases: ['isaiah', 'isa'] },
    { id: 'jeremiah', display: 'Jeremiah', aliases: ['jeremiah', 'jer'] },
    { id: 'lamentations', display: 'Lamentations', aliases: ['lamentations', 'lam'] },
    { id: 'ezekiel', display: 'Ezekiel', aliases: ['ezekiel', 'ezek'] },
    { id: 'daniel', display: 'Daniel', aliases: ['daniel', 'dan'] },
    { id: 'hosea', display: 'Hosea', aliases: ['hosea'] },
    { id: 'joel', display: 'Joel', aliases: ['joel'] },
    { id: 'amos', display: 'Amos', aliases: ['amos'] },
    { id: 'obadiah', display: 'Obadiah', aliases: ['obadiah', 'obad'] },
    { id: 'jonah', display: 'Jonah', aliases: ['jonah'] },
    { id: 'micah', display: 'Micah', aliases: ['micah'] },
    { id: 'nahum', display: 'Nahum', aliases: ['nahum'] },
    { id: 'habakkuk', display: 'Habakkuk', aliases: ['habakkuk', 'hab'] },
    { id: 'zephaniah', display: 'Zephaniah', aliases: ['zephaniah', 'zeph'] },
    { id: 'haggai', display: 'Haggai', aliases: ['haggai', 'hag'] },
    { id: 'zechariah', display: 'Zechariah', aliases: ['zechariah', 'zech'] },
    { id: 'malachi', display: 'Malachi', aliases: ['malachi', 'mal'] }
  ];

  var ALIASES = [];
  for (var i = 0; i < BOOKS.length; i++) {
    for (var j = 0; j < BOOKS[i].aliases.length; j++) {
      ALIASES.push({ alias: normalizeSearchText(BOOKS[i].aliases[j]), book: BOOKS[i] });
    }
  }
  ALIASES.sort(function (a, b) {
    return b.alias.length - a.alias.length;
  });

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[—–]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseVerseRanges(verseSpec) {
    var parts = String(verseSpec || '').replace(/\s+/g, '').split(',');
    var ranges = [];

    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) return null;
      var match = parts[i].match(/^(\d{1,3})(?:-(\d{1,3}))?$/);
      if (!match) return null;
      var start = parseInt(match[1], 10);
      var end = match[2] ? parseInt(match[2], 10) : start;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
        return null;
      }
      ranges.push([start, end]);
    }

    return ranges.length ? ranges : null;
  }

  function formatVerseRanges(ranges) {
    if (!ranges || !ranges.length) return '';
    return ranges
      .map(function (range) {
        return range[0] === range[1] ? String(range[0]) : range[0] + '-' + range[1];
      })
      .join(', ');
  }

  function buildReferenceLabel(ref) {
    var label = ref.display;
    if (ref.chapterStart) {
      label += ' ' + ref.chapterStart;
      if (ref.chapterEnd && ref.chapterEnd !== ref.chapterStart) {
        label += '-' + ref.chapterEnd;
      }
    }
    if (ref.verseRanges && ref.verseRanges.length) {
      label += ':' + formatVerseRanges(ref.verseRanges);
    }
    return label;
  }

  function parseScriptureReference(value) {
    var text = normalizeSearchText(value);
    if (!text) return null;

    var matchAlias = null;
    for (var i = 0; i < ALIASES.length; i++) {
      if (text === ALIASES[i].alias || text.indexOf(ALIASES[i].alias + ' ') === 0) {
        matchAlias = ALIASES[i];
        break;
      }
    }

    if (!matchAlias) return null;

    var remainder = text.slice(matchAlias.alias.length).trim();
    var parsed = {
      book: matchAlias.book.id,
      display: matchAlias.book.display,
      chapterStart: null,
      chapterEnd: null,
      verseRanges: null
    };

    if (!remainder) {
      parsed.label = buildReferenceLabel(parsed);
      return parsed;
    }

    var match = remainder.match(/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?(?:\s*[:.]\s*(\d{1,3}(?:\s*[-,]\s*\d{1,3})*))?$/);
    if (!match) return null;

    var chapterStart = parseInt(match[1], 10);
    var chapterEnd = match[2] ? parseInt(match[2], 10) : chapterStart;
    if (!Number.isFinite(chapterStart) || !Number.isFinite(chapterEnd) || chapterStart < 1 || chapterEnd < chapterStart) {
      return null;
    }

    parsed.chapterStart = chapterStart;
    parsed.chapterEnd = chapterEnd;

    if (match[3]) {
      if (chapterEnd !== chapterStart) return null;
      parsed.verseRanges = parseVerseRanges(match[3]);
      if (!parsed.verseRanges) return null;
    }

    parsed.label = buildReferenceLabel(parsed);
    return parsed;
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart <= bEnd && bStart <= aEnd;
  }

  function verseRangesOverlap(aRanges, bRanges) {
    for (var i = 0; i < aRanges.length; i++) {
      for (var j = 0; j < bRanges.length; j++) {
        if (rangesOverlap(aRanges[i][0], aRanges[i][1], bRanges[j][0], bRanges[j][1])) {
          return true;
        }
      }
    }
    return false;
  }

  function refMatchesQuery(ref, query) {
    if (!ref || ref.book !== query.book) return false;
    if (!query.chapterStart) return true;

    var refChapterStart = ref.c1;
    var refChapterEnd = ref.c2 || ref.c1;
    if (!rangesOverlap(query.chapterStart, query.chapterEnd, refChapterStart, refChapterEnd)) {
      return false;
    }

    if (!query.verseRanges || !query.verseRanges.length) return true;

    if (!ref.v || !ref.v.length) {
      return refChapterEnd !== refChapterStart;
    }

    if (refChapterStart !== query.chapterStart || refChapterEnd !== query.chapterEnd) {
      return false;
    }

    return verseRangesOverlap(query.verseRanges, ref.v);
  }

  function matchedReferences(items, query) {
    var refs = items || [];
    var matches = [];
    for (var i = 0; i < refs.length; i++) {
      if (refMatchesQuery(refs[i], query)) {
        matches.push(refs[i]);
      }
    }
    return matches;
  }

  function searchIndex(query) {
    var index = window.SCRIPTURE_SEARCH_INDEX || [];
    var results = [];

    for (var i = 0; i < index.length; i++) {
      var occurrences = matchedReferences(index[i].occurrences || index[i].refs || [], query);
      if (!occurrences.length) continue;
      results.push({
        entry: index[i],
        occurrences: occurrences,
        count: occurrences.length
      });
    }

    results.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.entry.title || '').localeCompare(String(b.entry.title || ''));
    });

    return results;
  }

  function broaderQuery(query) {
    if (query.verseRanges && query.verseRanges.length) {
      return {
        book: query.book,
        display: query.display,
        chapterStart: query.chapterStart,
        chapterEnd: query.chapterEnd,
        verseRanges: null,
        label: query.display + ' ' + query.chapterStart
      };
    }

    if (query.chapterStart) {
      return {
        book: query.book,
        display: query.display,
        chapterStart: null,
        chapterEnd: null,
        verseRanges: null,
        label: query.display
      };
    }

    return null;
  }

  function findBroaderSuggestion(query) {
    var next = broaderQuery(query);
    while (next) {
      var results = searchIndex(next);
      if (results.length) {
        return { query: next, count: results.length };
      }
      next = broaderQuery(next);
    }
    return null;
  }

  function clearElement(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function appendTextElement(parent, tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function renderPrompt(resultsEl) {
    clearElement(resultsEl);
    appendTextElement(resultsEl, 'p', 'scripture-results-note', 'Enter a scripture reference above to search content pages.');
  }

  function renderInvalid(resultsEl) {
    clearElement(resultsEl);
    appendTextElement(resultsEl, 'p', 'scripture-results-note', ONLY_SCRIPTURE_MESSAGE);
  }

  function renderResults(resultsEl, query, results) {
    clearElement(resultsEl);
    appendTextElement(resultsEl, 'h2', 'scripture-results-title', 'Results for ' + query.label);

    if (!results.length) {
      appendTextElement(resultsEl, 'p', 'scripture-results-note', 'No content pages were found for ' + query.label + '.');
      var suggestion = findBroaderSuggestion(query);
      if (suggestion) {
        var link = document.createElement('a');
        link.className = 'scripture-broader-link';
        link.href = 'search-results.html?q=' + encodeURIComponent(suggestion.query.label);
        link.textContent = 'Try a broader search for ' + suggestion.query.label + '.';
        resultsEl.appendChild(link);
      }
      return;
    }

    var countText = results.length === 1 ? '1 content page found.' : results.length + ' content pages found.';
    appendTextElement(resultsEl, 'p', 'scripture-results-note', countText);

    var list = document.createElement('div');
    list.className = 'scripture-result-list';

    for (var i = 0; i < results.length; i++) {
      var item = results[i].entry;
      var row = document.createElement('div');
      row.className = 'scripture-result-row';

      var link = document.createElement('a');
      link.className = 'scripture-result-link';
      link.href = item.url;

      appendTextElement(link, 'span', 'scripture-result-title', item.title || item.url);
      appendTextElement(
        link,
        'span',
        'scripture-result-meta',
        (item.section || 'Content') + ' - ' + (results[i].count === 1 ? '1 match' : results[i].count + ' matches')
      );

      row.appendChild(link);

      var kwicList = document.createElement('div');
      kwicList.className = 'scripture-kwic-list';

      for (var j = 0; j < results[i].occurrences.length; j++) {
        var occurrence = results[i].occurrences[j];
        var kwic = document.createElement('div');
        kwic.className = 'scripture-kwic-line';
        appendTextElement(kwic, 'span', 'scripture-kwic-context scripture-kwic-before', occurrence.before || '');
        appendTextElement(kwic, 'span', 'scripture-kwic-hit', occurrence.label || occurrence.match || query.label);
        appendTextElement(kwic, 'span', 'scripture-kwic-context scripture-kwic-after', occurrence.after || '');
        kwicList.appendChild(kwic);
      }

      row.appendChild(kwicList);
      list.appendChild(row);
    }

    resultsEl.appendChild(list);
  }

  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function setFormMessage(form, message) {
    var messageEl = form.querySelector('[data-search-message]');
    if (messageEl) {
      messageEl.textContent = message || '';
    }
  }

  function initSearchForms() {
    var forms = document.querySelectorAll('[data-scripture-search-form]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (event) {
        event.preventDefault();
        var input = this.querySelector('input[name="q"]');
        var parsed = parseScriptureReference(input ? input.value : '');

        if (!parsed) {
          setFormMessage(this, ONLY_SCRIPTURE_MESSAGE);
          return;
        }

        setFormMessage(this, '');
        window.location.href = getRootPrefix() + 'search-results.html?q=' + encodeURIComponent(parsed.label);
      });
    }
  }

  function initResultsPage() {
    var resultsEl = document.getElementById('scripture-search-results');
    if (!resultsEl) return;

    var params = new URLSearchParams(window.location.search);
    var rawQuery = params.get('q') || '';
    var input = document.getElementById('results-scripture-search');
    if (input) input.value = rawQuery;

    if (!rawQuery.trim()) {
      renderPrompt(resultsEl);
      return;
    }

    var parsed = parseScriptureReference(rawQuery);
    if (!parsed) {
      renderInvalid(resultsEl);
      return;
    }

    renderResults(resultsEl, parsed, searchIndex(parsed));
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSearchForms();
    initResultsPage();
  });
})();
