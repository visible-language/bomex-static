(function (global) {
  var MODE_PARAM = 'widget_mode';
  var MODE_STORAGE_KEY = 'widget_mode';
  var MODE_IFRAME = 'iframe';
  var MODE_MOUNT = 'mount';

  function safeLocalStorageGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (err) {
      /* noop */
    }
  }

  function getWidgetMode() {
    var urlMode = new URLSearchParams(global.location.search).get(MODE_PARAM);
    if (urlMode === MODE_MOUNT || urlMode === MODE_IFRAME) {
      return urlMode;
    }

    var stored = safeLocalStorageGet(MODE_STORAGE_KEY);
    if (stored === MODE_MOUNT || stored === MODE_IFRAME) {
      return stored;
    }

    return MODE_IFRAME;
  }

  function setWidgetMode(mode) {
    if (mode !== MODE_MOUNT && mode !== MODE_IFRAME) return;
    safeLocalStorageSet(MODE_STORAGE_KEY, mode);
  }

  function withModeInUrl(mode) {
    var url = new URL(global.location.href);
    url.searchParams.set(MODE_PARAM, mode);
    return url.toString();
  }

  function toggleWidgetMode() {
    var next = getWidgetMode() === MODE_MOUNT ? MODE_IFRAME : MODE_MOUNT;
    setWidgetMode(next);
    global.location.href = withModeInUrl(next);
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
    if (options && typeof options.allowFullscreen === 'boolean') {
      url.searchParams.set('allowFullscreen', options.allowFullscreen ? '1' : '0');
    }
    return url.toString();
  }

  function isFullscreenActive(node) {
    return document.fullscreenElement === node || document.webkitFullscreenElement === node;
  }

  function hasNativeFullscreenSupport(node) {
    if (!node) return false;
    return !!(
      node.requestFullscreen ||
      node.webkitRequestFullscreen ||
      document.exitFullscreen ||
      document.webkitExitFullscreen
    );
  }

  function requestNativeFullscreen(node) {
    if (!node) return Promise.reject(new Error('missing node'));
    if (node.requestFullscreen) return node.requestFullscreen();
    if (node.webkitRequestFullscreen) {
      node.webkitRequestFullscreen();
      return Promise.resolve();
    }
    return Promise.reject(new Error('fullscreen not supported'));
  }

  function exitNativeFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  function setFullscreenButtonText(button, active) {
    button.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
  }

  function wireFullscreen(button, shell, onResize) {
    var pseudoFullscreenActive = false;

    function setPageScrollLock(enabled) {
      var action = enabled ? 'add' : 'remove';
      if (document.documentElement && document.documentElement.classList) {
        document.documentElement.classList[action]('widget-shell-lock');
      }
      if (document.body && document.body.classList) {
        document.body.classList[action]('widget-shell-lock');
      }
    }

    function setPseudoFullscreen(enabled) {
      pseudoFullscreenActive = !!enabled;
      if (shell && shell.classList) {
        shell.classList.toggle('widget-shell--pseudo-fullscreen', pseudoFullscreenActive);
      }
      setPageScrollLock(pseudoFullscreenActive);
    }

    function isActive() {
      return isFullscreenActive(shell) || pseudoFullscreenActive;
    }

    function sync() {
      if (pseudoFullscreenActive && isFullscreenActive(shell)) {
        setPseudoFullscreen(false);
      }
      setFullscreenButtonText(button, isActive());
      if (typeof onResize === 'function') onResize();
    }

    button.addEventListener('click', function () {
      if (isActive()) {
        if (isFullscreenActive(shell)) {
          exitNativeFullscreen().catch(function () {
            setPseudoFullscreen(false);
            sync();
          });
        } else {
          setPseudoFullscreen(false);
          sync();
        }
        return;
      }

      if (!hasNativeFullscreenSupport(shell)) {
        setPseudoFullscreen(true);
        sync();
        return;
      }

      requestNativeFullscreen(shell).catch(function () {
        setPseudoFullscreen(true);
        sync();
      });
    });

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();
    return function () {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      setPseudoFullscreen(false);
    };
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
      allowFullscreen: config.allowFullscreen !== false,
      context: config.context || 'tool'
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

    var controls = document.createElement('div');
    controls.className = 'widget-shell-controls';

    var body = document.createElement('div');
    body.className = 'widget-shell-body';

    shell.appendChild(controls);
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

    if (config.showModeToggle) {
      var modeButton = document.createElement('button');
      modeButton.type = 'button';
      modeButton.className = 'widget-shell-btn';
      modeButton.textContent = mode === MODE_MOUNT ? 'Use Iframe Mode' : 'Use Mount Mode';
      modeButton.addEventListener('click', toggleWidgetMode);
      controls.appendChild(modeButton);
    }

    var modeStatus = document.createElement('span');
    modeStatus.className = 'widget-shell-mode-label';
    modeStatus.textContent = mode === MODE_MOUNT ? 'Mount Mode' : 'Iframe Mode';
    controls.appendChild(modeStatus);

    if (config.allowFullscreen !== false) {
      var fullscreenButton = document.createElement('button');
      fullscreenButton.type = 'button';
      fullscreenButton.className = 'widget-shell-btn';
      controls.appendChild(fullscreenButton);
      widgetResizeHandlers.push(wireFullscreen(fullscreenButton, shell, notifyWidgetResize));
    }

    var activeMode = mode;
    if (mode === MODE_MOUNT) {
      mounted = tryMountWidget(body, config);
      if (!mounted) {
        activeMode = MODE_IFRAME;
        shell.classList.add('widget-shell--mount-fallback');
      }
    }

    if (activeMode === MODE_IFRAME) {
      frameEl = document.createElement('iframe');
      frameEl.className = 'tool-iframe widget-shell-frame';
      frameEl.title = config.title || 'Widget';
      frameEl.loading = 'lazy';
      frameEl.setAttribute('referrerpolicy', 'no-referrer');
      frameEl.setAttribute('scrolling', 'no');
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
        allowFullscreen: true,
        showModeToggle: true
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
