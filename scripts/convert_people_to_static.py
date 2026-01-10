#!/usr/bin/env python3
"""Convert BOMEX JSX + JSON into a static, per-item folder layout.

Input (current repo state):
- `docs/people/Major speakers/**` and `docs/people/Minor speakers/**`
  - `*.json` files: metadata for a "page" (bio or sub-article)
  - `*-analysis.js` files: JSX with blocks keyed by `id === "..."` returning HTML-ish content

Output (new static layout):
- `<out>/people/<person_id>/person-details.json`
- `<out>/people/<person_id>/*.html` (one HTML fragment per analysis id)
- `<out>/concepts/<concept_id>/concept-details.json`
- `<out>/concepts/<concept_id>/*.html`
- `<out>/influences/<influence_id>/influence-details.json`
- `<out>/influences/<influence_id>/*.html`

By default this script is non-destructive: it writes to `docs/content/`.

Usage:
  python3 scripts/convert_people_to_static.py
    python3 scripts/convert_people_to_static.py --out docs/people

Notes:
- The generated HTML files are fragments (no <html>/<head>), suitable for injecting.
- JSX is converted with simple heuristics (className->class, style={{...}} -> style="...").
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


REPLACEMENT_CHAR = "\ufffd"  # U+FFFD replacement char; should not appear in output.


def _normalize_text(s: str) -> str:
    """Fix common legacy mojibake in a conservative way.

    Many legacy files have already been decoded with errors, leaving U+FFFD (�)
    where a right apostrophe should be (e.g., "Benjamin�s"). We only rewrite
    U+FFFD when it is *between word characters* to avoid incorrectly changing
    opening/closing quote marks.
    """

    if not s:
        return s
    return re.sub(r"(?<=\w)\ufffd(?=\w)", "’", s)


def _normalize_obj(obj: Any) -> Any:
    if isinstance(obj, str):
        return _normalize_text(obj)
    if isinstance(obj, list):
        return [_normalize_obj(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _normalize_obj(v) for k, v in obj.items()}
    return obj


@dataclass(frozen=True)
class AnalysisBlock:
    analysis_id: str
    html: str
    source_path: str


def _read_text(path: Path) -> str:
    """Read text from legacy sources without introducing U+FFFD.

    Some files in `old/` are Windows-1252 encoded. Decoding them as UTF-8 with
    `errors="replace"` produces the replacement character (�), which then leaks
    into generated JSON/HTML. We instead:
    1) Try strict UTF-8
    2) Fall back to Windows-1252
    """

    data = path.read_bytes()
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("cp1252")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def _kebab_case(name: str) -> str:
    # marginLeft -> margin-left
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", name).lower()


def _convert_style_object(style_obj: str) -> str:
    """Convert a simple JSX style object into inline CSS.

    Example:
      marginLeft: '5%', fontSize: '70%'
    ->
      margin-left: 5%; font-size: 70%;
    """

    parts: List[str] = []
    # Very small parser: split by commas not inside quotes.
    tokens = re.split(r",(?![^'\"]*['\"])\s*", style_obj.strip())
    for token in tokens:
        token = token.strip()
        if not token:
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+?)\s*$", token)
        if not m:
            continue
        key, raw_val = m.group(1), m.group(2)
        raw_val = raw_val.strip()
        # Strip wrapping quotes if present
        if (raw_val.startswith("'") and raw_val.endswith("'")) or (
            raw_val.startswith('"') and raw_val.endswith('"')
        ):
            raw_val = raw_val[1:-1]
        parts.append(f"{_kebab_case(key)}: {raw_val};")
    return " ".join(parts)


def _jsx_to_html(fragment: str) -> str:
    """Best-effort JSX->HTML conversion for this repo's analysis blocks."""

    out = fragment

    out = _normalize_text(out)

    # className -> class
    out = re.sub(r"\bclassName=", "class=", out)

    # style={{ ... }} -> style="..."
    def _style_repl(m: re.Match[str]) -> str:
        css = _convert_style_object(m.group(1))
        return f'style="{css}"'

    out = re.sub(r"style=\{\{([^}]*)\}\}", _style_repl, out)

    # src={require("...")} -> src="..." (keep path literal)
    out = re.sub(r"src=\{require\((['\"])(.*?)\1\)\}", r'src="\2"', out)

    # Remove JSX comments: {/* ... */}
    out = re.sub(r"\{\/\*.*?\*\/\}", "", out, flags=re.DOTALL)

    # Remove common empty JSX braces
    out = out.replace("{' '}", " ")

    # Self-closing br => HTML br
    out = out.replace("<br/>", "<br>")

    # In these fragments, we want plain HTML; strip trailing semicolons after JSX returns if any.
    out = out.strip()

    return out


def _extract_returned_div(htmlish: str) -> str:
    """Given content starting at `return <div...`, return the full <div>...</div> block.

    Uses a <div> nesting counter; good enough for this codebase.
    """

    start = htmlish.find("<div")
    if start == -1:
        return htmlish.strip()

    tag_re = re.compile(r"</?div\b", re.IGNORECASE)
    count = 0
    end = None
    for m in tag_re.finditer(htmlish, start):
        token = m.group(0).lower()
        if token.startswith("</"):
            count -= 1
            if count == 0:
                # find closing '>' then include it
                close_gt = htmlish.find(">", m.start())
                if close_gt != -1:
                    end = close_gt + 1
                else:
                    end = m.end()
                break
        else:
            count += 1

    if end is None:
        return htmlish[start:].strip()

    return htmlish[start:end].strip()


def parse_analysis_file(path: Path) -> List[AnalysisBlock]:
    text = _read_text(path)
    blocks: List[AnalysisBlock] = []

    occurrences: Dict[str, int] = {}

    # Find `if (id === "...") {` and `else if (id === "...") {` occurrences.
    # Some files use single quotes; accept both.
    for m in re.finditer(r"(?:else\s+)?if\s*\(\s*id\s*===\s*(['\"])([^'\"]+)\1\s*\)", text):
        base_id = m.group(2)
        occurrences[base_id] = occurrences.get(base_id, 0) + 1
        analysis_id = base_id if occurrences[base_id] == 1 else f"{base_id}{occurrences[base_id]}"
        after = text[m.end() :]
        ret_pos = after.find("return")
        if ret_pos == -1:
            continue
        after_return = after[ret_pos:]
        # Capture from first '<div' through balanced '</div>'
        div_block = _extract_returned_div(after_return)
        html = _jsx_to_html(div_block)
        blocks.append(AnalysisBlock(analysis_id=analysis_id, html=html, source_path=str(path)))

    return blocks


def _load_json_speaker(path: Path) -> Dict[str, Any]:
    data = json.loads(_read_text(path))
    if isinstance(data, dict) and "speakers" in data and isinstance(data["speakers"], list) and data["speakers"]:
        sp = data["speakers"][0]
        return _normalize_obj(sp)
    # Some json files are already a single speaker object.
    if isinstance(data, dict):
        return _normalize_obj(data)
    raise ValueError(f"Unexpected JSON structure: {path}")


def _analysis_keys(speaker: Dict[str, Any]) -> List[Tuple[int, str, str]]:
    """Return sorted list of (n, fact, analysis_id) pairs."""

    pairs: List[Tuple[int, str, str]] = []
    for key, value in speaker.items():
        m = re.match(r"analysis_(\d+)$", str(key))
        if not m:
            continue
        n = int(m.group(1))
        analysis_id = str(value or "").strip()
        if not analysis_id:
            continue
        fact = str(speaker.get(f"fact_{n}", "") or "").strip()
        pairs.append((n, fact, analysis_id))
    pairs.sort(key=lambda t: t[0])
    return pairs


def _pick_person_id(entries: List[Dict[str, Any]]) -> str:
    # Prefer the entry that looks like the actual person bio:
    # highest word_count, and has a year or description.
    def score(e: Dict[str, Any]) -> Tuple[int, int, int]:
        wc = e.get("word_count")
        wc_i = wc if isinstance(wc, int) else 0
        has_year = 1 if str(e.get("year", "") or "").strip() else 0
        has_desc = 1 if str(e.get("description", "") or "").strip() else 0
        return (has_year + has_desc, wc_i, len(str(e.get("name", ""))))

    best = max(entries, key=score)
    person_id = str(best.get("link") or "").strip()
    if not person_id:
        # Fallback: slugify name
        name = str(best.get("name") or "person").strip().lower()
        person_id = re.sub(r"[^a-z0-9]+", "-", name).strip("-") or "person"
    return person_id


def build_person_details(
    person_id: str,
    tier: str,
    group_label: str,
    json_entries: List[Tuple[Path, Dict[str, Any]]],
    analysis_map: Dict[str, AnalysisBlock],
    out_dir: Path,
) -> Dict[str, Any]:
    # Sort entries by: bio-ish first (word_count desc), then title.
    def entry_sort(item: Tuple[Path, Dict[str, Any]]) -> Tuple[int, int, str]:
        _, sp = item
        wc = sp.get("word_count")
        wc_i = wc if isinstance(wc, int) else 0
        is_bio = 1 if (wc_i > 0 and str(sp.get("year", "") or "").strip()) else 0
        return (-is_bio, -wc_i, str(sp.get("name", "")))

    entries_sorted = sorted(json_entries, key=entry_sort)

    pages: List[Dict[str, Any]] = []
    html_files_written: Dict[str, str] = {}

    for json_path, sp in entries_sorted:
        slug = str(sp.get("link") or "").strip()
        title = str(sp.get("name") or "").strip()

        sections: List[Dict[str, Any]] = []
        for n, heading, analysis_id in _analysis_keys(sp):
            html_filename = f"{analysis_id}.html"
            html_rel = f"./{html_filename}"
            sections.append(
                {
                    "order": n,
                    "heading": heading,
                    "analysis_id": analysis_id,
                    "html": html_rel,
                }
            )

            if analysis_id in analysis_map and analysis_id not in html_files_written:
                _write_text(out_dir / html_filename, analysis_map[analysis_id].html + "\n")
                html_files_written[analysis_id] = html_rel

        pages.append(
            {
                "slug": slug,
                "title": title,
                "year": str(sp.get("year") or "").strip(),
                "word_count": sp.get("word_count") if isinstance(sp.get("word_count"), int) else 0,
                "description": str(sp.get("description") or "").strip().replace(REPLACEMENT_CHAR, "’"),
                "image": str(sp.get("img") or "").strip(),
                "sections": sections,
                "source": {
                    "json": (
                        json_path.resolve().relative_to(Path(__file__).resolve().parents[1]).as_posix()
                        if json_path.resolve().is_relative_to(Path(__file__).resolve().parents[1])
                        else os.path.relpath(json_path, start=Path.cwd())
                    ),
                },
            }
        )

    # Derive person display fields from the most bio-like page.
    bio_like = max(pages, key=lambda p: (1 if p["year"] else 0, p["word_count"], len(p["description"])))

    return {
        "person_id": person_id,
        "tier": tier,
        "group": group_label,
        "display_name": bio_like["title"],
        "year": bio_like["year"],
        "word_count": bio_like["word_count"],
        "image": bio_like["image"],
        "description": bio_like["description"],
        "pages": pages,
    }


def build_item_details(
    *,
    item_id: str,
    category: str,
    group_label: str,
    json_entries: List[Tuple[Path, Dict[str, Any]]],
    analysis_map: Dict[str, AnalysisBlock],
    out_dir: Path,
) -> Dict[str, Any]:
    # Concepts/Influences don't have major/minor tiers; still keep the old folder anchor for traceability.

    entries_sorted = sorted(
        json_entries,
        key=lambda it: (
            -(
                it[1].get("word_count")
                if isinstance(it[1].get("word_count"), int)
                else 0
            ),
            str(it[1].get("name", "")),
        ),
    )

    pages: List[Dict[str, Any]] = []
    html_files_written: Dict[str, str] = {}

    for json_path, sp in entries_sorted:
        slug = str(sp.get("link") or "").strip() or json_path.stem
        title = str(sp.get("name") or "").strip() or slug

        sections: List[Dict[str, Any]] = []
        for n, heading, analysis_id in _analysis_keys(sp):
            html_filename = f"{analysis_id}.html"
            html_rel = f"./{html_filename}"
            sections.append(
                {
                    "order": n,
                    "heading": heading,
                    "analysis_id": analysis_id,
                    "html": html_rel,
                }
            )

            if analysis_id in analysis_map and analysis_id not in html_files_written:
                _write_text(out_dir / html_filename, analysis_map[analysis_id].html + "\n")
                html_files_written[analysis_id] = html_rel

        pages.append(
            {
                "slug": slug,
                "title": title,
                "year": str(sp.get("year") or "").strip(),
                "word_count": sp.get("word_count") if isinstance(sp.get("word_count"), int) else 0,
                "description": str(sp.get("description") or "").strip().replace(REPLACEMENT_CHAR, "’"),
                "image": str(sp.get("img") or "").strip(),
                "sections": sections,
                "source": {
                    "json": (
                        json_path.resolve().relative_to(Path(__file__).resolve().parents[1]).as_posix()
                        if json_path.resolve().is_relative_to(Path(__file__).resolve().parents[1])
                        else os.path.relpath(json_path, start=Path.cwd())
                    ),
                },
            }
        )

    # Prefer a page with a non-empty description as the main display.
    primary = max(pages, key=lambda p: (len(p["description"]), p["word_count"], len(p["title"])))

    return {
        "item_id": item_id,
        "category": category,
        "group": group_label,
        "display_name": primary["title"],
        "year": primary["year"],
        "word_count": primary["word_count"],
        "image": primary["image"],
        "description": primary["description"],
        "pages": pages,
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Convert people JSX+JSON into static per-person folders")
    parser.add_argument("--in", dest="in_dir", default="docs/people", help="Input people dir (default: docs/people)")
    parser.add_argument("--out", dest="out_dir", default="docs/content", help="Output dir (default: docs/content)")
    parser.add_argument(
        "--include",
        choices=["speakers", "all"],
        default="all",
        help="What to convert (default: all: speakers+concepts+influences)",
    )

    args = parser.parse_args(argv)

    in_dir = Path(args.in_dir).resolve()
    out_root = Path(args.out_dir).resolve()

    speaker_roots = [in_dir / "Major speakers", in_dir / "Minor speakers"]
    concept_root = in_dir / "Concepts"
    influence_root = in_dir / "Influences"

    parse_roots = list(speaker_roots)
    if args.include == "all":
        parse_roots += [concept_root, influence_root]

    # Parse all analysis blocks first (id -> html fragment)
    analysis_map: Dict[str, AnalysisBlock] = {}
    for root in parse_roots:
        if not root.exists():
            continue
        for js_path in root.rglob("*-analysis.js"):
            for block in parse_analysis_file(js_path):
                # Keep first occurrence; ids should be unique.
                analysis_map.setdefault(block.analysis_id, block)

    # Group speaker json entries by "person" anchor.
    # Anchor = first folder component under Major/Minor speakers.
    people_groups: Dict[Tuple[str, str], List[Tuple[Path, Dict[str, Any]]]] = {}
    for root in speaker_roots[:2]:  # only Major/Minor for grouping
        if not root.exists():
            continue
        tier = "major" if root.name.lower().startswith("major") else "minor"
        for json_path in root.rglob("*.json"):
            try:
                sp = _load_json_speaker(json_path)
            except Exception:
                continue

            rel = json_path.relative_to(root)
            anchor = rel.parts[0] if len(rel.parts) > 1 else json_path.stem
            people_groups.setdefault((tier, anchor), []).append((json_path, sp))

    # Group concept and influence json entries by their first folder component.
    item_groups: Dict[Tuple[str, str], List[Tuple[Path, Dict[str, Any]]]] = {}
    if args.include == "all":
        for root, category in [(concept_root, "concepts"), (influence_root, "influences")]:
            if not root.exists():
                continue
            for json_path in root.rglob("*.json"):
                try:
                    sp = _load_json_speaker(json_path)
                except Exception:
                    continue
                rel = json_path.relative_to(root)
                anchor = rel.parts[0] if len(rel.parts) > 1 else json_path.stem
                item_groups.setdefault((category, anchor), []).append((json_path, sp))

    written_people = 0
    missing_html: List[str] = []

    # Write speakers under <out>/people
    people_root_out = out_root / "people"
    for (tier, anchor), entries in sorted(people_groups.items(), key=lambda kv: kv[0]):
        # Determine person id by picking the most bio-like entry.
        person_id = _pick_person_id([sp for _, sp in entries])
        out_dir = people_root_out / person_id
        out_dir.mkdir(parents=True, exist_ok=True)

        details = build_person_details(
            person_id=person_id,
            tier=tier,
            group_label=anchor,
            json_entries=entries,
            analysis_map=analysis_map,
            out_dir=out_dir,
        )

        # Track missing HTML for analysis ids referenced by JSON but not found in parsed JSX.
        for page in details["pages"]:
            for section in page["sections"]:
                aid = section["analysis_id"]
                if aid not in analysis_map:
                    missing_html.append(f"{person_id}:{aid}")

        _write_text(out_dir / "person-details.json", json.dumps(details, indent=2, ensure_ascii=False) + "\n")
        written_people += 1

    written_items = 0
    if args.include == "all":
        for (category, anchor), entries in sorted(item_groups.items(), key=lambda kv: kv[0]):
            item_id = _pick_person_id([sp for _, sp in entries])
            out_dir = out_root / category / item_id
            out_dir.mkdir(parents=True, exist_ok=True)

            details = build_item_details(
                item_id=item_id,
                category=category,
                group_label=anchor,
                json_entries=entries,
                analysis_map=analysis_map,
                out_dir=out_dir,
            )

            for page in details["pages"]:
                for section in page["sections"]:
                    aid = section["analysis_id"]
                    if aid not in analysis_map:
                        missing_html.append(f"{category}/{item_id}:{aid}")

            details_filename = {
                "concepts": "concept-details.json",
                "influences": "influence-details.json",
            }.get(category, "details.json")
            _write_text(out_dir / details_filename, json.dumps(details, indent=2, ensure_ascii=False) + "\n")
            written_items += 1

    if args.include == "all":
        print(f"Wrote {written_people} people and {written_items} items to: {out_root}")
    else:
        print(f"Wrote {written_people} people to: {out_root}")
    if missing_html:
        # De-dupe and show a small sample to avoid noisy output.
        missing_unique = sorted(set(missing_html))
        print(f"WARNING: {len(missing_unique)} analysis ids referenced in JSON but not found in *-analysis.js")
        for item in missing_unique[:25]:
            print(f"  missing: {item}")
        if len(missing_unique) > 25:
            print("  …")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
