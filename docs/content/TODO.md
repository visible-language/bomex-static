# TODO (content)

## Missing images
These people folders currently have no image reference in `person-details.json`, so no `main.jpg` was created by `scripts/move_person_images.py`:

- `people/amaleki/`
- `people/ammon-z/`
- `people/ammoron/`
- `people/benjamin-people/`
- `people/nephite-judges/`

## Notes
- If these should have images, update the source JSONs under `docs/people/**` (the `img` field) and re-run:
  - `python3 scripts/convert_people_to_static.py --include all`
  - `python3 scripts/move_person_images.py --copy`
