#!/usr/bin/env python3

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


@dataclass
class ImageRef:
    container: Dict[str, Any]
    key: str
    value: str


def _iter_person_details_files(people_root: Path) -> Iterable[Path]:
    yield from sorted(people_root.glob("*/person-details.json"))


def _collect_image_refs(person_details: Dict[str, Any]) -> List[ImageRef]:
    refs: List[ImageRef] = []

    def add(container: Dict[str, Any], key: str) -> None:
        value = container.get(key)
        if isinstance(value, str) and value.strip():
            refs.append(ImageRef(container=container, key=key, value=value.strip()))

    add(person_details, "image")

    pages = person_details.get("pages")
    if isinstance(pages, list):
        for page in pages:
            if isinstance(page, dict):
                add(page, "image")

    return refs


def _pick_source_filename(image_value: str) -> Optional[str]:
    if image_value.startswith("http://") or image_value.startswith("https://"):
        return None
    if image_value in {"./main.jpg", "main.jpg"}:
        return None

    # Handles things like "./Images/Abinadi.jpg" or "Images/Abinadi.jpg".
    return Path(image_value).name or None


def _pick_source_filename_from_source_json(person_details: Dict[str, Any], repo_root: Path) -> Optional[str]:
    pages = person_details.get("pages")
    if not isinstance(pages, list) or not pages:
        return None

    # Prefer the first page source, which points back to the original JSON.
    page0 = pages[0]
    if not isinstance(page0, dict):
        return None

    source = page0.get("source")
    if not isinstance(source, dict):
        return None

    json_path = source.get("json")
    if not isinstance(json_path, str) or not json_path.strip():
        return None

    src_json_path = (repo_root / json_path).resolve()
    if not src_json_path.exists():
        return None

    try:
        src_data = json.loads(src_json_path.read_text(encoding="utf-8"))
    except Exception:
        return None

    # Most of these are structured as {"speakers": [{..., "img": "./Images/X.jpg"}]}.
    speakers = src_data.get("speakers")
    if isinstance(speakers, list) and speakers and isinstance(speakers[0], dict):
        img = speakers[0].get("img")
        if isinstance(img, str) and img.strip():
            return _pick_source_filename(img.strip())

    return None


def _write_json(path: Path, data: Dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def process_person(
    person_details_path: Path,
    images_root: Path,
    repo_root: Path,
    overwrite: bool,
    delete_source: bool,
    dry_run: bool,
) -> Tuple[bool, str]:
    person_dir = person_details_path.parent
    data = json.loads(person_details_path.read_text(encoding="utf-8"))

    refs = _collect_image_refs(data)

    if not refs:
        # No image references at all.
        return False, "no-image"

    # Pick the first referenced image that isn't already main.jpg.
    chosen: Optional[str] = None
    for r in refs:
        fname = _pick_source_filename(r.value)
        if fname:
            chosen = fname
            break

    # If JSON already points at main.jpg, fall back to the original source JSON.
    if not chosen:
        chosen = _pick_source_filename_from_source_json(data, repo_root)

    if not chosen:
        return False, "already-main-or-external"

    src = images_root / chosen
    if not src.exists():
        return False, f"missing-source:{chosen}"

    dst = person_dir / "main.jpg"
    if dst.exists() and not overwrite:
        # Still rewrite JSON to point at the existing main.jpg, and optionally delete the old source.
        for r in refs:
            if _pick_source_filename(r.value):
                r.container[r.key] = "./main.jpg"
        if dry_run:
            return True, "dry-run"

        _write_json(person_details_path, data)
        if delete_source and src.exists():
            src.unlink()
        return True, "updated-json-only"

    if dry_run:
        return True, "dry-run"

    # Copy first, then optionally delete (move).
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    if delete_source:
        src.unlink()

    for r in refs:
        if _pick_source_filename(r.value):
            r.container[r.key] = "./main.jpg"

    _write_json(person_details_path, data)
    return True, "copied-and-updated"


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Copy/move person images referenced in docs/content/people/*/person-details.json "
            "from old/bomex-webstructure/public/Images into each person directory as main.jpg, "
            "and update JSON to point to ./main.jpg."
        )
    )
    parser.add_argument(
        "--people-root",
        default="docs/content/people",
        help="Root directory containing person folders (default: docs/content/people)",
    )
    parser.add_argument(
        "--images-root",
        default="old/bomex-webstructure/public/Images",
        help="Source images root (default: old/bomex-webstructure/public/Images)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing main.jpg if present",
    )
    parser.add_argument(
        "--copy",
        action="store_true",
        help="Copy images instead of moving them (preserve old/bomex-webstructure/public/Images)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without writing files",
    )

    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[1]
    people_root = (repo_root / args.people_root).resolve()
    images_root = (repo_root / args.images_root).resolve()

    if not people_root.exists():
        print(f"people root not found: {people_root}")
        return 2
    if not images_root.exists():
        print(f"images root not found: {images_root}")
        return 2

    updated = 0
    skipped = 0
    problems: List[str] = []

    for person_details_path in _iter_person_details_files(people_root):
        ok, status = process_person(
            person_details_path,
            images_root=images_root,
            repo_root=repo_root,
            overwrite=args.overwrite,
            delete_source=not args.copy,
            dry_run=args.dry_run,
        )
        rel = person_details_path.relative_to(repo_root)
        if ok:
            updated += 1
            if args.dry_run:
                print(f"DRY: {rel} -> {status}")
        else:
            skipped += 1
            if status.startswith("missing-source:"):
                problems.append(f"{rel}: {status}")

    print(f"Done. Updated: {updated}, skipped: {skipped}")
    if problems:
        print("Missing sources:")
        for p in problems:
            print(f"- {p}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
