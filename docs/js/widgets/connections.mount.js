(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/Connections', global.location.href).toString();
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
    return fetch(assetBase + '/connections.css')
      .then(function (response) { return response.text(); })
      .then(function (cssText) {
        var style = document.createElement('style');
        style.setAttribute('data-widget-style', 'connections');
        var prefix = '.vl-connections-root';
        var vars = prefix + ' {' +
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
        var layoutOverrides = '' +
          prefix + ' {height: 100%; display: block;}\n' +
          prefix + ' .page {min-height: 0;}\n';
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
      });
  }

  function normalizeSpeaker(raw) {
    if (!raw) return '';
    return String(raw).trim();
  }

  function mountConnections(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();
    var root = document.createElement('div');
    root.className = 'vl-connections-root';
    root.innerHTML = '<div class="widget-loading">Loading Connections...</div>';
    container.innerHTML = '';
    container.appendChild(root);

    var speaker = normalizeSpeaker(opts.speaker);
    global.ConnectionsWidgetAssetBase = assetBase;
    global.ConnectionsWidgetOptions = {
      speaker: speaker,
      allowSpeakerSelect: opts.allowSpeakerSelect !== false
    };

    var scripts = [
      'https://d3js.org/d3.v6.min.js',
      assetBase + '/data.js',
      assetBase + '/connections.js'
    ];
    var resizeTimer = null;

    function requestWidgetResize() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        if (global.ConnectionsWidgetApi && typeof global.ConnectionsWidgetApi.resize === 'function') {
          global.ConnectionsWidgetApi.resize();
        }
      }, 300);
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
        if (global.ConnectionsWidgetApi && typeof global.ConnectionsWidgetApi.setOptions === 'function') {
          global.ConnectionsWidgetApi.setOptions({
            speaker: speaker,
            allowSpeakerSelect: opts.allowSpeakerSelect !== false
          });
        }
        if (global.ConnectionsWidgetApi && typeof global.ConnectionsWidgetApi.init === 'function') {
          global.ConnectionsWidgetApi.init();
        }
      })
      .catch(function (err) {
        root.innerHTML = '<p>Unable to load Connections.</p>';
        console.error(err);
      });

    return {
      update: function () {
        requestWidgetResize();
      },
      destroy: function () {
        if (resizeTimer) {
          clearTimeout(resizeTimer);
          resizeTimer = null;
        }
        if (global.ConnectionsWidgetApi && typeof global.ConnectionsWidgetApi.destroy === 'function') {
          global.ConnectionsWidgetApi.destroy();
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry.connections = { mount: mountConnections };
})(window);
