#!/usr/bin/env python3

"""Unified CLI for the repo's build/conversion scripts.

This is a thin dispatcher that forwards arguments to the existing scripts' `main(argv)`.
It intentionally does not parse subcommand flags itself; the underlying scripts do.

Examples:
    uv run scripts/bomex.py build --steps pages
    uv run scripts/bomex.py convert --in "old/bomex-webstructure/cameo jsons" --out docs/content
    uv run scripts/bomex.py images --copy
    uv run scripts/bomex.py pages
    uv run scripts/bomex.py fix --check
"""

from __future__ import annotations

import argparse
from typing import List, Optional


def _print_help() -> None:
    print(
        "usage: bomex.py <command> [args...]\n\n"
        "Commands:\n"
        "  build    Run multi-step pipeline (convert/images/pages/fix)\n"
        "  convert  Convert legacy people sources (convert_people_to_static.py)\n"
        "  images   Consolidate person images (move_person_images.py)\n"
        "  pages    Generate docs pages (generate_content_pages.py)\n"
        "  fix      Fix apostrophes/mojibake (fix_apostrophes.py)\n\n"
        "Help for a command:\n"
        "  uv run scripts/bomex.py <command> --help"
    )


def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]


def _build_main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="bomex.py build",
        description=(
            "Build the BomEx static site. Optionally rebuild docs/content from legacy sources, "
            "consolidate images, regenerate docs pages, and fix mojibake/apostrophes."
        ),
    )

    parser.add_argument(
        "--steps",
        default="pages",
        help=(
            "Comma-separated steps to run. Choices: convert, images, pages, fix. "
            "Default: pages. Example: --steps convert,images,pages"
        ),
    )

    # convert_people_to_static.py args
    parser.add_argument(
        "--in",
        dest="in_dir",
        default="old/bomex-webstructure/cameo jsons",
        help="Input legacy people dir for convert step (default: old/bomex-webstructure/cameo jsons)",
    )
    parser.add_argument(
        "--out",
        dest="out_dir",
        default="docs/content",
        help="Output dir for convert step (default: docs/content)",
    )
    parser.add_argument(
        "--include",
        choices=["speakers", "all"],
        default="all",
        help="What to convert in convert step (default: all)",
    )

    # move_person_images.py args
    parser.add_argument(
        "--people-root",
        default="docs/content/people",
        help="People root for images step (default: docs/content/people)",
    )
    parser.add_argument(
        "--images-root",
        default="old/bomex-webstructure/public/Images",
        help="Source images root for images step (default: old/bomex-webstructure/public/Images)",
    )
    parser.add_argument(
        "--copy",
        action="store_true",
        help="Copy images instead of moving them (images step)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing main.jpg if present (images step)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write files (images step)",
    )

    # generate_content_pages.py args
    parser.add_argument(
        "--src-root",
        default="docs",
        help="Docs root for page generation (default: docs)",
    )
    parser.add_argument(
        "--data-root",
        default="docs/content",
        help="Data root for page generation (default: docs/content)",
    )

    # fix_apostrophes.py args
    parser.add_argument(
        "--fix-root",
        default="docs",
        help="Root folder for fix step (default: docs)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report apostrophe fixes without modifying files (fix step)",
    )

    args = parser.parse_args(argv)

    steps = set(s.lower() for s in _split_csv(args.steps))
    allowed = {"convert", "images", "pages", "fix"}
    unknown = sorted(steps - allowed)
    if unknown:
        print(f"Unknown steps: {', '.join(unknown)}")
        return 2

    if "convert" in steps:
        from convert_people_to_static import main as convert_main

        rc = convert_main(["--in", args.in_dir, "--out", args.out_dir, "--include", args.include])
        if rc != 0:
            return rc

    if "images" in steps:
        from move_person_images import main as move_images_main

        img_argv: List[str] = [
            "--people-root",
            args.people_root,
            "--images-root",
            args.images_root,
        ]
        if args.copy:
            img_argv.append("--copy")
        if args.overwrite:
            img_argv.append("--overwrite")
        if args.dry_run:
            img_argv.append("--dry-run")

        rc = move_images_main(img_argv)
        if rc != 0:
            return rc

    if "pages" in steps:
        from generate_content_pages import main as generate_pages_main

        rc = generate_pages_main(["--src-root", args.src_root, "--data-root", args.data_root])
        if rc != 0:
            return rc

    if "fix" in steps:
        from fix_apostrophes import main as fix_apostrophes_main

        fix_argv: List[str] = ["--root", args.fix_root]
        if args.check:
            fix_argv.append("--check")
        rc = fix_apostrophes_main(fix_argv)
        if rc != 0:
            return rc

    return 0


def main(argv: Optional[List[str]] = None) -> int:
    if argv is None:
        import sys

        argv = sys.argv[1:]
    else:
        argv = list(argv)
    if not argv or argv[0] in {"-h", "--help", "help"}:
        _print_help()
        return 0

    cmd = argv[0]
    forwarded = argv[1:]

    if cmd == "build":
        return _build_main(forwarded)
    if cmd == "convert":
        from convert_people_to_static import main as convert_main

        return convert_main(forwarded)
    if cmd == "images":
        from move_person_images import main as images_main

        return images_main(forwarded)
    if cmd == "pages":
        from generate_content_pages import main as pages_main

        return pages_main(forwarded)
    if cmd == "fix":
        from fix_apostrophes import main as fix_main

        return fix_main(forwarded)

    print(f"Unknown command: {cmd}\n")
    _print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
