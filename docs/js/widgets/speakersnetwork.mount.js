(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/SpeakersNetwork', global.location.href).toString();
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

  function loadScriptFresh(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
      script.async = false;
      script.addEventListener('load', function () { resolve(); }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function absolutizeCssUrls(cssText, baseUrl) {
    return cssText.replace(/url\(([^)]+)\)/g, function (match, rawPath) {
      var token = String(rawPath || '').trim();
      var quote = '';
      if (!token) return match;
      if ((token.charAt(0) === '"' && token.charAt(token.length - 1) === '"') ||
          (token.charAt(0) === '\'' && token.charAt(token.length - 1) === '\'')) {
        quote = token.charAt(0);
        token = token.slice(1, -1).trim();
      }
      if (!token || token.indexOf('data:') === 0 || token.indexOf('http://') === 0 || token.indexOf('https://') === 0 || token.indexOf('#') === 0) {
        return match;
      }
      var absolute = new URL(token, baseUrl + '/').toString();
      return 'url(' + (quote || '"') + absolute + (quote || '"') + ')';
    });
  }

  function scopeCss(cssText, prefix) {
    return cssText.replace(/(^|})\s*([^@{}][^{}]*)\{/g, function (_, boundary, selectors) {
      var scoped = selectors
        .split(',')
        .map(function (selector) {
          var s = selector.trim();
          if (!s) return '';
          if (s === ':root' || s === 'body' || s === 'html' || s === 'html,body') {
            return prefix;
          }
          if (s.indexOf('body ') === 0) {
            return prefix + s.slice(4);
          }
          if (s.indexOf('html ') === 0) {
            return prefix + s.slice(4);
          }
          return prefix + ' ' + s;
        })
        .filter(Boolean)
        .join(', ');
      return boundary + '\n' + scoped + ' {';
    });
  }

  function applyScopedStyles(root, assetBase) {
    var colorsReq = fetch(new URL('../colors.css', assetBase + '/').toString()).then(function (res) { return res.text(); });
    var widgetReq = fetch(assetBase + '/styles.css').then(function (res) { return res.text(); });

    return Promise.all([colorsReq, widgetReq]).then(function (texts) {
      var style = document.createElement('style');
      style.setAttribute('data-widget-style', 'speakers-network');
      var prefix = '.vl-speakers-root';
      var base = prefix + ' {' +
        'display:block;' +
        'position:relative;' +
        'width:100%;' +
        'min-height:640px;' +
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
        'overflow-x:hidden;' +
        '}\n';
      var layout =
        prefix + ' #widget {width:100%; height:100%; max-width:100%; overflow:hidden;}\n' +
        prefix + ' #page-container {width:100%; max-width:100%; grid-template-columns:minmax(260px, 300px) minmax(0, 1fr);}\n' +
        prefix + ' #graph-3d, ' + prefix + ' #sidebar, ' + prefix + ' #toolbar {min-width:0; max-width:100%;}\n' +
        prefix + ' #graph-3d canvas {max-width:100%;}\n';
      var mobileOverrides =
        '@media screen and (max-width: 1024px) {' +
        prefix + ' #page-container {' +
        'grid-template-columns:minmax(0,1fr) !important;' +
        'grid-template-rows:0px auto auto auto !important;' +
        'grid-template-areas:"headbar" "3d-graph" "sidebar" "toolbar" !important;' +
        '}' +
        prefix + ' #graph-3d, ' + prefix + ' #sidebar, ' + prefix + ' #toolbar {' +
        'width:100% !important; max-width:100% !important; margin:5px 0 !important;' +
        '}' +
        prefix + ' #toolbar {' +
        'display:flex !important; flex-wrap:wrap !important; gap:6px; padding:0 2px;' +
        '}' +
        prefix + ' .button {' +
        'flex:1 1 calc(50% - 6px); min-width:0; margin:0 !important;' +
        '}' +
        '}';
      var colorsCss = scopeCss(absolutizeCssUrls(texts[0], assetBase), prefix);
      var widgetCss = scopeCss(absolutizeCssUrls(texts[1], assetBase), prefix);
      style.textContent = base + colorsCss + widgetCss + layout + mobileOverrides;
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
      });
  }

  function mountSpeakersNetwork(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();

    var root = document.createElement('div');
    root.className = 'vl-speakers-root';
    root.innerHTML = '<div class="widget-loading">Loading Similar Topic Diagram...</div>';
    container.innerHTML = '';
    container.appendChild(root);

    var libs = [
      'https://unpkg.com/3d-force-graph',
      'https://unpkg.com/d3-force-3d'
    ];

    buildTemplate(root, assetBase)
      .then(function () { return applyScopedStyles(root, assetBase); })
      .then(function () {
        var chain = Promise.resolve();
        for (var i = 0; i < libs.length; i++) {
          chain = chain.then((function (src) {
            return function () { return loadScriptOnce(src); };
          })(libs[i]));
        }
        chain = chain.then(function () { return loadScriptOnce(assetBase + '/utils.js'); });
        return chain;
      })
      .then(function () {
        global.SpeakersNetworkWidgetAssetBase = assetBase;
        global.SpeakersNetworkWidgetOptions = {
          speaker: opts.speaker || ''
        };
        return loadScriptFresh(assetBase + '/main.js');
      })
      .catch(function (err) {
        root.innerHTML = '<p>Unable to load Similar Topic Diagram.</p>';
        console.error(err);
      });

    return {
      update: function () {
        if (global.SpeakersNetworkWidgetApi && typeof global.SpeakersNetworkWidgetApi.resize === 'function') {
          global.SpeakersNetworkWidgetApi.resize();
        }
      },
      destroy: function () {
        if (global.SpeakersNetworkWidgetApi && typeof global.SpeakersNetworkWidgetApi.destroy === 'function') {
          global.SpeakersNetworkWidgetApi.destroy();
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry['similar-topic-diagram'] = { mount: mountSpeakersNetwork };
  registry['topic'] = { mount: mountSpeakersNetwork };
})(window);
