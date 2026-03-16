(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/SimilarVerse', global.location.href).toString();
    return url.replace(/\/$/, '');
  }

  function ensureRegistry() {
    if (!global.WidgetMountRegistry) {
      global.WidgetMountRegistry = {};
    }
    return global.WidgetMountRegistry;
  }

  function loadScriptOnce(src) {
    var existing = document.querySelector('script[data-widget-src="' + src + '"]');
    if (existing) {
      if (existing.getAttribute('data-loaded') === '1') {
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }

    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-widget-src', src);
      script.addEventListener('load', function () {
        script.setAttribute('data-loaded', '1');
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function adaptCssForShadow(cssText) {
    return cssText
      .replace(/\bhtml\b/g, ':host')
      .replace(/\bbody\b/g, ':host');
  }

  function applyScopedStyles(shadowRoot, assetBase) {
    return fetch(assetBase + '/styles.css')
      .then(function (response) { return response.text(); })
      .then(function (cssText) {
        var style = document.createElement('style');
        style.setAttribute('data-widget-style', 'similarverse');
        var base = ':host {' +
          'all: initial;' +
          'display: block;' +
          'font-family: Roboto, sans-serif;' +
          'line-height: 1.2;' +
          'color: #222;' +
          '}\n' +
          ':host * {box-sizing: border-box;}\n';
        var vars = ':host {' +
          '--color-1:#c1cdd3;' +
          '--color-1-shade:#aeb9be;' +
          '--color-2:#dfecf2;' +
          '--color-2-shade:#c9d4da;' +
          '--color-3:#a7b0b5;' +
          '--color-3-shade:#959fa5;' +
          '--box-shadow-color: rgba(109, 109, 109, 0.3);' +
          '--white-shade: #fff;' +
          '--dark-shade:#222;' +
          '}\n';
        var hostLayout = ':host {' +
          'width: 100%;' +
          'max-width: 100%;' +
          'height: auto !important;' +
          'max-height: none !important;' +
          'overflow: visible !important;' +
          '}\n';
        style.textContent = base + vars + adaptCssForShadow(cssText) + hostLayout;
        shadowRoot.appendChild(style);
      });
  }

  function buildTemplate(shadowRoot, assetBase) {
    return fetch(assetBase + '/index.html')
      .then(function (response) { return response.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var body = doc.body;
        var scripts = body.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
          scripts[i].remove();
        }
        shadowRoot.innerHTML = '';
        var children = body.childNodes;
        for (var j = 0; j < children.length; j++) {
          shadowRoot.appendChild(children[j].cloneNode(true));
        }
      });
  }

  function mountSimilarVerse(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();
    var root = document.createElement('div');
    root.className = 'vl-similarverse-root';
    var shadow = root.attachShadow({ mode: 'open' });
    container.innerHTML = '';
    container.appendChild(root);

    global.SimilarVerseWidgetOptions = {
      reference: opts.reference || ''
    };
    var ns = global.SimilarVerseWidget || (global.SimilarVerseWidget = {});
    ns.root = shadow;

    var scripts = [
      assetBase + '/utils.js',
      assetBase + '/main.js'
    ];

    buildTemplate(shadow, assetBase)
      .then(function () { return applyScopedStyles(shadow, assetBase); })
      .then(function () {
        // Inject spinner overlay over the widget content while scripts load
        var spinnerStyle = document.createElement('style');
        spinnerStyle.setAttribute('data-spinner-style', '1');
        spinnerStyle.textContent =
          '.svf-spinner-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:inherit;border-radius:inherit;z-index:10;}' +
          '@keyframes svf-spin{to{transform:rotate(360deg)}}' +
          '.svf-spinner{width:2.5rem;height:2.5rem;border:4px solid rgba(44,75,85,0.2);border-top-color:#2C4B55;border-radius:50%;animation:svf-spin 0.8s linear infinite;}';
        shadow.appendChild(spinnerStyle);
        var overlay = document.createElement('div');
        overlay.className = 'svf-spinner-overlay';
        overlay.innerHTML = '<div class="svf-spinner"></div>';
        // Wrap the widget in a positioned container so the overlay works
        var widget = shadow.getElementById ? shadow.getElementById('widget') : shadow.querySelector('#widget');
        if (widget) {
          widget.style.position = 'relative';
          widget.appendChild(overlay);
        } else {
          shadow.appendChild(overlay);
        }

        var chain = Promise.resolve();
        for (var i = 0; i < scripts.length; i++) {
          chain = chain.then((function (src) {
            return function () { return loadScriptOnce(src); };
          })(scripts[i]));
        }
        return chain;
      })
      .then(function () {
        // Remove spinner overlay
        var overlays = shadow.querySelectorAll('.svf-spinner-overlay');
        for (var k = 0; k < overlays.length; k++) { overlays[k].remove(); }
        var spinnerStyles = shadow.querySelectorAll('style[data-spinner-style]');
        for (var m = 0; m < spinnerStyles.length; m++) { spinnerStyles[m].remove(); }

        if (global.SimilarVerseWidgetApi && typeof global.SimilarVerseWidgetApi.setOptions === 'function') {
          global.SimilarVerseWidgetApi.setOptions({ reference: opts.reference || '' });
        }
        if (global.SimilarVerseWidgetApi && typeof global.SimilarVerseWidgetApi.init === 'function') {
          global.SimilarVerseWidgetApi.init();
        }
      })
      .catch(function (err) {
        shadow.innerHTML = '<p>Unable to load Similar Verse Finder.</p>';
        console.error(err);
      });

    return {
      update: function () {
        if (global.SimilarVerseWidgetApi && typeof global.SimilarVerseWidgetApi.resize === 'function') {
          global.SimilarVerseWidgetApi.resize();
        }
      },
      destroy: function () {
        if (global.SimilarVerseWidgetApi && typeof global.SimilarVerseWidgetApi.destroy === 'function') {
          global.SimilarVerseWidgetApi.destroy();
        }
        var nsDestroy = global.SimilarVerseWidget || {};
        if (nsDestroy.root === shadow) {
          nsDestroy.root = null;
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry['similar-verse'] = { mount: mountSimilarVerse };
})(window);
