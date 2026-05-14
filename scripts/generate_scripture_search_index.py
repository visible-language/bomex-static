#!/usr/bin/env python3

from __future__ import annotations

import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
DOCS_ROOT = REPO_ROOT / "docs"
OUTPUT_PATH = DOCS_ROOT / "js" / "scripture-search-index.js"

BOOKS: list[dict[str, Any]] = [
    {"id": "1-nephi", "display": "1 Nephi", "aliases": ["1 nephi", "1 ne", "1st nephi", "first nephi"]},
    {"id": "2-nephi", "display": "2 Nephi", "aliases": ["2 nephi", "2 ne", "2nd nephi", "second nephi"]},
    {"id": "jacob", "display": "Jacob", "aliases": ["jacob"]},
    {"id": "enos", "display": "Enos", "aliases": ["enos"]},
    {"id": "jarom", "display": "Jarom", "aliases": ["jarom"]},
    {"id": "omni", "display": "Omni", "aliases": ["omni"]},
    {"id": "words-of-mormon", "display": "Words of Mormon", "aliases": ["words of mormon", "w of m", "w-of-m"]},
    {"id": "mosiah", "display": "Mosiah", "aliases": ["mosiah"]},
    {"id": "alma", "display": "Alma", "aliases": ["alma"]},
    {"id": "helaman", "display": "Helaman", "aliases": ["helaman", "hel"]},
    {"id": "3-nephi", "display": "3 Nephi", "aliases": ["3 nephi", "3 ne", "3rd nephi", "third nephi"]},
    {"id": "4-nephi", "display": "4 Nephi", "aliases": ["4 nephi", "4 ne", "4th nephi", "fourth nephi"]},
    {"id": "mormon", "display": "Mormon", "aliases": ["mormon", "morm"]},
    {"id": "ether", "display": "Ether", "aliases": ["ether"]},
    {"id": "moroni", "display": "Moroni", "aliases": ["moroni", "moro"]},
    {"id": "dc", "display": "Doctrine and Covenants", "aliases": ["d&c", "dc", "doctrine and covenants"]},
    {"id": "official-declaration", "display": "Official Declaration", "aliases": ["official declaration", "od"]},
    {"id": "moses", "display": "Moses", "aliases": ["moses"]},
    {"id": "abraham", "display": "Abraham", "aliases": ["abraham", "abr"]},
    {"id": "joseph-smith-matthew", "display": "Joseph Smith-Matthew", "aliases": ["joseph smith matthew", "js-m", "js m"]},
    {"id": "joseph-smith-history", "display": "Joseph Smith-History", "aliases": ["joseph smith history", "js-h", "js h"]},
    {"id": "articles-of-faith", "display": "Articles of Faith", "aliases": ["articles of faith", "a of f"]},
    {"id": "matthew", "display": "Matthew", "aliases": ["matthew", "matt"]},
    {"id": "mark", "display": "Mark", "aliases": ["mark"]},
    {"id": "luke", "display": "Luke", "aliases": ["luke"]},
    {"id": "john", "display": "John", "aliases": ["john"]},
    {"id": "acts", "display": "Acts", "aliases": ["acts"]},
    {"id": "romans", "display": "Romans", "aliases": ["romans", "rom"]},
    {"id": "1-corinthians", "display": "1 Corinthians", "aliases": ["1 corinthians", "1 cor"]},
    {"id": "2-corinthians", "display": "2 Corinthians", "aliases": ["2 corinthians", "2 cor"]},
    {"id": "galatians", "display": "Galatians", "aliases": ["galatians", "gal"]},
    {"id": "ephesians", "display": "Ephesians", "aliases": ["ephesians", "eph"]},
    {"id": "philippians", "display": "Philippians", "aliases": ["philippians", "philip", "phil"]},
    {"id": "colossians", "display": "Colossians", "aliases": ["colossians", "col"]},
    {"id": "1-thessalonians", "display": "1 Thessalonians", "aliases": ["1 thessalonians", "1 thes"]},
    {"id": "2-thessalonians", "display": "2 Thessalonians", "aliases": ["2 thessalonians", "2 thes"]},
    {"id": "1-timothy", "display": "1 Timothy", "aliases": ["1 timothy", "1 tim"]},
    {"id": "2-timothy", "display": "2 Timothy", "aliases": ["2 timothy", "2 tim"]},
    {"id": "titus", "display": "Titus", "aliases": ["titus"]},
    {"id": "philemon", "display": "Philemon", "aliases": ["philemon", "philem"]},
    {"id": "hebrews", "display": "Hebrews", "aliases": ["hebrews", "heb"]},
    {"id": "james", "display": "James", "aliases": ["james"]},
    {"id": "1-peter", "display": "1 Peter", "aliases": ["1 peter", "1 pet"]},
    {"id": "2-peter", "display": "2 Peter", "aliases": ["2 peter", "2 pet"]},
    {"id": "1-john", "display": "1 John", "aliases": ["1 john", "1 jn"]},
    {"id": "2-john", "display": "2 John", "aliases": ["2 john", "2 jn"]},
    {"id": "3-john", "display": "3 John", "aliases": ["3 john", "3 jn"]},
    {"id": "jude", "display": "Jude", "aliases": ["jude"]},
    {"id": "revelation", "display": "Revelation", "aliases": ["revelation", "rev"]},
    {"id": "genesis", "display": "Genesis", "aliases": ["genesis", "gen"]},
    {"id": "exodus", "display": "Exodus", "aliases": ["exodus", "ex"]},
    {"id": "leviticus", "display": "Leviticus", "aliases": ["leviticus", "lev"]},
    {"id": "numbers", "display": "Numbers", "aliases": ["numbers", "num"]},
    {"id": "deuteronomy", "display": "Deuteronomy", "aliases": ["deuteronomy", "deut"]},
    {"id": "joshua", "display": "Joshua", "aliases": ["joshua", "josh"]},
    {"id": "judges", "display": "Judges", "aliases": ["judges", "judg"]},
    {"id": "ruth", "display": "Ruth", "aliases": ["ruth"]},
    {"id": "1-samuel", "display": "1 Samuel", "aliases": ["1 samuel", "1 sam"]},
    {"id": "2-samuel", "display": "2 Samuel", "aliases": ["2 samuel", "2 sam"]},
    {"id": "1-kings", "display": "1 Kings", "aliases": ["1 kings", "1 kgs"]},
    {"id": "2-kings", "display": "2 Kings", "aliases": ["2 kings", "2 kgs"]},
    {"id": "1-chronicles", "display": "1 Chronicles", "aliases": ["1 chronicles", "1 chr"]},
    {"id": "2-chronicles", "display": "2 Chronicles", "aliases": ["2 chronicles", "2 chr"]},
    {"id": "ezra", "display": "Ezra", "aliases": ["ezra"]},
    {"id": "nehemiah", "display": "Nehemiah", "aliases": ["nehemiah", "neh"]},
    {"id": "esther", "display": "Esther", "aliases": ["esther", "esth"]},
    {"id": "job", "display": "Job", "aliases": ["job"]},
    {"id": "psalms", "display": "Psalms", "aliases": ["psalms", "psalm", "ps"]},
    {"id": "proverbs", "display": "Proverbs", "aliases": ["proverbs", "prov"]},
    {"id": "ecclesiastes", "display": "Ecclesiastes", "aliases": ["ecclesiastes", "eccl"]},
    {"id": "song-of-solomon", "display": "Song of Solomon", "aliases": ["song of solomon", "song"]},
    {"id": "isaiah", "display": "Isaiah", "aliases": ["isaiah", "isa"]},
    {"id": "jeremiah", "display": "Jeremiah", "aliases": ["jeremiah", "jer"]},
    {"id": "lamentations", "display": "Lamentations", "aliases": ["lamentations", "lam"]},
    {"id": "ezekiel", "display": "Ezekiel", "aliases": ["ezekiel", "ezek"]},
    {"id": "daniel", "display": "Daniel", "aliases": ["daniel", "dan"]},
    {"id": "hosea", "display": "Hosea", "aliases": ["hosea"]},
    {"id": "joel", "display": "Joel", "aliases": ["joel"]},
    {"id": "amos", "display": "Amos", "aliases": ["amos"]},
    {"id": "obadiah", "display": "Obadiah", "aliases": ["obadiah", "obad"]},
    {"id": "jonah", "display": "Jonah", "aliases": ["jonah"]},
    {"id": "micah", "display": "Micah", "aliases": ["micah"]},
    {"id": "nahum", "display": "Nahum", "aliases": ["nahum"]},
    {"id": "habakkuk", "display": "Habakkuk", "aliases": ["habakkuk", "hab"]},
    {"id": "zephaniah", "display": "Zephaniah", "aliases": ["zephaniah", "zeph"]},
    {"id": "haggai", "display": "Haggai", "aliases": ["haggai", "hag"]},
    {"id": "zechariah", "display": "Zechariah", "aliases": ["zechariah", "zech"]},
    {"id": "malachi", "display": "Malachi", "aliases": ["malachi", "mal"]},
]


def normalize_alias(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower().replace("\u2014", "-").replace("\u2013", "-")).strip()


def alias_pattern(alias: str) -> str:
    return r"\s+".join(re.escape(part) for part in normalize_alias(alias).split(" "))


ALIAS_TO_BOOK = {
    normalize_alias(alias): book
    for book in BOOKS
    for alias in book["aliases"]
}
BOOK_PATTERN = "|".join(
    alias_pattern(alias)
    for alias in sorted(ALIAS_TO_BOOK, key=len, reverse=True)
)
FULL_REFERENCE_RE = re.compile(
    rf"(?<![A-Za-z0-9])({BOOK_PATTERN})\s+(\d{{1,3}})"
    rf"(?:\s*[-\u2013\u2014]\s*(\d{{1,3}})(?!\s*[:.])|\s*[:.]\s*(\d{{1,3}}(?:\s*[-\u2013\u2014,]\s*\d{{1,3}})*))?",
    re.IGNORECASE,
)
CONTINUATION_RE = re.compile(
    r";\s*(\d{1,3})\s*[:.]\s*(\d{1,3}(?:\s*[-\u2013\u2014,]\s*\d{1,3})*)",
    re.IGNORECASE,
)


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.in_title = False
        self.in_h1 = False
        self.title_parts: list[str] = []
        self.h1_parts: list[str] = []
        self.body_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "svg"}:
            self.skip_depth += 1
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.in_h1 = True
        if tag in {"p", "div", "section", "br", "li", "tr", "td", "th", "h1", "h2", "h3", "h4"}:
            self.body_parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "svg"} and self.skip_depth:
            self.skip_depth -= 1
        if tag == "title":
            self.in_title = False
        if tag == "h1":
            self.in_h1 = False
        if tag in {"p", "div", "section", "li", "tr", "td", "th", "h1", "h2", "h3", "h4"}:
            self.body_parts.append(" ")

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        if self.in_title:
            self.title_parts.append(data)
        if self.in_h1:
            self.h1_parts.append(data)
        self.body_parts.append(data)

    @property
    def title(self) -> str:
        h1 = normalize_text(" ".join(self.h1_parts))
        if h1:
            return h1
        return normalize_text(" ".join(self.title_parts))

    @property
    def body_text(self) -> str:
        return normalize_text(" ".join(self.body_parts))


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def parse_verse_ranges(verse_spec: str) -> list[list[int]] | None:
    ranges: list[list[int]] = []
    parts = re.sub(r"\s+", "", verse_spec.replace("\u2013", "-").replace("\u2014", "-")).split(",")
    for part in parts:
        if not part:
            return None
        match = re.fullmatch(r"(\d{1,3})(?:-(\d{1,3}))?", part)
        if not match:
            return None
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if start < 1 or end < start:
            return None
        ranges.append([start, end])
    return ranges or None


def format_verse_ranges(ranges: list[list[int]] | None) -> str:
    if not ranges:
        return ""
    return ", ".join(str(start) if start == end else f"{start}-{end}" for start, end in ranges)


def build_label(book: dict[str, Any], chapter_start: int, chapter_end: int, verse_ranges: list[list[int]] | None) -> str:
    label = f"{book['display']} {chapter_start}"
    if chapter_end != chapter_start:
        label += f"-{chapter_end}"
    if verse_ranges:
        label += f":{format_verse_ranges(verse_ranges)}"
    return label


def make_ref(book: dict[str, Any], chapter_start: int, chapter_end: int, verse_spec: str | None) -> dict[str, Any] | None:
    verse_ranges = parse_verse_ranges(verse_spec) if verse_spec else None
    if verse_spec and not verse_ranges:
        return None

    ref: dict[str, Any] = {
        "book": book["id"],
        "label": build_label(book, chapter_start, chapter_end, verse_ranges),
        "c1": chapter_start,
    }
    if chapter_end != chapter_start:
        ref["c2"] = chapter_end
    if verse_ranges:
        ref["v"] = verse_ranges
    return ref


def context_text(value: str, *, is_start: bool, width: int = 70) -> str:
    value = normalize_text(value)
    if len(value) <= width:
        return value

    if is_start:
        clipped = value[-width:]
        space_index = clipped.find(" ")
        if space_index > 0:
            clipped = clipped[space_index + 1 :]
        return "... " + clipped

    clipped = value[:width]
    space_index = clipped.rfind(" ")
    if space_index > 0:
        clipped = clipped[:space_index]
    return clipped + " ..."


def make_occurrence(ref: dict[str, Any], text: str, start: int, end: int) -> dict[str, Any]:
    occurrence = dict(ref)
    occurrence["before"] = context_text(text[max(0, start - 140) : start], is_start=True)
    occurrence["match"] = normalize_text(text[start:end]) or ref["label"]
    occurrence["after"] = context_text(text[end : min(len(text), end + 140)], is_start=False)
    return occurrence


def parse_scripture_data(text: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    matches = list(FULL_REFERENCE_RE.finditer(text))
    refs: list[dict[str, Any]] = []
    occurrences: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()

    def add_ref(ref: dict[str, Any] | None) -> None:
        if not ref:
            return
        key = (ref["book"], ref["c1"], ref.get("c2", ref["c1"]), tuple(tuple(v) for v in ref.get("v", [])))
        if key in seen:
            return
        seen.add(key)
        refs.append(ref)

    def add_occurrence(ref: dict[str, Any] | None, start: int, end: int) -> None:
        if not ref:
            return
        add_ref(ref)
        occurrences.append(make_occurrence(ref, text, start, end))

    for index, match in enumerate(matches):
        alias = normalize_alias(match.group(1))
        book = ALIAS_TO_BOOK.get(alias)
        if not book:
            continue

        chapter_start = int(match.group(2))
        chapter_end = int(match.group(3) or chapter_start)
        verse_spec = match.group(4)
        add_occurrence(make_ref(book, chapter_start, chapter_end, verse_spec), match.start(), match.end())

        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        continuation_start = match.end()
        continuation_text = text[continuation_start : min(next_start, match.end() + 160)]
        for continuation in CONTINUATION_RE.finditer(continuation_text):
            continuation_chapter = int(continuation.group(1))
            add_occurrence(
                make_ref(book, continuation_chapter, continuation_chapter, continuation.group(2)),
                continuation_start + continuation.start(),
                continuation_start + continuation.end(),
            )

    return refs, occurrences


def parse_html(path: Path) -> tuple[str, str]:
    parser = VisibleTextParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.title, parser.body_text


def iter_content_pages() -> list[Path]:
    pages: list[Path] = []
    for section in ("people", "concepts", "echoes"):
        pages.extend(path for path in (DOCS_ROOT / section).glob("*.html") if path.name != "index.html")
    return sorted(pages)


def section_name(path: Path) -> str:
    return {
        "people": "People",
        "concepts": "Concepts",
        "echoes": "Echoes",
    }.get(path.parent.name, "Content")


def build_index() -> list[dict[str, Any]]:
    index: list[dict[str, Any]] = []
    for path in iter_content_pages():
        title, body_text = parse_html(path)
        refs, occurrences = parse_scripture_data(body_text)
        if not refs:
            continue
        index.append(
            {
                "title": title or path.stem,
                "url": path.relative_to(DOCS_ROOT).as_posix(),
                "section": section_name(path),
                "refs": refs,
                "occurrences": occurrences,
            }
        )
    return index


def main() -> None:
    index = build_index()
    payload = json.dumps(index, ensure_ascii=True, separators=(",", ":"))
    OUTPUT_PATH.write_text(
        "// GENERATED FILE: generated by scripts/generate_scripture_search_index.py\n"
        "window.SCRIPTURE_SEARCH_INDEX=" + payload + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} with {len(index)} indexed pages.")


if __name__ == "__main__":
    main()
