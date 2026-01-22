
# BomEx Static Site

This repo builds a fully static version of the BomEx site.

## Project Layout

- `docs/`
	- `index.html`, `about.html`, `contact.html`: hand-authored pages
	- `header.html`, `footer.html`: shared chrome injected at runtime
	- `js/main.js`: loads header/footer and handles the mobile menu
	- `css/main.css`: site styles
	- `content/`: canonical “flattened” content data and HTML fragments
		- `content/people/<id>/person-details.json` + `*.html` fragments + optional `main.jpg`
		- `content/concepts/<id>/concept-details.json` + `*.html` fragments
		- `content/influences/<id>/influence-details.json` + `*.html` fragments
	- `people/`, `concepts/`, `influences/`: GENERATED pages (do not edit by hand)

## Editing Content (Typical Workflow)

### 1) Edit canonical content

Edit the JSON and/or fragment HTML under:

- `docs/content/people/`
- `docs/content/concepts/`
- `docs/content/influences/`

Then regenerate the site pages:

```bash
uv run scripts/bomex.py build --steps pages
```

You can also run just the page generator:

```bash
uv run scripts/bomex.py pages
```

That regenerates:

- `docs/people/index.html` + `docs/people/<id>.html`
- `docs/concepts/index.html` + `docs/concepts/<id>.html`
- `docs/influences/index.html` + `docs/influences/<id>.html`

### 2) (Optional) Rebuild `docs/content/` from legacy React-era sources

If you need to re-import from the older React-era `old/bomex-webstructure/cameo jsons/...` JSON + `*-analysis.js` sources:

```bash
uv run scripts/convert_people_to_static.py --out docs/content
```

Default input is `old/bomex-webstructure/cameo jsons` (note the space in the folder name).

Equivalent via the combined build script:

```bash
uv run scripts/bomex.py build --steps convert,pages
```

Note: the legacy React-era source folder is intentionally not kept under `docs/` anymore.

### 3) (Optional) Move/copy people images into content folders

If you have the old image library available (see `old/bomex-webstructure/public/Images/`), you can consolidate person images into each person folder as `main.jpg` and rewrite `person-details.json` to reference `./main.jpg`:

```bash
# dry run
uv run scripts/move_person_images.py --dry-run

# move (default)
uv run scripts/move_person_images.py

# copy instead of move
uv run scripts/move_person_images.py --copy
```

Equivalent via the combined build script:

```bash
uv run scripts/bomex.py build --steps images,pages --copy
```

Missing images are tracked in `docs/content/TODO.md`.

### 4) (Optional) Fix mojibake / apostrophes site-wide

```bash
uv run scripts/fix_apostrophes.py
```

Equivalent via the combined build script:

```bash
uv run scripts/bomex.py build --steps fix
```

## Preview Locally

Serve `docs/` as the web root:

```bash
cd docs
uv run python -m http.server 8008
```

Then open:

- http://localhost:8008/
- http://localhost:8008/people/
- http://localhost:8008/concepts/
- http://localhost:8008/influences/
