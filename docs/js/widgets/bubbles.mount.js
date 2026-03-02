(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/Bubbles', global.location.href).toString();
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

  function scopeCss(cssText, prefix) {
    return cssText.replace(/(^|})\s*([^@{}][^{}]*)\{/g, function (_, boundary, selectors) {
      var scoped = selectors
        .split(',')
        .map(function (selector) {
          var s = selector.trim();
          if (!s) return '';
          return prefix + ' ' + s;
        })
        .filter(Boolean)
        .join(', ');
      return boundary + '\n' + scoped + ' {';
    });
  }

  function applyScopedStyles(root, assetBase) {
    return fetch(assetBase + '/styles/packedbubbles.css')
      .then(function (response) { return response.text(); })
      .then(function (cssText) {
        var style = document.createElement('style');
        style.setAttribute('data-widget-style', 'bubbles');
        var prefix = '.vl-bubbles-root';
        var vars = prefix + ' {' +
          'height: 100%;' +
          'display: flex;' +
          'flex-direction: column;' +
          '--color-1:#c1cdd3;' +
          '--color-1-shade:#aeb9be;' +
          '--color-2:#dfecf2;' +
          '--color-2-shade:#c9d4da;' +
          '--color-3:#a7b0b5;' +
          '--color-3-shade:#959fa5;' +
          '--box-shadow-color: rgba(109, 109, 109, 0.3);' +
          '--text-link-color: #2A85F4;' +
          '--white-shade: #fff;' +
          '--dark-shade:#222;' +
          '}\n';
        var layoutOverrides = '' +
          prefix + ' .widget {height: 100%; display: flex; flex-direction: column;}\n' +
          prefix + ' #graph-container {flex: 1; min-height: 0;}\n' +
          prefix + ' #graph-display {height: 100%; min-height: 420px;}\n';
        style.textContent = vars + layoutOverrides + scopeCss(cssText, prefix);
        root.appendChild(style);
      });
  }

  function buildTemplate(root, assetBase) {
    return fetch(assetBase + '/index.html')
      .then(function (response) { return response.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var body = doc.body;
        var scripts = body.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
          scripts[i].remove();
        }
        root.innerHTML = '';
        var children = body.childNodes;
        for (var j = 0; j < children.length; j++) {
          root.appendChild(children[j].cloneNode(true));
        }
        absolutizeTemplateUrls(root, assetBase);
      });
  }

  function absolutizeTemplateUrls(root, assetBase) {
    if (!root) return;

    function toAbsoluteUrl(raw) {
      var token = String(raw || '').trim();
      if (!token) return token;
      if (token.indexOf('data:') === 0) return token;
      if (token.indexOf('http://') === 0 || token.indexOf('https://') === 0) return token;
      if (token.indexOf('#') === 0) return token;
      if (token.indexOf('/') === 0) return token;
      return new URL(token, assetBase + '/').toString();
    }

    var srcNodes = root.querySelectorAll('[src]');
    for (var i = 0; i < srcNodes.length; i++) {
      var src = srcNodes[i].getAttribute('src');
      srcNodes[i].setAttribute('src', toAbsoluteUrl(src));
    }

    var hrefNodes = root.querySelectorAll('[href]');
    for (var j = 0; j < hrefNodes.length; j++) {
      var href = hrefNodes[j].getAttribute('href');
      hrefNodes[j].setAttribute('href', toAbsoluteUrl(href));
    }
  }

  function normalizeSpeaker(raw) {
    if (!raw) return '';
    return String(raw).trim();
  }

  function mountBubbles(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();
    var root = document.createElement('div');
    root.className = 'vl-bubbles-root';
    root.innerHTML = '<div class="widget-loading">Loading Word Bubbles...</div>';
    container.innerHTML = '';
    container.appendChild(root);

    var speaker = normalizeSpeaker(opts.speaker);
    global.BubblesWidgetAssetBase = assetBase;
    global.BubblesWidgetOptions = {
      speaker: speaker,
      allowSpeakerSelect: opts.allowSpeakerSelect !== false,
      shellManagedResize: true
    };

    var scripts = [
      'https://d3js.org/d3.v6.min.js',
      assetBase + '/scripts/utilities.js',
      assetBase + '/scripts/import_data.js',
      assetBase + '/scripts/main.js',
      assetBase + '/scripts/draw_graphs.js'
    ];
    var resizeState = {
      timer: null,
      lastWidth: 0,
      lastHeight: 0,
      ignoreUntil: 0
    };

    function measureContainer() {
      var rect = container.getBoundingClientRect();
      return {
        width: Math.max(0, Math.round(rect.width)),
        height: Math.max(0, Math.round(rect.height))
      };
    }

    function hasMeaningfulSizeChange(nextSize) {
      return Math.abs(nextSize.width - resizeState.lastWidth) > 1 ||
        Math.abs(nextSize.height - resizeState.lastHeight) > 1;
    }

    function requestWidgetResize() {
      var now = Date.now();
      if (now < resizeState.ignoreUntil) {
        return;
      }

      if (resizeState.timer) {
        clearTimeout(resizeState.timer);
      }
      resizeState.timer = setTimeout(function () {
        resizeState.timer = null;
        var ts = Date.now();
        if (ts < resizeState.ignoreUntil) {
          return;
        }
        var nextSize = measureContainer();
        if (!hasMeaningfulSizeChange(nextSize)) {
          return;
        }
        resizeState.lastWidth = nextSize.width;
        resizeState.lastHeight = nextSize.height;
        if (global.BubblesWidgetApi && typeof global.BubblesWidgetApi.resize === 'function') {
          global.BubblesWidgetApi.resize();
          // ResizeObserver can emit a second callback after re-layout.
          // Suppress immediate follow-up callbacks to avoid double transitions.
          resizeState.ignoreUntil = Date.now() + 900;
        }
      }, 320);
    }

    buildTemplate(root, assetBase)
      .then(function () { return applyScopedStyles(root, assetBase); })
      .then(function () {
        var chain = Promise.resolve();
        for (var i = 0; i < scripts.length; i++) {
          chain = chain.then((function (src) {
            return function () { return loadScriptOnce(src); };
          })(scripts[i]));
        }
        return chain;
      })
      .then(function () {
        var initialSize = measureContainer();
        resizeState.lastWidth = initialSize.width;
        resizeState.lastHeight = initialSize.height;
        if (global.BubblesWidgetApi && typeof global.BubblesWidgetApi.setOptions === 'function') {
          global.BubblesWidgetApi.setOptions({
            speaker: speaker,
            allowSpeakerSelect: opts.allowSpeakerSelect !== false,
            shellManagedResize: true
          });
        }
        if (global.BubblesWidgetApi && typeof global.BubblesWidgetApi.init === 'function') {
          global.BubblesWidgetApi.init();
        }
      })
      .catch(function (err) {
        root.innerHTML = '<p>Unable to load Word Bubbles.</p>';
        console.error(err);
      });

    return {
      update: function () {
        requestWidgetResize();
      },
      destroy: function () {
        if (resizeState.timer) {
          clearTimeout(resizeState.timer);
          resizeState.timer = null;
        }
        if (global.BubblesWidgetApi && typeof global.BubblesWidgetApi.destroy === 'function') {
          global.BubblesWidgetApi.destroy();
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry['word-bubbles'] = { mount: mountBubbles };
  registry['bubbles'] = { mount: mountBubbles };
})(window);
