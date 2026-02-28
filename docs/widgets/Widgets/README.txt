Widget modules for the Book of Mormon Voices site.

Mount architecture:
- All migrated widgets are mounted through `docs/js/widget-shell.js` + per-widget mount adapters in `docs/js/widgets/*.mount.js`.
- Each mount adapter registers a key in `window.WidgetMountRegistry` and exposes:
  - `mount(container, options) -> { update(), destroy() }`
- `options` commonly includes:
  - `speaker` (string)
  - `allowSpeakerSelect` (boolean)
  - `context` (`tool` or `person`)

Runtime behavior:
- Mount mode is the default for migrated widgets.
- `StyloXR` remains iframe-only for isolation/runtime stability.
- Legacy iframe fallback paths are removed for migrated widgets.

Per-widget script pattern:
- Original `index.html` structure is kept as a template source.
- Inline scripts were extracted to `main.js` (where applicable).
- Mount adapters inject scoped CSS and load scripts in deterministic order.
- Widget globals are exposed only through intentional namespace APIs:
  - e.g. `window.BubblesWidgetApi`, `window.TimelineWidgetApi`, `window.SocialNetworkWidgetApi`, `window.SpeakersNetworkWidgetApi`.

Asset path rule:
- Mounted widgets must resolve internal JSON/image/CSS URLs from a widget asset base, not page-relative `./` assumptions.

Cleanup contract:
- `destroy()` must remove listeners/timers/animations.
- `update()` should handle host resize/reflow requests.
 

