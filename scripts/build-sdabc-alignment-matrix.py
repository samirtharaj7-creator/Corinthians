#!/usr/bin/env python3
"""Inventory every public Corinthians editorial surface in a private audit matrix.

The matrix stores hashes and page-aware provenance, not source prose. Rebuilding
preserves completed audit decisions only while the corresponding public content
hash remains unchanged.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
DEFAULT_MAP = ROOT / ".research" / "sdabc-alignment" / "verse-page-map.json"
DEFAULT_OUTPUT = ROOT / ".research" / "sdabc-alignment" / "alignment-matrix.json"

BOOKS = {
    "1-corinthians": "1 Corinthians",
    "2-corinthians": "2 Corinthians",
}
CLASSIFICATIONS = {
    "pending",
    "aligned",
    "needs-deepening",
    "needs-correction",
    "preserves-legitimate-uncertainty",
}
REVIEW_AXES = ("sourceComparison", "accuracy", "theology", "style", "copying")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--map", type=Path, default=DEFAULT_MAP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def digest(value: Any) -> str:
    serialized = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def source_ref(source: dict[str, Any], pages: list[int]) -> dict[str, Any]:
    return {
        "sourceId": source["sourceId"],
        "sha256": source["sha256"],
        "pdfPages": [int(pages[0]), int(pages[1])],
    }


def blank_item(
    item_id: str,
    kind: str,
    locator: str,
    content: Any,
    source_path: str,
    source_refs: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "id": item_id,
        "kind": kind,
        "locator": locator,
        "sourcePath": source_path,
        "contentHash": digest(content),
        "sourceRefs": source_refs,
        "classification": "pending",
        "resolution": "pending",
        "reviews": {axis: "pending" for axis in REVIEW_AXES},
        "findingSummary": "",
        "requiredAction": "",
        "privateNotes": [],
    }


def load_map_indexes(map_data: dict[str, Any]) -> tuple[dict[str, Any], dict[tuple[str, int], Any]]:
    verses: dict[str, Any] = {}
    chapters: dict[tuple[str, int], Any] = {}
    for book_slug, book in map_data["books"].items():
        for chapter in book["chapters"]:
            chapters[(book_slug, int(chapter["chapter"]))] = {
                "source": book["source"],
                "pdfPages": chapter["pdfPages"],
            }
            for verse in chapter["verses"]:
                verses[verse["verse"]] = {
                    "source": book["source"],
                    "pdfPages": verse["pdfPages"],
                }
    return verses, chapters


def outline_pages(
    book_slug: str,
    chapter_number: int,
    range_text: str,
    verse_index: dict[str, Any],
) -> list[int]:
    match = re.fullmatch(r"(\d+):(\d+)(?:-(\d+))?", range_text)
    if not match:
        raise AssertionError(f"Unsupported outline range: {range_text}")
    range_chapter, start_verse, end_verse = (
        int(match.group(1)),
        int(match.group(2)),
        int(match.group(3) or match.group(2)),
    )
    if range_chapter != chapter_number:
        raise AssertionError(f"Outline range belongs to the wrong chapter: {range_text}")
    display_name = BOOKS[book_slug]
    first = verse_index[f"{display_name} {chapter_number}:{start_verse}"]["pdfPages"]
    last = verse_index[f"{display_name} {chapter_number}:{end_verse}"]["pdfPages"]
    return [first[0], last[1]]


def collect_surfaces(root: Path, map_data: dict[str, Any]) -> list[dict[str, Any]]:
    verse_index, chapter_index = load_map_indexes(map_data)
    items: list[dict[str, Any]] = []

    for book_slug, display_name in BOOKS.items():
        for path in sorted((root / "content" / book_slug).glob("chapter-*.json")):
            chapter = json.loads(path.read_text(encoding="utf-8"))
            chapter_number = int(chapter["chapterNumber"])
            relative_path = str(path.relative_to(root))
            chapter_ref = chapter_index[(book_slug, chapter_number)]
            items.append(
                blank_item(
                    f"chapter-summary:{book_slug}:{chapter_number}",
                    "chapter-summary",
                    f"{display_name} {chapter_number} summary",
                    chapter["summary"],
                    relative_path,
                    [source_ref(chapter_ref["source"], chapter_ref["pdfPages"])],
                )
            )
            for outline_index, outline in enumerate(chapter["outline"], start=1):
                pages = outline_pages(
                    book_slug,
                    chapter_number,
                    outline["range"],
                    verse_index,
                )
                items.append(
                    blank_item(
                        f"outline:{book_slug}:{chapter_number}:{outline_index}",
                        "outline",
                        f"{display_name} {outline['range']} outline",
                        outline,
                        relative_path,
                        [source_ref(chapter_ref["source"], pages)],
                    )
                )

            for verse in chapter["verses"]:
                verse_number = int(str(verse["verse"]).rsplit(":", 1)[1])
                mapped = verse_index[verse["verse"]]
                refs = [source_ref(mapped["source"], mapped["pdfPages"])]
                base_id = f"{book_slug}:{chapter_number}:{verse_number}"
                items.append(
                    blank_item(
                        f"verse-note:{base_id}",
                        "verse-note",
                        verse["verse"],
                        verse["commentary"]["detailedExplanation"],
                        relative_path,
                        refs,
                    )
                )
                items.append(
                    blank_item(
                        f"cross-reference-set:{base_id}",
                        "cross-reference-set",
                        f"{verse['verse']} cross references",
                        verse["crossReferences"],
                        relative_path,
                        refs,
                    )
                )
                for note_index, note in enumerate(verse.get("wordNotes", []), start=1):
                    items.append(
                        blank_item(
                            f"word-note:{base_id}:{note_index}",
                            "word-note",
                            f"{verse['verse']} — {note['term']}",
                            note,
                            relative_path,
                            refs,
                        )
                    )

    background_path = root / "content" / "background.json"
    background = json.loads(background_path.read_text(encoding="utf-8"))
    background_relative = str(background_path.relative_to(root))
    introduction_refs = [
        source_ref(book["source"], book["introduction"]["pdfPages"])
        for book in map_data["books"].values()
    ]
    items.append(
        blank_item(
            "introduction:title",
            "introduction-title",
            "Introduction title",
            background["title"],
            background_relative,
            introduction_refs,
        )
    )
    items.append(
        blank_item(
            "introduction:subtitle",
            "introduction-subtitle",
            "Introduction subtitle",
            background["subtitle"],
            background_relative,
            introduction_refs,
        )
    )
    for section_index, section in enumerate(background["sections"], start=1):
        for block_index, block in enumerate(section["blocks"], start=1):
            base = f"introduction:{section_index}:{block_index}"
            if block["type"] == "paragraph":
                items.append(
                    blank_item(
                        f"{base}:paragraph",
                        "introduction-paragraph",
                        f"{section['title']} paragraph {block_index}",
                        block["text"],
                        background_relative,
                        introduction_refs,
                    )
                )
            elif block["type"] == "timeline":
                items.append(
                    blank_item(
                        f"{base}:timeline",
                        "introduction-timeline",
                        block["title"],
                        block,
                        background_relative,
                        introduction_refs,
                    )
                )
            elif block["type"] == "comparison":
                items.append(
                    blank_item(
                        f"{base}:comparison",
                        "introduction-comparison",
                        block["title"],
                        block,
                        background_relative,
                        introduction_refs,
                    )
                )

    for relative_path, item_id, kind, locator in [
        (
            "components/hero-section.tsx",
            "page-shell:homepage",
            "homepage-copy",
            "Homepage study copy",
        ),
        (
            "app/background/page.tsx",
            "page-shell:introduction",
            "introduction-page-copy",
            "Introduction page metadata and shell copy",
        ),
    ]:
        path = root / relative_path
        items.append(
            blank_item(
                item_id,
                kind,
                locator,
                path.read_text(encoding="utf-8"),
                relative_path,
                introduction_refs,
            )
        )

    return items


def merge_previous(item: dict[str, Any], previous: dict[str, Any] | None) -> dict[str, Any]:
    if not previous or previous.get("contentHash") != item["contentHash"]:
        if previous:
            item["privateNotes"] = [
                f"Public content changed after classification {previous.get('classification', 'unknown')}; review reset."
            ]
        return item
    for key in (
        "classification",
        "resolution",
        "reviews",
        "findingSummary",
        "requiredAction",
        "privateNotes",
    ):
        if key in previous:
            item[key] = previous[key]
    return item


def matrix_payload(root: Path, map_data: dict[str, Any], previous: dict[str, Any] | None = None) -> dict[str, Any]:
    previous_items = {item["id"]: item for item in (previous or {}).get("items", [])}
    items = [merge_previous(item, previous_items.get(item["id"])) for item in collect_surfaces(root, map_data)]
    kind_counts = Counter(item["kind"] for item in items)
    classification_counts = Counter(item["classification"] for item in items)
    resolution_counts = Counter(item["resolution"] for item in items)
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "note": (
            "Private audit inventory. It contains hashes and source/page provenance only; "
            "do not import it into the public application or publish it."
        ),
        "summary": {
            "items": len(items),
            "byKind": dict(sorted(kind_counts.items())),
            "byClassification": dict(sorted(classification_counts.items())),
            "byResolution": dict(sorted(resolution_counts.items())),
        },
        "items": items,
    }


def main() -> int:
    args = parse_args()
    map_path = args.map.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    if not map_path.exists():
        raise AssertionError(f"SDA verse map is missing: {map_path}")
    map_data = json.loads(map_path.read_text(encoding="utf-8"))
    previous = (
        json.loads(output_path.read_text(encoding="utf-8")) if output_path.exists() else None
    )
    payload = matrix_payload(ROOT, map_data, previous)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"SDA alignment matrix built: {payload['summary']['items']} surfaces; "
        f"{payload['summary']['byKind']}; output {output_path}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as exc:
        print(f"SDA alignment-matrix build failed: {exc}", file=sys.stderr)
        sys.exit(1)
