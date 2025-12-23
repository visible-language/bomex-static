#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Fix:
    pattern: str
    replacement: str
    description: str


MOJIBAKE_FIXES: Sequence[Fix] = [
    Fix("â€™", "’", "cp1252 apostrophe decoded as utf-8"),
    Fix("â€˜", "‘", "cp1252 left single quote decoded as utf-8"),
    Fix("â€œ", "“", "cp1252 left double quote decoded as utf-8"),
    Fix("â€�", "”", "cp1252 right double quote decoded as utf-8"),
    Fix("â€“", "–", "cp1252 en-dash decoded as utf-8"),
    Fix("â€”", "—", "cp1252 em-dash decoded as utf-8"),
    Fix("â€¦", "…", "cp1252 ellipsis decoded as utf-8"),
    Fix("Â\u00a0", " ", "stray Â before NBSP"),
    Fix("\u00a0", " ", "NBSP to space"),
    Fix("Â", "", "stray Â"),
]


# U+FFFD replacement char contexts that are almost certainly apostrophes.
REPLACEMENT_APOSTROPHE_RULES: Sequence[Tuple[re.Pattern[str], str]] = [
    # Letter � letter -> letter ’ letter
    (re.compile(r"(?<=[A-Za-z])\ufffd(?=[A-Za-z])"), "’"),
    # s�<space/punct/end> -> s’...
    (re.compile(r"(?<=s)\ufffd(?=(\s|$|[\]\[\)\(\}\{\.,;:!\?\"']))"), "’"),
    (re.compile(r"(?<=S)\ufffd(?=(\s|$|[\]\[\)\(\}\{\.,;:!\?\"']))"), "’"),
]


# U+FFFD used as paired quotation marks (common in headings like: �trust�).
REPLACEMENT_QUOTE_RULES: Sequence[Tuple[re.Pattern[str], str]] = [
    (re.compile(r"\ufffd([^\ufffd\n]{1,80})\ufffd"), r"“\1”"),
]


TEXT_FILE_EXTS = {".html", ".htm", ".json", ".js", ".css", ".md", ".txt"}


def _iter_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in TEXT_FILE_EXTS:
            continue
        # Avoid touching vendor/minified content if it ever shows up.
        if "node_modules" in p.parts:
            continue
        yield p


def fix_text(s: str) -> Tuple[str, Dict[str, int]]:
    counts: Dict[str, int] = {}

    for fx in MOJIBAKE_FIXES:
        if fx.pattern in s:
            counts[fx.description] = counts.get(fx.description, 0) + s.count(fx.pattern)
            s = s.replace(fx.pattern, fx.replacement)

    if "\ufffd" in s:
        before = s
        for rx, repl in REPLACEMENT_APOSTROPHE_RULES:
            s = rx.sub(repl, s)
        if s != before:
            counts["replacement-char->apostrophe"] = counts.get("replacement-char->apostrophe", 0) + (before.count("\ufffd") - s.count("\ufffd"))

    if "\ufffd" in s:
        before = s
        for rx, repl in REPLACEMENT_QUOTE_RULES:
            s = rx.sub(repl, s)
        if s != before:
            counts["replacement-char->quotes"] = counts.get("replacement-char->quotes", 0) + (before.count("\ufffd") - s.count("\ufffd"))

    return s, counts


def run(root: Path, apply: bool) -> int:
    touched = 0
    total_replacements: Dict[str, int] = {}

    for path in _iter_files(root):
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            # If a file is not valid UTF-8, leave it alone rather than risking corruption.
            continue

        fixed, counts = fix_text(original)
        if fixed == original:
            continue

        touched += 1
        for k, v in counts.items():
            total_replacements[k] = total_replacements.get(k, 0) + v

        if apply:
            path.write_text(fixed, encoding="utf-8")

    print(f"Files changed: {touched}")
    if total_replacements:
        print("Replacements:")
        for k in sorted(total_replacements.keys()):
            print(f"- {k}: {total_replacements[k]}")

    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Fix broken apostrophes/quotes across the site by replacing common mojibake sequences "
            "and converting the U+FFFD replacement character to a right single quote in apostrophe contexts."
        )
    )
    parser.add_argument(
        "--root",
        default="src",
        help="Root folder to scan (default: src)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report changes without modifying files",
    )

    args = parser.parse_args()
    root = (REPO_ROOT / args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Root not found: {root}")

    raise SystemExit(run(root=root, apply=not args.check))


if __name__ == "__main__":
    main()
