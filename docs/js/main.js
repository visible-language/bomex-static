document.addEventListener("DOMContentLoaded", function() {
    const rootPrefix = document.documentElement.getAttribute('data-root') || '';

    // Load Header
    fetch(rootPrefix + 'header.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('header').innerHTML = data;
            applyRootLinks(rootPrefix);
            initMenu();
        })
        .catch(error => console.error('Error loading header:', error));

    // Load Footer
    fetch(rootPrefix + 'footer.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('footer').innerHTML = data;
            applyRootLinks(rootPrefix);
            updateCopyrightYear();
            // Dynamically load footer.js after footer.html is injected
            var s = document.createElement('script');
            s.src = rootPrefix + 'js/footer.js';
            document.body.appendChild(s);
        })
        .catch(error => console.error('Error loading footer:', error));

    function applyRootLinks(prefix) {
        document.querySelectorAll('[data-root-href]').forEach(el => {
            const href = el.getAttribute('data-root-href');
            if (href) {
                el.setAttribute('href', prefix + href);
            }
        });

        document.querySelectorAll('[data-root-src]').forEach(el => {
            const src = el.getAttribute('data-root-src');
            if (src) {
                el.setAttribute('src', prefix + src);
            }
        });

    }

    function initMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const icon = menuToggle ? menuToggle.querySelector('img') : null;
        const rootPrefix = document.documentElement.getAttribute('data-root') || '';
        const closedSrc = icon ? icon.getAttribute('data-closed-src') : '';
        const openSrc = icon ? icon.getAttribute('data-open-src') : '';

        function resolveIconSrc(value) {
            if (!value) return '';
            if (value.charAt(0) === '/' || value.startsWith('./') || value.startsWith('../')) return value;
            return rootPrefix + value;
        }

        if (icon && closedSrc) {
            icon.setAttribute('src', resolveIconSrc(closedSrc));
        }

        function setMenuOpen(isOpen) {
            if (!mobileMenu) return;
            mobileMenu.classList.toggle('active', isOpen);
            if (!icon) return;
            if (isOpen) {
                if (openSrc) icon.setAttribute('src', resolveIconSrc(openSrc));
            } else {
                if (closedSrc) icon.setAttribute('src', resolveIconSrc(closedSrc));
            }
        }

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', function(event) {
                event.stopPropagation();
                setMenuOpen(!mobileMenu.classList.contains('active'));
            });

            document.addEventListener('click', function(event) {
                if (!mobileMenu.classList.contains('active')) return;
                if (menuToggle.contains(event.target)) return;
                if (mobileMenu.contains(event.target)) return;
                setMenuOpen(false);
            });

            document.addEventListener('touchstart', function(event) {
                if (!mobileMenu.classList.contains('active')) return;
                if (menuToggle.contains(event.target)) return;
                if (mobileMenu.contains(event.target)) return;
                setMenuOpen(false);
            }, { passive: true });
        }
    }

    function updateCopyrightYear() {
        const el = document.getElementById('copyright-year');
        if (!el) return;

        el.textContent = String(new Date().getFullYear());
    }

    function initHelpTooltips() {
        const helpIcons = document.querySelectorAll('.help-icon');
        if (!helpIcons.length) return;

        function closeAll(except) {
            helpIcons.forEach(icon => {
                if (icon !== except) icon.classList.remove('is-tooltip-open');
            });
            document.querySelectorAll('.nav-button--suppress').forEach(btn => {
                btn.classList.remove('nav-button--suppress');
            });
        }

        helpIcons.forEach(icon => {
            icon.addEventListener('pointerdown', function () {
                const parent = icon.closest('.nav-button');
                if (!parent) return;
                parent.classList.add('nav-button--suppress');
                setTimeout(function () {
                    parent.classList.remove('nav-button--suppress');
                }, 200);
            });
            icon.addEventListener('touchstart', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const parent = icon.closest('.nav-button');
                if (!parent) return;
                parent.classList.add('nav-button--suppress');
                setTimeout(function () {
                    parent.classList.remove('nav-button--suppress');
                }, 200);
                const willOpen = !icon.classList.contains('is-tooltip-open');
                closeAll();
                if (willOpen) icon.classList.add('is-tooltip-open');
            }, { passive: false });
            icon.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const willOpen = !icon.classList.contains('is-tooltip-open');
                closeAll();
                if (willOpen) icon.classList.add('is-tooltip-open');
                const parent = icon.closest('.nav-button');
                if (parent) parent.classList.add('nav-button--suppress');
            });
        });

        document.addEventListener('click', function () {
            closeAll();
        });
    }

    initHelpTooltips();
    initScrollTopButton();
    initScriptureAutoLinks();

    function initScrollTopButton() {
        const btn = document.querySelector('.scroll-top-btn');
        if (!btn) return;

        function updateVisibility() {
            const shouldShow = window.scrollY > (window.innerHeight * 4);
            btn.classList.toggle('is-visible', shouldShow);
        }

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        updateVisibility();
        window.addEventListener('scroll', updateVisibility, { passive: true });
        window.addEventListener('resize', updateVisibility);
    }

    function initScriptureAutoLinks() {
        const BOOKS = [
            // Book of Mormon
            { canon: 'bofm', slug: '1-ne', aliases: ['1 nephi', '1st nephi', 'first nephi'] },
            { canon: 'bofm', slug: '2-ne', aliases: ['2 nephi', '2nd nephi', 'second nephi'] },
            { canon: 'bofm', slug: 'jacob', aliases: ['jacob'] },
            { canon: 'bofm', slug: 'enos', aliases: ['enos'] },
            { canon: 'bofm', slug: 'jarom', aliases: ['jarom'] },
            { canon: 'bofm', slug: 'omni', aliases: ['omni'] },
            { canon: 'bofm', slug: 'w-of-m', aliases: ['words of mormon'] },
            { canon: 'bofm', slug: 'mosiah', aliases: ['mosiah'] },
            { canon: 'bofm', slug: 'alma', aliases: ['alma'] },
            { canon: 'bofm', slug: 'hel', aliases: ['helaman'] },
            { canon: 'bofm', slug: '3-ne', aliases: ['3 nephi', '3rd nephi', 'third nephi'] },
            { canon: 'bofm', slug: '4-ne', aliases: ['4 nephi', '4th nephi', 'fourth nephi'] },
            { canon: 'bofm', slug: 'morm', aliases: ['mormon'] },
            { canon: 'bofm', slug: 'ether', aliases: ['ether'] },
            { canon: 'bofm', slug: 'moro', aliases: ['moroni'] },
            // Doctrine and Covenants / PGP
            { canon: 'dc-testament', slug: 'dc', aliases: ['d&c', 'dc', 'doctrine and covenants'] },
            { canon: 'dc-testament', slug: 'od', aliases: ['official declaration', 'od'] },
            { canon: 'pgp', slug: 'moses', aliases: ['moses'] },
            { canon: 'pgp', slug: 'abr', aliases: ['abraham'] },
            { canon: 'pgp', slug: 'js-m', aliases: ['joseph smith matthew', 'js-m', 'js m'] },
            { canon: 'pgp', slug: 'js-h', aliases: ['joseph smith history', 'js-h', 'js h'] },
            { canon: 'pgp', slug: 'a-of-f', aliases: ['articles of faith', 'a of f'] },
            // New Testament
            { canon: 'nt', slug: 'matt', aliases: ['matthew', 'matt'] },
            { canon: 'nt', slug: 'mark', aliases: ['mark'] },
            { canon: 'nt', slug: 'luke', aliases: ['luke'] },
            { canon: 'nt', slug: 'john', aliases: ['john'] },
            { canon: 'nt', slug: 'acts', aliases: ['acts'] },
            { canon: 'nt', slug: 'rom', aliases: ['romans', 'rom'] },
            { canon: 'nt', slug: '1-cor', aliases: ['1 corinthians', '1 cor'] },
            { canon: 'nt', slug: '2-cor', aliases: ['2 corinthians', '2 cor'] },
            { canon: 'nt', slug: 'gal', aliases: ['galatians', 'gal'] },
            { canon: 'nt', slug: 'eph', aliases: ['ephesians', 'eph'] },
            { canon: 'nt', slug: 'philip', aliases: ['philippians', 'phil'] },
            { canon: 'nt', slug: 'col', aliases: ['colossians', 'col'] },
            { canon: 'nt', slug: '1-thes', aliases: ['1 thessalonians', '1 thes'] },
            { canon: 'nt', slug: '2-thes', aliases: ['2 thessalonians', '2 thes'] },
            { canon: 'nt', slug: '1-tim', aliases: ['1 timothy', '1 tim'] },
            { canon: 'nt', slug: '2-tim', aliases: ['2 timothy', '2 tim'] },
            { canon: 'nt', slug: 'titus', aliases: ['titus'] },
            { canon: 'nt', slug: 'philem', aliases: ['philemon', 'philem'] },
            { canon: 'nt', slug: 'heb', aliases: ['hebrews', 'heb'] },
            { canon: 'nt', slug: 'james', aliases: ['james'] },
            { canon: 'nt', slug: '1-pet', aliases: ['1 peter', '1 pet'] },
            { canon: 'nt', slug: '2-pet', aliases: ['2 peter', '2 pet'] },
            { canon: 'nt', slug: '1-jn', aliases: ['1 john', '1 jn'] },
            { canon: 'nt', slug: '2-jn', aliases: ['2 john', '2 jn'] },
            { canon: 'nt', slug: '3-jn', aliases: ['3 john', '3 jn'] },
            { canon: 'nt', slug: 'jude', aliases: ['jude'] },
            { canon: 'nt', slug: 'rev', aliases: ['revelation', 'rev'] },
            // Old Testament (common)
            { canon: 'ot', slug: 'gen', aliases: ['genesis', 'gen'] },
            { canon: 'ot', slug: 'ex', aliases: ['exodus', 'ex'] },
            { canon: 'ot', slug: 'lev', aliases: ['leviticus', 'lev'] },
            { canon: 'ot', slug: 'num', aliases: ['numbers', 'num'] },
            { canon: 'ot', slug: 'deut', aliases: ['deuteronomy', 'deut'] },
            { canon: 'ot', slug: 'josh', aliases: ['joshua', 'josh'] },
            { canon: 'ot', slug: 'judg', aliases: ['judges', 'judg'] },
            { canon: 'ot', slug: 'ruth', aliases: ['ruth'] },
            { canon: 'ot', slug: '1-sam', aliases: ['1 samuel', '1 sam'] },
            { canon: 'ot', slug: '2-sam', aliases: ['2 samuel', '2 sam'] },
            { canon: 'ot', slug: '1-kgs', aliases: ['1 kings', '1 kgs'] },
            { canon: 'ot', slug: '2-kgs', aliases: ['2 kings', '2 kgs'] },
            { canon: 'ot', slug: '1-chr', aliases: ['1 chronicles', '1 chr'] },
            { canon: 'ot', slug: '2-chr', aliases: ['2 chronicles', '2 chr'] },
            { canon: 'ot', slug: 'ezra', aliases: ['ezra'] },
            { canon: 'ot', slug: 'neh', aliases: ['nehemiah', 'neh'] },
            { canon: 'ot', slug: 'esth', aliases: ['esther', 'esth'] },
            { canon: 'ot', slug: 'job', aliases: ['job'] },
            { canon: 'ot', slug: 'ps', aliases: ['psalms', 'psalm', 'ps'] },
            { canon: 'ot', slug: 'prov', aliases: ['proverbs', 'prov'] },
            { canon: 'ot', slug: 'eccl', aliases: ['ecclesiastes', 'eccl'] },
            { canon: 'ot', slug: 'song', aliases: ['song of solomon', 'song'] },
            { canon: 'ot', slug: 'isa', aliases: ['isaiah', 'isa'] },
            { canon: 'ot', slug: 'jer', aliases: ['jeremiah', 'jer'] },
            { canon: 'ot', slug: 'lam', aliases: ['lamentations', 'lam'] },
            { canon: 'ot', slug: 'ezek', aliases: ['ezekiel', 'ezek'] },
            { canon: 'ot', slug: 'dan', aliases: ['daniel', 'dan'] },
            { canon: 'ot', slug: 'hosea', aliases: ['hosea'] },
            { canon: 'ot', slug: 'joel', aliases: ['joel'] },
            { canon: 'ot', slug: 'amos', aliases: ['amos'] },
            { canon: 'ot', slug: 'obad', aliases: ['obadiah', 'obad'] },
            { canon: 'ot', slug: 'jonah', aliases: ['jonah'] },
            { canon: 'ot', slug: 'micah', aliases: ['micah'] },
            { canon: 'ot', slug: 'nahum', aliases: ['nahum'] },
            { canon: 'ot', slug: 'hab', aliases: ['habakkuk', 'hab'] },
            { canon: 'ot', slug: 'zeph', aliases: ['zephaniah', 'zeph'] },
            { canon: 'ot', slug: 'hag', aliases: ['haggai', 'hag'] },
            { canon: 'ot', slug: 'zech', aliases: ['zechariah', 'zech'] },
            { canon: 'ot', slug: 'mal', aliases: ['malachi', 'mal'] }
        ];

        function normalizeBookName(name) {
            return String(name || '')
                .toLowerCase()
                .replace(/[—–]/g, '-')
                .replace(/[.]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function escapeRegex(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const aliasMap = new Map();
        const allAliases = [];
        for (let i = 0; i < BOOKS.length; i++) {
            const b = BOOKS[i];
            for (let j = 0; j < b.aliases.length; j++) {
                const key = normalizeBookName(b.aliases[j]);
                aliasMap.set(key, b);
                allAliases.push(key);
            }
        }
        allAliases.sort((a, b) => b.length - a.length);
        const bookPattern = allAliases.map(escapeRegex).join('|');
        const citationRegex = new RegExp(
            '(?:^|[^A-Za-z0-9])(' + bookPattern + ')\\s+(\\d{1,3})(?:\\s*[:.]\\s*(\\d{1,3}(?:\\s*[-,]\\s*\\d{1,3})*))?',
            'gi'
        );
        const semicolonContinuationRegex = /;\s*(\d{1,3})\s*[:.]\s*(\d{1,3}(?:\s*[-,]\s*\d{1,3})*)/gi;

        function buildScriptureUrl(bookData, chapter, verseSpec) {
            const verseText = verseSpec ? String(verseSpec).replace(/\s+/g, '') : '';
            const firstRange = verseText ? verseText.split(',')[0] : '';
            const rangeMatch = firstRange.match(/^(\d+)-(\d+)$/);
            const firstVerse = firstRange.match(/^(\d+)$/) || firstRange.match(/^(\d+)-/);
            const verse = firstVerse ? parseInt(firstVerse[1], 10) : null;
            let url = 'https://www.churchofjesuschrist.org/study/scriptures/' + bookData.canon + '/' + bookData.slug + '/' + chapter + '/?lang=eng';
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1], 10);
                const end = parseInt(rangeMatch[2], 10);
                if (Number.isFinite(start) && Number.isFinite(end)) {
                    url += '&id=p' + start + '-p' + end + '#p' + start;
                    return url;
                }
            }
            if (verse && Number.isFinite(verse)) {
                url += '&id=' + verse + '#p' + verse;
            }
            return url;
        }

        function shouldSkipNode(node) {
            if (!node || !node.parentElement) return true;
            if (!node.nodeValue || !node.nodeValue.trim()) return true;
            const parent = node.parentElement;
            if (parent.closest('a, script, style, textarea, input, select, button, code, pre, svg, .widget-shell, .tool-widget')) {
                return true;
            }
            return false;
        }

        function autolinkTextNode(node) {
            if (shouldSkipNode(node)) return;
            const text = node.nodeValue;
            citationRegex.lastIndex = 0;
            semicolonContinuationRegex.lastIndex = 0;
            const tokens = [];

            let match = citationRegex.exec(text);
            while (match) {
                const matchStart = match.index;
                const whole = match[0];
                const leading = whole.match(/^[^A-Za-z0-9]*/);
                const lead = leading ? leading[0] : '';
                const citationStart = matchStart + lead.length;
                const citationText = whole.slice(lead.length);

                tokens.push({
                    type: 'full',
                    start: citationStart,
                    end: matchStart + whole.length,
                    text: citationText,
                    bookKey: normalizeBookName(match[1]),
                    chapter: parseInt(match[2], 10),
                    verseSpec: match[3] || ''
                });
                match = citationRegex.exec(text);
            }

            let cont = semicolonContinuationRegex.exec(text);
            while (cont) {
                tokens.push({
                    type: 'continuation',
                    start: cont.index,
                    end: cont.index + cont[0].length,
                    text: cont[0],
                    chapter: parseInt(cont[1], 10),
                    verseSpec: cont[2] || ''
                });
                cont = semicolonContinuationRegex.exec(text);
            }

            if (!tokens.length) return;
            tokens.sort(function (a, b) {
                if (a.start !== b.start) return a.start - b.start;
                return a.end - b.end;
            });

            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            let lastBookData = null;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token.start < lastIndex) {
                    continue;
                }

                if (token.start > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, token.start)));
                }

                if (token.type === 'full') {
                    const bookData = aliasMap.get(token.bookKey);
                    if (!bookData || !Number.isFinite(token.chapter)) {
                        frag.appendChild(document.createTextNode(token.text));
                        lastBookData = null;
                    } else {
                        const a = document.createElement('a');
                        a.href = buildScriptureUrl(bookData, token.chapter, token.verseSpec);
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = token.text;
                        frag.appendChild(a);
                        lastBookData = bookData;
                    }
                } else {
                    if (!lastBookData || !Number.isFinite(token.chapter)) {
                        frag.appendChild(document.createTextNode(token.text));
                    } else {
                        const prefixMatch = token.text.match(/^;\s*/);
                        const prefix = prefixMatch ? prefixMatch[0] : '; ';
                        const refText = token.text.slice(prefix.length);

                        frag.appendChild(document.createTextNode(prefix));
                        const a = document.createElement('a');
                        a.href = buildScriptureUrl(lastBookData, token.chapter, token.verseSpec);
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = refText;
                        frag.appendChild(a);
                    }
                }

                lastIndex = token.end;
            }

            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            node.parentNode.replaceChild(frag, node);
        }

        function autolinkScriptureReferences(root) {
            const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
            const nodes = [];
            let current;
            while ((current = walker.nextNode())) {
                nodes.push(current);
            }
            for (let i = 0; i < nodes.length; i++) {
                autolinkTextNode(nodes[i]);
            }
        }

        autolinkScriptureReferences(document.body);

        if (window.MutationObserver) {
            let queued = false;
            const observer = new MutationObserver(function (mutations) {
                if (queued) return;
                queued = true;
                requestAnimationFrame(function () {
                    queued = false;
                    for (let i = 0; i < mutations.length; i++) {
                        const m = mutations[i];
                        for (let j = 0; j < m.addedNodes.length; j++) {
                            const n = m.addedNodes[j];
                            if (n.nodeType === Node.TEXT_NODE) {
                                autolinkTextNode(n);
                            } else if (n.nodeType === Node.ELEMENT_NODE) {
                                autolinkScriptureReferences(n);
                            }
                        }
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }


});
