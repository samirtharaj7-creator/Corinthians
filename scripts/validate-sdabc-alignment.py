#!/usr/bin/env python3
"""Validate the private SDA verse map and public-surface alignment matrix."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
DEFAULT_MAP = ROOT / ".research" / "sdabc-alignment" / "verse-page-map.json"
DEFAULT_MATRIX = ROOT / ".research" / "sdabc-alignment" / "alignment-matrix.json"
DEFAULT_MANIFEST = ROOT / ".research" / "corinthians-source-manifest.json"

REQUIRED_SOURCES = {
    "1-corinthians": (
        "3219f55568bfee58ee95d5403a7208f5ba2f53a9f645c7fc265a4c4b463358f0",
        182,
        16,
    ),
    "2-corinthians": (
        "4c8d88c6759142ab50d41cbcb6267b25c2d2d7957dc177d32fe63d34ff842462",
        118,
        13,
    ),
}
CLASSIFICATIONS = {
    "pending",
    "aligned",
    "needs-deepening",
    "needs-correction",
    "preserves-legitimate-uncertainty",
}
REVIEW_AXES = {"sourceComparison", "accuracy", "theology", "style", "copying"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--map", type=Path, default=DEFAULT_MAP)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument(
        "--allow-pending",
        action="store_true",
        help="Validate structure and content hashes while the theological audit is in progress.",
    )
    return parser.parse_args()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_matrix_builder() -> Any:
    path = ROOT / "scripts" / "build-sdabc-alignment-matrix.py"
    spec = importlib.util.spec_from_file_location("sdabc_alignment_matrix_builder", path)
    require(spec is not None and spec.loader is not None, f"Cannot load matrix builder: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def expected_verses() -> set[str]:
    verses: set[str] = set()
    for directory in (ROOT / "content" / "1-corinthians", ROOT / "content" / "2-corinthians"):
        for path in sorted(directory.glob("chapter-*.json")):
            chapter = json.loads(path.read_text(encoding="utf-8"))
            verses.update(verse["verse"] for verse in chapter["verses"])
    return verses


def validate_map(map_data: dict[str, Any], manifest: dict[str, Any]) -> None:
    require(map_data.get("version") == 1, "Unsupported SDA verse-map version.")
    require(set(map_data.get("books", {})) == set(REQUIRED_SOURCES), "Verse map has unexpected books.")
    manifest_by_hash = {
        item["sha256"]: item for item in manifest["resources"] if not item["duplicateOf"]
    }
    mapped_verses: set[str] = set()
    confidence = Counter()

    for book_slug, (checksum, page_count, chapter_count) in REQUIRED_SOURCES.items():
        book = map_data["books"][book_slug]
        source = book["source"]
        require(source["sha256"] == checksum, f"Wrong source hash mapped for {book_slug}.")
        require(source["pageCount"] == page_count, f"Wrong source page count mapped for {book_slug}.")
        manifest_item = manifest_by_hash.get(checksum)
        require(manifest_item is not None, f"Mapped source is absent from the private manifest: {book_slug}.")
        require(manifest_item["id"] == source["sourceId"], f"Mapped source ID is stale for {book_slug}.")
        require(len(book["chapters"]) == chapter_count, f"Wrong chapter count mapped for {book_slug}.")
        intro_pages = book["introduction"]["pdfPages"]
        require(intro_pages[0] == 1, f"Introduction map must begin at PDF page 1 for {book_slug}.")
        require(
            intro_pages[0] <= intro_pages[1] <= page_count,
            f"Introduction page span is invalid for {book_slug}.",
        )

        for expected_chapter, chapter in enumerate(book["chapters"], start=1):
            require(chapter["chapter"] == expected_chapter, f"Chapter ordering is invalid for {book_slug}.")
            require(
                1 <= chapter["pdfPages"][0] <= chapter["pdfPages"][1] <= page_count,
                f"Chapter page span is invalid for {book_slug} {expected_chapter}.",
            )
            previous_start = 0
            for verse in chapter["verses"]:
                require(verse["verse"] not in mapped_verses, f"Duplicate mapped verse: {verse['verse']}.")
                mapped_verses.add(verse["verse"])
                start, end = verse["pdfPages"]
                require(1 <= start <= end <= page_count, f"Invalid page span for {verse['verse']}.")
                require(start >= previous_start, f"Verse page order regressed at {verse['verse']}.")
                previous_start = start
                require(verse["confidence"] in {"high", "medium", "low"}, "Invalid map confidence.")
                confidence[verse["confidence"]] += 1

    expected = expected_verses()
    require(len(expected) == 694, f"Expected 694 public verses; found {len(expected)}.")
    require(mapped_verses == expected, "SDA verse map does not exactly cover the 694 public verses.")
    require(confidence["low"] == 0, f"Verse map contains {confidence['low']} low-confidence anchors.")


def validate_matrix(
    matrix: dict[str, Any],
    map_data: dict[str, Any],
    allow_pending: bool,
) -> None:
    require(matrix.get("version") == 1, "Unsupported SDA alignment-matrix version.")
    items = matrix.get("items", [])
    require(items, "SDA alignment matrix is empty.")
    ids = [item["id"] for item in items]
    require(len(ids) == len(set(ids)), "SDA alignment matrix contains duplicate item IDs.")

    builder = load_matrix_builder()
    expected_items = builder.collect_surfaces(ROOT, map_data)
    expected_by_id = {item["id"]: item for item in expected_items}
    actual_by_id = {item["id"]: item for item in items}
    require(set(actual_by_id) == set(expected_by_id), "SDA alignment inventory is stale or incomplete.")

    for item_id, expected in expected_by_id.items():
        actual = actual_by_id[item_id]
        require(
            actual.get("contentHash") == expected["contentHash"],
            f"Public content changed after matrix generation: {item_id}.",
        )
        require(actual.get("sourceRefs") == expected["sourceRefs"], f"Source map changed for {item_id}.")
        require(actual.get("classification") in CLASSIFICATIONS, f"Invalid classification for {item_id}.")
        require(actual.get("resolution") in {"pending", "resolved"}, f"Invalid resolution for {item_id}.")
        reviews = actual.get("reviews", {})
        require(set(reviews) == REVIEW_AXES, f"Review axes are incomplete for {item_id}.")
        require(
            all(value in {"pending", "pass", "fail"} for value in reviews.values()),
            f"Invalid review result for {item_id}.",
        )
        if not allow_pending:
            require(actual["classification"] != "pending", f"Classification remains pending: {item_id}.")
            require(actual["resolution"] == "resolved", f"Resolution remains pending: {item_id}.")
            require(all(value == "pass" for value in reviews.values()), f"Review has not passed: {item_id}.")
            require(actual.get("findingSummary", "").strip(), f"Finding summary is blank: {item_id}.")

    kind_counts = Counter(item["kind"] for item in items)
    required_counts = {
        "verse-note": 694,
        "cross-reference-set": 694,
        "chapter-summary": 29,
        "outline": 116,
        "introduction-paragraph": 28,
        "introduction-timeline": 1,
        "introduction-comparison": 1,
        "introduction-title": 1,
        "introduction-subtitle": 1,
        "homepage-copy": 1,
        "introduction-page-copy": 1,
    }
    for kind, count in required_counts.items():
        require(
            kind_counts[kind] == count,
            f"Unexpected {kind} count: found {kind_counts[kind]}; expected {count}.",
        )
    require(
        694 <= kind_counts["word-note"] <= 1_388,
        "Every verse must contribute one or two word-note surfaces; "
        f"found {kind_counts['word-note']} notes for 694 verses.",
    )
    require(
        set(kind_counts) == {*required_counts, "word-note"},
        f"Unexpected public-surface kinds: {dict(kind_counts)}",
    )
    summary = matrix.get("summary", {})
    require(summary.get("items") == len(items), "Matrix summary item count is stale.")
    require(summary.get("byKind") == dict(sorted(kind_counts.items())), "Matrix kind summary is stale.")


def main() -> int:
    args = parse_args()
    map_path = args.map.expanduser().resolve()
    matrix_path = args.matrix.expanduser().resolve()
    manifest_path = args.manifest.expanduser().resolve()
    require(map_path.exists(), f"SDA verse map is missing: {map_path}")
    require(matrix_path.exists(), f"SDA alignment matrix is missing: {matrix_path}")
    require(manifest_path.exists(), f"Private source manifest is missing: {manifest_path}")
    map_data = json.loads(map_path.read_text(encoding="utf-8"))
    matrix = json.loads(matrix_path.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    validate_map(map_data, manifest)
    validate_matrix(matrix, map_data, args.allow_pending)

    pending = sum(1 for item in matrix["items"] if item["resolution"] != "resolved")
    mode = "structural" if args.allow_pending else "complete"
    print(
        f"SDA alignment validation passed ({mode}): 694 verse mappings, "
        f"{len(matrix['items'])} public surfaces, {pending} unresolved."
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as exc:
        print(f"SDA alignment validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
