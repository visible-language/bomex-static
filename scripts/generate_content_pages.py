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
    year: str
    word_count: int
    description: str
    image: str
    sections: List[Section]


@dataclass(frozen=True)
class Item:
    kind: str  # people|concepts|influences
    item_id: str
    display_name: str
    year: str
    word_count: int
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
    fragment = path.read_text(encoding="utf-8")
    return _ensure_content_table_class(fragment)


def _ensure_content_table_class(fragment: str) -> str:
    if not fragment:
        return fragment

    def _repl(match: re.Match[str]) -> str:
        attrs = match.group(1) or ""
        class_match = re.search(r"\bclass\s*=\s*(['\"])(.*?)\1", attrs, flags=re.IGNORECASE)
        if class_match:
            existing = class_match.group(2)
            if re.search(r"(?:^|\s)content-table(?:\s|$)", existing):
                return f"<table{attrs}>"
            new_classes = f"{existing} content-table"
            new_attrs = attrs[: class_match.start()] + f' class="{new_classes}"' + attrs[class_match.end() :]
            return f"<table{new_attrs}>"
        return f"<table class=\"content-table\"{attrs}>"

    return re.sub(r"<table([^>]*)>", _repl, fragment, flags=re.IGNORECASE)


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
    year = str(data.get("year") or "")
    word_count = data.get("word_count") if isinstance(data.get("word_count"), int) else 0
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
            pyr = str(p.get("year") or "")
            pwc = p.get("word_count") if isinstance(p.get("word_count"), int) else 0
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

            pages.append(
                Page(slug=slug, title=title, year=pyr, word_count=pwc, description=pdesc, image=pimg, sections=sections)
            )

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
        year=year,
        word_count=word_count,
        description=description,
        image=image,
        pages=pages,
        details_path=details_path,
    )


def _internal_href(href: str) -> str:
    # Keep links relative to docs/ root.
    return href


def _starts_with_did_you_know(text: str) -> bool:
    return bool(re.match(r"^\s*Did you know\b", text.strip(), flags=re.IGNORECASE))


def _is_chronology_section(heading: str, fragment: str) -> bool:
    if re.search(r"\bchronology\b", heading or "", flags=re.IGNORECASE):
        return True

    chrono_re = re.compile(
        r"(?:^|<p[^>]*>\s*|<br\s*/?>\s*|<strong>\s*|<b>\s*)\s*(?:circa\s+)?"
        r"(?:\d{1,4}\s*(?:B\.?C\.?|A\.?D\.?)|(?:B\.?C\.?|A\.?D\.?)\s*\d{1,4})",
        flags=re.IGNORECASE,
    )
    return bool(chrono_re.search(fragment or ""))


def _format_year_line(year: str) -> str:
    yr = (year or "").strip()
    if not yr:
        return ""
    if re.search(r"\bcirca\b", yr, flags=re.IGNORECASE):
        return yr
    return f"Circa {yr}"


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


def _list_index(kind: str, title: str, subtitle: str, items: List[Item], *, enable_search: bool = False) -> str:
    rows = []
    for it in items:
        href = _internal_href(f"{_safe_filename(it.item_id)}.html")
        name_key = (it.display_name or "").lower()
        rows.append(
            "<a class=\"list-row\" href=\""
            + href
            + f"\" data-name=\"{html.escape(name_key)}\">"
            + f"<span>{html.escape(it.display_name)}</span>"
            + "<i class=\"fas fa-chevron-right\"></i>"
            + "</a>"
        )

    search_html = ""
    list_id = f"{kind}-list"
    if enable_search:
        search_html = (
            f"  <div class=\"input-wrapper {kind}-search\">\n"
            f"    <input id=\"{kind}-search\" type=\"text\" class=\"text-input\" placeholder=\"Search {kind[:-1]}\">\n"
            "    <button class=\"search-icon-btn\" type=\"button\"><i class=\"fas fa-search\"></i></button>\n"
            "  </div>\n"
        )

    return (
        _hero(kind, title, subtitle)
        + "\n<section class=\"page-content page-content--wide\">\n"
        + search_html
        + f"  <div id=\"{list_id}\" class=\"list\">\n"
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

    chronology_blocks: List[str] = []
    panels: List[Tuple[str, str]] = []
    for page in item.pages:
        inner: List[str] = []
        page_desc = str(page.description or "").strip()
        if (
            page_desc
            and page_desc != str(item.description or "").strip()
            and not _starts_with_did_you_know(page_desc)
        ):
            inner.append(f"<p>{html.escape(page_desc)}</p>")
        for sec in page.sections:
            fragment = _load_fragment(sec.html_fragment_path)

            if _is_chronology_section(sec.heading, fragment):
                if fragment:
                    chronology_blocks.append(fragment)
                continue

            if sec.heading.strip() and not _starts_with_did_you_know(sec.heading):
                inner.append(
                    f"<p class=\"analysis-intro\"><em>{html.escape(sec.heading.strip())}</em></p>"
                )
            if fragment:
                inner.append(fragment)

        page_title = (page.title or "Details").strip() or "Details"
        if page_title.strip().lower() == str(item.display_name or "").strip().lower():
            page_title = "Insights into words and phrases"
        panels.append((page_title, "".join(inner)))

    brief = str(item.description or "").strip()
    year_line = _format_year_line(item.year)
    brief_parts: List[str] = []
    if year_line:
        brief_parts.append(f"  <p><em>{html.escape(year_line)}</em></p>\n")
    if brief and not _starts_with_did_you_know(brief):
        brief_parts.append("  <h2>Brief biography</h2>\n")
        brief_parts.append(f"  <p>{html.escape(brief)}</p>\n")
    if isinstance(item.word_count, int) and item.word_count > 0:
        brief_parts.append(f"  <p>Total recorded words -- {item.word_count}</p>\n")
    brief_html = "".join(brief_parts)

    if chronology_blocks:
        panels.append(("Chronology", "".join(chronology_blocks)))

    if len(panels) == 1:
        accordion_html = panels[0][1]
    else:
        accordion_html = "".join(
            "<details class=\"accordion\">"
            "<summary>"
            f"<span>{html.escape(title)}</span>"
            "<i class=\"fas fa-chevron-down\"></i>"
            "</summary>"
            f"<div class=\"accordion-body\">{body}</div>"
            "</details>"
            for title, body in panels
        )

    return (
        f"<section class=\"detail-hero\"{hero_style}><div class=\"detail-hero-title\"><h1>{name}</h1></div></section>\n"
        "<section class=\"page-content\">\n"
        "  <div class=\"detail-actions\"><a class=\"back-link\" href=\"index.html\" aria-label=\"Back to people\" title=\"Back to people\"><i class=\"fas fa-arrow-left\"></i></a></div>\n"
        + brief_html
        + accordion_html
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

    # Render one accordion per page (sub-JSON), for both concepts and influences.
    panels: List[Tuple[str, str]] = []
    for page in item.pages:
        inner: List[str] = []
        for sec in page.sections:
            if sec.heading.strip():
                inner.append(f"<h3 class=\"subheading\">{html.escape(sec.heading.strip())}</h3>")
            inner.append(_load_fragment(sec.html_fragment_path))
        panels.append((page.title or "Details", "".join(inner)))

    if len(panels) == 1:
        body.append(panels[0][1])
    else:
        for title, inner_html in panels:
            body.append(
                "<details class=\"accordion\">"
                "<summary>"
                f"<span>{html.escape(title)}</span>"
                "<i class=\"fas fa-chevron-down\"></i>"
                "</summary>"
                f"<div class=\"accordion-body\">{inner_html}</div>"
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
                enable_search=True,
            ),
            scripts_html=_list_search_script("influences"),
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
                enable_search=True,
            ),
            scripts_html=_list_search_script("concepts"),
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


def _list_search_script(kind: str) -> str:
    input_id = f"{kind}-search"
    list_id = f"{kind}-list"
    return (
        "<script>\n"
        "(function(){\n"
        f"  var input = document.getElementById('{input_id}');\n"
        f"  var list = document.getElementById('{list_id}');\n"
        "  if(!input || !list) return;\n"
        "  input.addEventListener('input', function(){\n"
        "    var q = (input.value || '').toLowerCase().trim();\n"
        "    var rows = list.querySelectorAll('.list-row');\n"
        "    for (var i=0;i<rows.length;i++){\n"
        "      var name = rows[i].getAttribute('data-name') || '';\n"
        "      rows[i].style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';\n"
        "    }\n"
        "  });\n"
        "})();\n"
        "</script>"
    )


if __name__ == "__main__":
    raise SystemExit(main())
