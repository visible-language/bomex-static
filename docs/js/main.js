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
});
