(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/SemanticMaps', global.location.href).toString();
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
      script.addEventListener('load', function () {
        resolve();
      }, { once: true });
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
    return fetch(assetBase + '/styles.css')
      .then(function (response) { return response.text(); })
      .then(function (cssText) {
        var style = document.createElement('style');
        style.setAttribute('data-widget-style', 'semantic-map');
        var prefix = '.vl-semantic-root';
        var vars = prefix + ' {' +
          '--select_color: rgba(0, 0, 0, 0.1);' +
          '--transparent_back: rgba(255,255,255, 0.9);' +
          'display:block;' +
          'position:relative;' +
          'width:100%;' +
          'height:100%;' +
          'min-height:520px;' +
          '}\n';
        var layoutOverrides = '' +
          prefix + ' .semantic-map-plot-wrap {position:relative; width:100%;}\n' +
          prefix + ' #plot {width:100%; height:100%;}\n' +
          prefix + ' #loader {width:100%; height:100%;}\n' +
          prefix + ' #reset-button {position:absolute; top:0.5rem; left:0.5rem; right:auto; inset:auto; margin:0; z-index:4;}\n';
        var mobileOverrides =
          '@media (max-width: 1100px), (hover: none), (pointer: coarse) {' +
          prefix + ' {display:flex; flex-direction:column; gap:0.75rem; padding:0.75rem;}' +
          prefix + ' #holder {order:1; position:static !important; left:auto !important; top:auto !important; width:100% !important; z-index:auto !important; display:flex !important; flex-direction:column !important; gap:0.5rem;}' +
          prefix + ' #holder > #autoComplete, ' + prefix + ' #holder > .autoComplete_wrapper {order:1; visibility:visible !important; width:100% !important;}' +
          prefix + ' #holder > #info-box, ' + prefix + ' #holder > .info-box {order:2; width:100% !important; max-height:none !important; min-height:0 !important; overflow:visible !important;}' +
          prefix + ' .semantic-map-plot-wrap {order:2; position:relative !important; width:100% !important; height:min(52vh, 420px) !important; min-height:320px !important; max-height:420px !important;}' +
          prefix + ' #plot {position:relative !important; width:100% !important; height:100% !important; min-height:0 !important; max-height:none !important;}' +
          prefix + ' #legend {order:3; position:static !important; inset:auto !important; width:100% !important; max-height:none !important; overflow:visible !important; align-items:flex-start !important;}' +
          prefix + ' #reset-button {position:absolute !important; top:0.5rem !important; left:0.5rem !important; right:auto !important; inset:auto !important; margin:0 !important; z-index:4 !important;}' +
          prefix + ' .autoComplete_wrapper > input {width:100% !important;}' +
          '}';
        var finalOverrides = '' +
          prefix + ' #reset-button {position:absolute !important; top:0.5rem !important; left:0.5rem !important; right:auto !important; inset:auto !important; margin:0 !important; z-index:4 !important;}\n';
        style.textContent = vars + layoutOverrides + scopeCss(absolutizeCssUrls(cssText, assetBase), prefix) + mobileOverrides + finalOverrides;
        root.appendChild(style);
      });
  }

  function prepareTemplateLayout(root) {
    if (!root) return;
    var plot = root.querySelector('#plot');
    if (!plot) return;

    var wrap = root.querySelector('.semantic-map-plot-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'semantic-map-plot-wrap';
      plot.parentNode.insertBefore(wrap, plot);
      wrap.appendChild(plot);
    }

    var resetButton = root.querySelector('#reset-button');
    if (resetButton && resetButton.parentNode !== wrap) {
      wrap.appendChild(resetButton);
    }
    enforceResetButtonPosition(root);
  }

  function enforceResetButtonPosition(root) {
    if (!root) return;
    var wrap = root.querySelector('.semantic-map-plot-wrap');
    if (wrap) {
      wrap.style.setProperty('position', 'relative', 'important');
      wrap.style.setProperty('overflow', 'hidden', 'important');
    }
    var resetButton = root.querySelector('#reset-button');
    if (!resetButton) return;
    resetButton.style.setProperty('position', 'absolute', 'important');
    resetButton.style.setProperty('inset', 'auto', 'important');
    resetButton.style.setProperty('top', '0.5rem', 'important');
    resetButton.style.setProperty('left', '0.5rem', 'important');
    resetButton.style.setProperty('right', 'auto', 'important');
    resetButton.style.setProperty('margin', '0', 'important');
    resetButton.style.setProperty('z-index', '4', 'important');
  }

  function buildTemplate(root, assetBase, variant) {
    var subdir = variant === 'bible' ? 'BibleSemanticMap' : 'BOMSemanticMap';
    return fetch(assetBase + '/' + subdir + '/index.html')
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
        prepareTemplateLayout(root);
      });
  }

  function guessVariant(options) {
    var src = (options && options.src) ? String(options.src).toLowerCase() : '';
    if (src.indexOf('biblesemanticmap') >= 0) {
      return 'bible';
    }
    return 'bom';
  }

  function mountSemanticMap(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();
    var variant = guessVariant(opts);
    var subdir = variant === 'bible' ? 'BibleSemanticMap' : 'BOMSemanticMap';

    var root = document.createElement('div');
    root.className = 'vl-semantic-root';
    root.setAttribute('data-semantic-variant', variant);
    root.innerHTML = '<div class="widget-loading">Loading Semantic Map...</div>';
    container.innerHTML = '';
    container.appendChild(root);

    global.SemanticMapWidgetAssetBase = assetBase;
    global.SemanticMapWidgetOptions = {
      variant: variant
    };

    var bootScripts = [
      'https://d3js.org/d3.v7.min.js',
      assetBase + '/autoComplete.js',
      assetBase + (variant === 'bible' ? '/bibleVerses.js' : '/bomVerses.js')
    ];
    var mainScript = assetBase + '/' + subdir + '/main.js';

    buildTemplate(root, assetBase, variant)
      .then(function () { return applyScopedStyles(root, assetBase); })
      .then(function () { enforceResetButtonPosition(root); })
      .then(function () {
        var chain = Promise.resolve();
        for (var i = 0; i < bootScripts.length; i++) {
          chain = chain.then((function (src) {
            return function () { return loadScriptOnce(src); };
          })(bootScripts[i]));
        }
        return chain;
      })
      .then(function () {
        return loadScriptFresh(mainScript);
      })
      .catch(function (err) {
        root.innerHTML = '<p>Unable to load Semantic Map.</p>';
        console.error(err);
      });

    return {
      update: function () {
        enforceResetButtonPosition(root);
        if (typeof global.dispatchEvent === 'function') {
          global.dispatchEvent(new Event('resize'));
        }
      },
      destroy: function () {
        var tips = document.querySelectorAll('.tooltip');
        for (var i = 0; i < tips.length; i++) {
          if (tips[i] && tips[i].parentNode) {
            tips[i].parentNode.removeChild(tips[i]);
          }
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry['semantic-map'] = { mount: mountSemanticMap };
})(window);
