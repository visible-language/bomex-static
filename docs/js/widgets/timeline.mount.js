(function (global) {
  function getRootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  function getAssetBase() {
    var rootPrefix = getRootPrefix();
    var url = new URL(rootPrefix + 'widgets/Widgets/Timeline', global.location.href).toString();
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
          if (s === ':root' || s === 'body' || s === 'html') {
            return prefix;
          }
          if (s.indexOf('body ') === 0) {
            return prefix + s.slice(4);
          }
          if (s.indexOf('html ') === 0) {
            return prefix + s.slice(4);
          }
          if (s.indexOf(':root ') === 0) {
            return prefix + s.slice(5);
          }
          return prefix + ' ' + s;
        })
        .filter(Boolean)
        .join(', ');
      return boundary + '\n' + scoped + ' {';
    });
  }

  function applyScopedStyles(root, assetBase) {
    return fetch(assetBase + '/timeline.css')
      .then(function (response) { return response.text(); })
      .then(function (cssText) {
        var style = document.createElement('style');
        style.setAttribute('data-widget-style', 'timeline');
        var prefix = '.vl-timeline-root';
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
          '--background-color:#EFEFEF;' +
          '--framework-line-color:rgb(197, 197, 197);' +
          '--main-blue:#dfecf2;' +
          '--secondary-blue:#ececec;' +
          '--tertiary-blue:#93c3d9;' +
          '--gradient-title:linear-gradient(90deg, var(--main-blue) 0%, rgb(67, 67, 137) 50%, var(--main-blue) 100%);' +
          '--legend-gray:#f0f0f0;' +
          '--legend-hover:#e9e9e9;' +
          '}\n';
        var layoutOverrides = '' +
          prefix + ' {display:block; width:100%;}\n' +
          prefix + ' .page {min-width:0; max-width:none; width:100%; margin:0;}\n';
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

  function mountTimeline(container, options) {
    var opts = options || {};
    var assetBase = getAssetBase();
    var root = document.createElement('div');
    root.className = 'vl-timeline-root';
    root.innerHTML = '<div class="widget-loading">Loading Timeline...</div>';
    container.innerHTML = '';
    container.appendChild(root);

    var speaker = normalizeSpeaker(opts.speaker);
    global.TimelineWidgetAssetBase = assetBase;
    global.TimelineWidgetOptions = {
      speaker: speaker,
      allowSpeakerSelect: opts.allowSpeakerSelect !== false
    };

    var scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js',
      assetBase + '/data.js',
      assetBase + '/dropdown.js',
      assetBase + '/timeline.js'
    ];
    var resizeTimer = null;

    function requestWidgetResize() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        if (global.TimelineWidgetApi && typeof global.TimelineWidgetApi.resize === 'function') {
          global.TimelineWidgetApi.resize();
        }
      }, 280);
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
        if (global.TimelineWidgetApi && typeof global.TimelineWidgetApi.setOptions === 'function') {
          global.TimelineWidgetApi.setOptions({
            speaker: speaker,
            allowSpeakerSelect: opts.allowSpeakerSelect !== false
          });
        }
        if (global.TimelineWidgetApi && typeof global.TimelineWidgetApi.init === 'function') {
          global.TimelineWidgetApi.init();
        }
      })
      .catch(function (err) {
        root.innerHTML = '<p>Unable to load Timeline.</p>';
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
        if (global.TimelineWidgetApi && typeof global.TimelineWidgetApi.destroy === 'function') {
          global.TimelineWidgetApi.destroy();
        }
        container.innerHTML = '';
      }
    };
  }

  var registry = ensureRegistry();
  registry.timeline = { mount: mountTimeline };
})(window);
