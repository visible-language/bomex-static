#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = REPO_ROOT / "docs"


@dataclass(frozen=True)
class Section:
    heading: str
    html_fragment_path: Path


@dataclass(frozen=True)
class Page:
    slug: str
    title: str
    description: str
    image: str
    sections: List[Section]


@dataclass(frozen=True)
class Item:
    kind: str  # people|concepts|influences
    item_id: str
    display_name: str
    description: str
    image: str
    pages: List[Page]
    details_path: Path


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _safe_filename(s: str) -> str:
    # ids in this repo are already slug-like, but keep it defensive.
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9-]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "item"


def _doc(title: str, body_html: str, scripts_html: str = "", *, asset_prefix: str, root_prefix: str) -> str:
    return (
        "<!DOCTYPE html>\n"
        f"<html lang=\"en\" data-root=\"{html.escape(root_prefix)}\">\n"
        "<head>\n"
        "  <meta charset=\"UTF-8\">\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        f"  <title>{html.escape(title)}</title>\n"
        f"  <link rel=\"icon\" href=\"{html.escape(asset_prefix)}favicon.ico\">\n"
        f"  <link rel=\"stylesheet\" href=\"{html.escape(asset_prefix)}css/main.css\">\n"
        "  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">\n"
        "</head>\n"
        "<body>\n"
        "  <!-- GENERATED FILE: re-run scripts/generate_content_pages.py -->\n"
        "  <header></header>\n"
        f"  {body_html}\n"
        "  <footer></footer>\n"
        f"  <script src=\"{html.escape(asset_prefix)}js/main.js\"></script>\n"
        f"  {scripts_html}\n"
        "</body>\n"
        "</html>\n"
    )


def _load_fragment(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _resolve_asset_ref(details_path: Path, output_dir: Path, ref: str) -> str:
    """Resolve an asset path stored in details JSON into a link relative to the output HTML.

    Details JSONs store local assets as './main.jpg' (relative to the details folder).
    Generated HTML pages live in docs/{people,concepts,influences}/, so we must rewrite these to e.g.
    '../content/people/<id>/main.jpg'.
    """

    ref = (ref or "").strip()
    if not ref:
        return ""
    if ref.startswith("http://") or ref.startswith("https://"):
        return ref

    # If already rooted at docs/ (e.g., 'img/...', 'content/...'), translate to a relative path.
    for prefix in ("content/", "img/", "css/", "js/"):
        if ref.startswith(prefix):
            # output_dir is typically docs/{people,concepts,influences}/
            abs_target = (output_dir.parent / ref).resolve()
            rel = os.path.relpath(abs_target, output_dir.resolve())
            return rel.replace(os.sep, "/")

    # Treat as relative to details folder.
    if ref.startswith("./"):
        ref = ref[2:]
    abs_target = (details_path.parent / ref).resolve()
    rel = os.path.relpath(abs_target, output_dir.resolve())
    return rel.replace(os.sep, "/")


def _iter_details(kind: str, root: Path) -> Iterable[Path]:
    if kind == "people":
        yield from sorted(root.glob("*/person-details.json"))
    elif kind == "concepts":
        yield from sorted(root.glob("*/concept-details.json"))
    elif kind == "influences":
        yield from sorted(root.glob("*/influence-details.json"))
    else:
        return


def _parse_item(kind: str, details_path: Path) -> Item:
    data = _read_json(details_path)

    item_id = str(data.get("person_id") or data.get("item_id") or details_path.parent.name)
    display_name = str(data.get("display_name") or item_id)
    description = str(data.get("description") or "")
    image = str(data.get("image") or "")

    pages: List[Page] = []
    raw_pages = data.get("pages")
    if isinstance(raw_pages, list):
        for p in raw_pages:
            if not isinstance(p, dict):
                continue
            slug = str(p.get("slug") or "")
            title = str(p.get("title") or display_name)
            pdesc = str(p.get("description") or "")
            pimg = str(p.get("image") or image)

            sections: List[Section] = []
            raw_sections = p.get("sections")
            if isinstance(raw_sections, list):
                for s in raw_sections:
                    if not isinstance(s, dict):
                        continue
                    heading = str(s.get("heading") or "")
                    html_rel = str(s.get("html") or "")
                    if not html_rel:
                        continue
                    frag_path = (details_path.parent / html_rel).resolve()
                    sections.append(Section(heading=heading, html_fragment_path=frag_path))

            pages.append(Page(slug=slug, title=title, description=pdesc, image=pimg, sections=sections))

    # People pages tend to use first page description/image.
    if pages:
        if not description:
            description = pages[0].description
        if not image:
            image = pages[0].image

    return Item(
        kind=kind,
        item_id=item_id,
        display_name=display_name,
        description=description,
        image=image,
        pages=pages,
        details_path=details_path,
    )


def _internal_href(href: str) -> str:
    # Keep links relative to docs/ root.
    return href


def _hero(kind: str, title: str, subtitle: str) -> str:
    # For index pages: image first, then title/subtitle on white.
    hero_class = {
        "people": "page-hero page-hero--people",
        "influences": "page-hero page-hero--influences",
        "concepts": "page-hero page-hero--concepts",
    }[kind]

    return (
        f"<section class=\"{hero_class}\"></section>\n"
        "<section class=\"page-content page-content--wide\">\n"
        f"  <h1 class=\"content-title\">{html.escape(title)}</h1>\n"
        f"  <p class=\"content-subtitle\">{html.escape(subtitle)}</p>\n"
        "</section>"
    )


def _people_index(items: List[Item], *, output_dir: Path) -> str:
    cards = []
    for it in items:
        img_src_raw = _resolve_asset_ref(it.details_path, output_dir, it.image)
        img_src = html.escape(img_src_raw) if img_src_raw else ""
        name = html.escape(it.display_name)
        name_key = (it.display_name or "").lower()
        href = _internal_href(f"{_safe_filename(it.item_id)}.html")
        cards.append(
            "<a class=\"person-card\" href=\""
            + href
            + f"\" data-name=\"{html.escape(name_key)}\">"
            + (f"<img class=\"person-thumb\" src=\"{img_src}\" alt=\"{name}\">" if img_src else "<div class=\"person-thumb person-thumb--empty\"></div>")
            + f"<div class=\"person-name\">{name}</div>"
            + "</a>"
        )

    return (
        _hero(
            "people",
            "People",
            "Insights into the Messages of the Book of Mormon",
        )
        + "\n<section class=\"page-content page-content--wide\">\n"
        "  <div class=\"input-wrapper people-search\">\n"
        "    <input id=\"people-search\" type=\"text\" class=\"text-input\" placeholder=\"Search a person\">\n"
        "    <button class=\"search-icon-btn\" type=\"button\"><i class=\"fas fa-search\"></i></button>\n"
        "  </div>\n"
        "  <div id=\"people-grid\" class=\"people-grid\">\n"
        + "\n".join(cards)
        + "\n  </div>\n"
        "</section>\n"
    )


def _list_index(kind: str, title: str, subtitle: str, items: List[Item]) -> str:
    rows = []
    for it in items:
        href = _internal_href(f"{_safe_filename(it.item_id)}.html")
        rows.append(
            "<a class=\"list-row\" href=\""
            + href
            + "\">"
            + f"<span>{html.escape(it.display_name)}</span>"
            + "<i class=\"fas fa-chevron-right\"></i>"
            + "</a>"
        )

    return (
        _hero(kind, title, subtitle)
        + "\n<section class=\"page-content page-content--wide\">\n"
        "  <div class=\"list\">\n"
        + "\n".join(rows)
        + "\n  </div>\n"
        "</section>\n"
    )


def _person_detail(item: Item, *, output_dir: Path) -> str:
    name = html.escape(item.display_name)
    hero_style = ""
    # People detail pages live in docs/people/
    img_ref = _resolve_asset_ref(item.details_path, output_dir, item.image)
    if img_ref:
        hero_style = f" style=\"background-image: url('{html.escape(img_ref)}')\""

    # Prefer first page sections.
    sections = item.pages[0].sections if item.pages else []
    accordion = []
    for sec in sections:
        heading = sec.heading.strip() or "Details"
        frag = _load_fragment(sec.html_fragment_path)
        accordion.append(
            "<details class=\"accordion\">"
            "<summary>"
            f"<span>{html.escape(heading)}</span>"
            "<i class=\"fas fa-chevron-down\"></i>"
            "</summary>"
            f"<div class=\"accordion-body\">{frag}</div>"
            "</details>"
        )

    return (
        f"<section class=\"detail-hero\"{hero_style}><div class=\"detail-hero-title\"><h1>{name}</h1></div></section>\n"
        "<section class=\"page-content\">\n"
        "  <h2>Brief Biography</h2>\n"
        f"  <p>{html.escape(item.description)}</p>\n"
        "  <h2>Insights into the Words and Phrases</h2>\n"
        + "\n".join(accordion)
        + "\n</section>\n"
    )


def _concept_or_influence_detail(kind: str, item: Item) -> str:
    title = html.escape(item.display_name)
    # Use a generic hero (same as index) since concepts/influences don't always have per-item art.
    hero = f"<section class=\"page-hero page-hero--{kind}\"></section>\n"

    body = [
        hero,
        "<section class=\"page-content\">",
        f"  <h1 class=\"content-title\">{title}</h1>",
    ]

    if item.description.strip():
        body.append(f"  <p class=\"content-subtitle\">{html.escape(item.description.strip())}</p>")

    # Concepts: render expanded; Influences: group pages into accordions.
    if kind == "concepts":
        for page in item.pages:
            if len(item.pages) > 1:
                body.append(f"  <h2>{html.escape(page.title)}</h2>")
            for sec in page.sections:
                if sec.heading.strip():
                    body.append(f"  <h3 class=\"subheading\">{html.escape(sec.heading.strip())}</h3>")
                body.append(_load_fragment(sec.html_fragment_path))
    else:
        for page in item.pages:
            inner = []
            for sec in page.sections:
                if sec.heading.strip():
                    inner.append(f"<h3 class=\"subheading\">{html.escape(sec.heading.strip())}</h3>")
                inner.append(_load_fragment(sec.html_fragment_path))
            body.append(
                "<details class=\"accordion\">"
                "<summary>"
                f"<span>{html.escape(page.title)}</span>"
                "<i class=\"fas fa-chevron-down\"></i>"
                "</summary>"
                f"<div class=\"accordion-body\">{''.join(inner)}</div>"
                "</details>"
            )

    body.append("</section>")
    return "\n".join(body) + "\n"


def _collect_items(kind: str, root: Path) -> List[Item]:
    items: List[Item] = []
    for details_path in _iter_details(kind, root):
        try:
            items.append(_parse_item(kind, details_path))
        except Exception:
            # Keep generator resilient: skip malformed entries.
            continue
    items.sort(key=lambda x: x.display_name.lower())
    return items


def _remove_generated(src_root: Path) -> None:
    patterns = [
        "people.html",
        "people-*.html",
        "concepts.html",
        "concept-*.html",
        "influences.html",
        "influence-*.html",
    ]
    for pat in patterns:
        for p in src_root.glob(pat):
            try:
                p.unlink()
            except Exception:
                pass


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generate People/Influences/Concepts index + detail pages from docs/content. "
            "Outputs HTML files into docs/people/, docs/concepts/, and docs/influences/."
        )
    )
    parser.add_argument(
        "--src-root",
        default=str(SRC_ROOT),
        help="Path to docs/ (default: <repo>/docs)",
    )
    parser.add_argument(
        "--data-root",
        default=str(SRC_ROOT / "content"),
        help="Path to docs/content (default: <repo>/docs/content)",
    )
    args = parser.parse_args(argv)

    src_root = Path(args.src_root).resolve()
    data_root = Path(args.data_root).resolve()

    people_root = data_root / "people"
    concepts_root = data_root / "concepts"
    influences_root = data_root / "influences"

    _remove_generated(src_root)

    # Clear subdir outputs to avoid stale pages.
    for out_subdir in ("people", "concepts", "influences"):
        out_dir = src_root / out_subdir
        out_dir.mkdir(parents=True, exist_ok=True)
        for p in out_dir.glob("*.html"):
            try:
                p.unlink()
            except Exception:
                pass

    people = _collect_items("people", people_root)
    concepts = _collect_items("concepts", concepts_root)
    influences = _collect_items("influences", influences_root)

    # Index pages
    _write_text(
        src_root / "people" / "index.html",
        _doc(
            "People",
            _people_index(people, output_dir=src_root / "people"),
            scripts_html=_people_search_script(),
            asset_prefix="../",
            root_prefix="../",
        ),
    )
    _write_text(
        src_root / "influences" / "index.html",
        _doc(
            "Influences",
            _list_index(
                "influences",
                "Influences",
                "Learn how the People in the Book of Mormon Influenced the Messages of Others",
                influences,
            ),
            asset_prefix="../",
            root_prefix="../",
        ),
    )
    _write_text(
        src_root / "concepts" / "index.html",
        _doc(
            "Concepts",
            _list_index(
                "concepts",
                "Concepts",
                "Explore key concepts and phrases in the Book of Mormon",
                concepts,
            ),
            asset_prefix="../",
            root_prefix="../",
        ),
    )

    # Detail pages
    for it in people:
        fname = f"{_safe_filename(it.item_id)}.html"
        _write_text(
            src_root / "people" / fname,
            _doc(it.display_name, _person_detail(it, output_dir=src_root / "people"), asset_prefix="../", root_prefix="../"),
        )

    for it in influences:
        fname = f"{_safe_filename(it.item_id)}.html"
        _write_text(
            src_root / "influences" / fname,
            _doc(it.display_name, _concept_or_influence_detail("influences", it), asset_prefix="../", root_prefix="../"),
        )

    for it in concepts:
        fname = f"{_safe_filename(it.item_id)}.html"
        _write_text(
            src_root / "concepts" / fname,
            _doc(it.display_name, _concept_or_influence_detail("concepts", it), asset_prefix="../", root_prefix="../"),
        )

    print(f"Wrote: people={len(people)} concepts={len(concepts)} influences={len(influences)}")
    return 0


def _people_search_script() -> str:
    # Minimal client-side filter (no external deps).
    return (
        "<script>\n"
        "(function(){\n"
        "  var input = document.getElementById('people-search');\n"
        "  var grid = document.getElementById('people-grid');\n"
        "  if(!input || !grid) return;\n"
        "  input.addEventListener('input', function(){\n"
        "    var q = (input.value || '').toLowerCase().trim();\n"
        "    var cards = grid.querySelectorAll('.person-card');\n"
        "    for (var i=0;i<cards.length;i++){\n"
        "      var name = cards[i].getAttribute('data-name') || '';\n"
        "      cards[i].style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';\n"
        "    }\n"
        "  });\n"
        "})();\n"
        "</script>"
    )


if __name__ == "__main__":
    raise SystemExit(main())
