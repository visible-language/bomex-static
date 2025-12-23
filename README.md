
# BomEx Static Site

This repo builds a fully static version of the BomEx site.

## Project Layout

- `src/`
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

- `src/content/people/`
- `src/content/concepts/`
- `src/content/influences/`

Then regenerate the site pages:

```bash
python3 scripts/generate_content_pages.py
```

That regenerates:

- `src/people/index.html` + `src/people/<id>.html`
- `src/concepts/index.html` + `src/concepts/<id>.html`
- `src/influences/index.html` + `src/influences/<id>.html`

### 2) (Optional) Rebuild `src/content/` from legacy React-era sources

If you need to re-import from the older React-era `src/people/...` JSON + `*-analysis.js` sources:

```bash
python3 scripts/convert_people_to_static.py --out src/content
```

Note: the legacy React-era source folder is intentionally not kept under `src/` anymore.

### 3) (Optional) Move/copy people images into content folders

If you have the old image library available (see `old/bomex-webstructure/public/Images/`), you can consolidate person images into each person folder as `main.jpg` and rewrite `person-details.json` to reference `./main.jpg`:

```bash
# dry run
python3 scripts/move_person_images.py --dry-run

# move (default)
python3 scripts/move_person_images.py

# copy instead of move
python3 scripts/move_person_images.py --copy
```

Missing images are tracked in `src/content/TODO.md`.

### 4) (Optional) Fix mojibake / apostrophes site-wide

```bash
python3 scripts/fix_apostrophes.py
```

## Preview Locally

Serve `src/` as the web root:

```bash
cd src
python3 -m http.server 8008
```

Then open:

- http://localhost:8008/
- http://localhost:8008/people/
- http://localhost:8008/concepts/
- http://localhost:8008/influences/
