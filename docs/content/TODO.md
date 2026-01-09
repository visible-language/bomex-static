# TODO (content)

## Missing images
✅ Resolved (2026-01-09): all previously-listed people now have `main.jpg` and `person-details.json` points at `./main.jpg`.

## Confused images

For some reason, Alma the Elder and Alma the Younger ended up with the same image.

✅ Resolved (2026-01-09): all listed people now have `main.jpg`, and Alma the Elder/Younger now have distinct images.

## Notes
- If these should have images, update `docs/content/people/*/person-details.json` (the `image` field) and re-run:
  - `uv run scripts/bomex.py images --copy --overwrite`
  - `uv run scripts/bomex.py pages`
