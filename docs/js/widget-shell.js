(function (global) {
  var MODE_IFRAME = 'iframe';
  var MODE_MOUNT = 'mount';

  function getWidgetMode() {
    return MODE_MOUNT;
  }

  function setWidgetMode() {
    /* deprecated: mount mode is fixed for migrated widgets */
  }

  function createResizeObserver(target, onResize) {
    if (!target || typeof onResize !== 'function') {
      return function () { /* noop */ };
    }

    if (global.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        onResize();
      });
      ro.observe(target);
      return function () { ro.disconnect(); };
    }

    global.addEventListener('resize', onResize);
    return function () { global.removeEventListener('resize', onResize); };
  }

  function initButtonAccordions(root) {
    var scope = root || document;
    var acc = scope.getElementsByClassName('accordion');
    for (var i = 0; i < acc.length; i++) {
      var el = acc[i];
      if (el.tagName.toLowerCase() !== 'button') continue;
      if (el.getAttribute('data-shell-accordion') === '1') continue;

      el.setAttribute('data-shell-accordion', '1');
      el.setAttribute('aria-expanded', 'false');
      el.addEventListener('click', function () {
        this.classList.toggle('active');
        var expanded = this.classList.contains('active');
        this.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        var panel = this.nextElementSibling;
        if (!panel) return;
        panel.style.display = expanded ? 'block' : 'none';
      });
    }
  }

  function appendWidgetQuery(src, options) {
    var url = new URL(src, global.location.href);
    if (options && options.speaker) {
      url.searchParams.set('speaker', options.speaker);
    }
    if (options && options.context) {
      url.searchParams.set('context', options.context);
    }
    if (options && typeof options.allowSpeakerSelect === 'boolean') {
      url.searchParams.set('allowSpeakerSelect', options.allowSpeakerSelect ? '1' : '0');
    }
    return url.toString();
  }

  function getModeForWidget(widgetKey) {
    // Keep StyloXR isolated regardless of global mode selection.
    if (widgetKey === 'stylo-xr') {
      return MODE_IFRAME;
    }
    return getWidgetMode();
  }

  function tryMountWidget(host, config) {
    var registry = global.WidgetMountRegistry || {};
    var entry = registry[config.widgetKey];
    if (!entry || typeof entry.mount !== 'function') {
      return null;
    }
    return entry.mount(host, {
      speaker: config.speaker || '',
      allowSpeakerSelect: config.allowSpeakerSelect !== false,
      context: config.context || 'tool',
      src: config.src || '',
      title: config.title || ''
    });
  }

  function renderFrame(target, config) {
    if (!target || !config || !config.src) return function () { /* noop */ };

    if (typeof target.__widgetShellCleanup === 'function') {
      target.__widgetShellCleanup();
    }

    target.innerHTML = '';

    var mode = getModeForWidget(config.widgetKey || '');
    var shell = document.createElement('div');
    shell.className = 'widget-shell';
    shell.setAttribute('data-widget-mode', mode);

    var body = document.createElement('div');
    body.className = 'widget-shell-body';

    shell.appendChild(body);
    target.appendChild(shell);

    var widgetResizeHandlers = [];
    var mounted = null;
    var frameEl = null;
    var iframeAutoHeightInterval = null;

    function notifyWidgetResize() {
      if (mounted && typeof mounted.update === 'function') {
        mounted.update({ reason: 'resize' });
      }
    }

    if (mode === MODE_MOUNT) {
      mounted = tryMountWidget(body, config);
      if (!mounted) {
        body.innerHTML = '<p class="widget-shell-error">Unable to mount this widget.</p>';
        console.error('Widget mount entry not found for key:', config.widgetKey);
      }
    }

    if (mode === MODE_IFRAME) {
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
      body.style.minHeight = '0';

      frameEl = document.createElement('iframe');
      frameEl.className = 'tool-iframe widget-shell-frame';
      frameEl.title = config.title || 'Widget';
      frameEl.loading = 'lazy';
      frameEl.setAttribute('referrerpolicy', 'no-referrer');
      frameEl.setAttribute('scrolling', 'no');
      frameEl.style.flex = '1 1 auto';
      frameEl.style.minHeight = '0';
      frameEl.style.width = '100%';
      frameEl.style.height = '100%';
      frameEl.src = appendWidgetQuery(config.src, config);
      body.appendChild(frameEl);

      if (config.context === 'person') {
        var autoSize = function () {
          if (!frameEl) return;
          try {
            var doc = frameEl.contentDocument;
            if (!doc) return;
            var bodyEl = doc.body;
            var htmlEl = doc.documentElement;
            var nextHeight = Math.max(
              bodyEl ? bodyEl.scrollHeight : 0,
              htmlEl ? htmlEl.scrollHeight : 0
            );
            if (nextHeight > 0) {
              frameEl.style.height = Math.ceil(nextHeight) + 'px';
            }
          } catch (err) {
            /* noop */
          }
        };

        frameEl.addEventListener('load', function () {
          var ticks = 0;
          autoSize();
          if (iframeAutoHeightInterval) {
            global.clearInterval(iframeAutoHeightInterval);
          }
          iframeAutoHeightInterval = global.setInterval(function () {
            autoSize();
            ticks += 1;
            if (ticks >= 30 && iframeAutoHeightInterval) {
              global.clearInterval(iframeAutoHeightInterval);
              iframeAutoHeightInterval = null;
            }
          }, 1000);
        });
      }
    }

    widgetResizeHandlers.push(createResizeObserver(shell, notifyWidgetResize));

    function cleanup() {
      for (var i = 0; i < widgetResizeHandlers.length; i++) {
        if (typeof widgetResizeHandlers[i] === 'function') {
          widgetResizeHandlers[i]();
        }
      }
      if (mounted && typeof mounted.destroy === 'function') {
        mounted.destroy();
      }
      if (iframeAutoHeightInterval) {
        global.clearInterval(iframeAutoHeightInterval);
        iframeAutoHeightInterval = null;
      }
      if (target.contains(shell)) {
        target.removeChild(shell);
      }
      target.__widgetShellCleanup = null;
    }

    target.__widgetShellCleanup = cleanup;
    return cleanup;
  }

  function initExploreByToolPage() {
    var hosts = document.querySelectorAll('.tool-widget-host');
    if (!hosts.length) return;

    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      var pageKey = (document.body && document.body.getAttribute('data-widget-key')) || '';
      renderFrame(host, {
        title: host.getAttribute('data-widget-title') || 'Widget',
        src: host.getAttribute('data-widget-src') || '',
        widgetKey: host.getAttribute('data-widget-key') || pageKey,
        context: 'tool',
        allowSpeakerSelect: true,
        showModeToggle: false
      });
    }
  }

  global.WidgetShell = {
    MODE_IFRAME: MODE_IFRAME,
    MODE_MOUNT: MODE_MOUNT,
    createResizeObserver: createResizeObserver,
    getWidgetMode: getWidgetMode,
    setWidgetMode: setWidgetMode,
    initButtonAccordions: initButtonAccordions,
    initExploreByToolPage: initExploreByToolPage,
    renderFrame: renderFrame
  };
})(window);
