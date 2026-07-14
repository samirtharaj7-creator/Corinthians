#!/usr/bin/env python3
"""Detect exact and normalized phrase overlap with the private PDF corpus."""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path


ROOT = Path.cwd()
CONTENT_ROOT = ROOT / "content"
CORPUS_TEXT_ROOT = ROOT / ".research" / "corinthians-corpus" / "text"
BACKGROUND_PATH = CONTENT_ROOT / "background.json"
HOMEPAGE_PATH = ROOT / "components" / "hero-section.tsx"
EXACT_WINDOW = int(os.environ.get("CORINTHIANS_OVERLAP_WORDS", "20"))
NORMALIZED_WINDOW = int(os.environ.get("CORINTHIANS_NORMALIZED_OVERLAP_WORDS", "16"))
MAX_REPORTS = int(os.environ.get("CORINTHIANS_OVERLAP_REPORTS", "30"))

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "because", "been", "but", "by",
    "can", "does", "for", "from", "had", "has", "have", "he", "her", "him", "his",
    "i", "if", "in", "into", "is", "it", "its", "may", "not", "of", "on", "or",
    "our", "she", "so", "that", "the", "their", "them", "there", "these", "they",
    "this", "those", "to", "was", "we", "were", "which", "who", "will", "with",
    "would", "you", "your",
}


def words(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", value.lower())


def reduce_word(value: str) -> str:
    if len(value) > 6 and value.endswith("ies"):
        return value[:-3] + "y"
    for suffix in ("ingly", "edly", "ing", "ed"):
        if len(value) > len(suffix) + 4 and value.endswith(suffix):
            return value[: -len(suffix)]
    if len(value) > 6 and value.endswith("es"):
        return value[:-2]
    if len(value) > 5 and value.endswith("s"):
        return value[:-1]
    return value


def normalized_content_words(value: str) -> list[str]:
    return [reduce_word(word) for word in words(value) if word not in STOP_WORDS]


def windows(tokens: list[str], size: int):
    for index in range(len(tokens) - size + 1):
        yield tuple(tokens[index:index + size])


def add_windows(
    index: dict[int, list[tuple[str, str, tuple[str, ...]]]],
    reference: str,
    field: str,
    tokens: list[str],
    size: int,
) -> None:
    for phrase in windows(tokens, size):
        index[hash(phrase)].append((reference, field, phrase))


def generated_indexes():
    exact: dict[int, list[tuple[str, str, tuple[str, ...]]]] = defaultdict(list)
    normalized: dict[int, list[tuple[str, str, tuple[str, ...]]]] = defaultdict(list)
    kjv_exact: set[tuple[str, ...]] = set()
    kjv_normalized: set[tuple[str, ...]] = set()
    paragraph_count = 0
    field_count = 0

    def index_public_field(reference: str, field: str, value: str) -> None:
        nonlocal paragraph_count, field_count
        if not value.strip():
            return
        field_count += 1
        for paragraph in re.split(r"\n\s*\n", value):
            if not paragraph.strip():
                continue
            paragraph_count += 1
            add_windows(exact, reference, field, words(paragraph), EXACT_WINDOW)
            add_windows(
                normalized,
                reference,
                field,
                normalized_content_words(paragraph),
                NORMALIZED_WINDOW,
            )

    for book in ("1-corinthians", "2-corinthians"):
        for chapter_path in sorted((CONTENT_ROOT / book).glob("chapter-*.json")):
            chapter = json.loads(chapter_path.read_text(encoding="utf-8"))
            chapter_reference = f"{book} {chapter.get('chapterNumber', '?')}"
            index_public_field(chapter_reference, "chapter.summary", str(chapter.get("summary", "")))
            for outline_index, section in enumerate(chapter.get("outline", []), start=1):
                index_public_field(
                    chapter_reference,
                    f"outline[{outline_index}].summary",
                    str(section.get("summary", "")),
                )
            for verse in chapter.get("verses", []):
                reference = verse["verse"]
                bible_text = str(verse.get("bibleText", ""))
                kjv_exact.update(windows(words(bible_text), EXACT_WINDOW))
                kjv_normalized.update(
                    windows(normalized_content_words(bible_text), NORMALIZED_WINDOW)
                )

                public_fields = [
                    ("commentary", str(verse.get("commentary", {}).get("detailedExplanation", "")))
                ]
                public_fields.extend(
                    (f"wordNotes[{index}]", str(note.get("explanation", "")))
                    for index, note in enumerate(verse.get("wordNotes", []), start=1)
                )
                for field, value in public_fields:
                    index_public_field(reference, field, value)

    if BACKGROUND_PATH.exists():
        background = json.loads(BACKGROUND_PATH.read_text(encoding="utf-8"))

        def walk_background(value: object, field: str = "background") -> None:
            if isinstance(value, str):
                index_public_field("Introduction", field, value)
            elif isinstance(value, list):
                for index, item in enumerate(value):
                    walk_background(item, f"{field}[{index}]")
            elif isinstance(value, dict):
                for key, item in value.items():
                    if key not in {"id", "type"}:
                        walk_background(item, f"{field}.{key}")

        walk_background(background)

    if HOMEPAGE_PATH.exists():
        index_public_field(
            "Homepage",
            "components/hero-section.tsx",
            HOMEPAGE_PATH.read_text(encoding="utf-8"),
        )

    return exact, normalized, kjv_exact, kjv_normalized, paragraph_count, field_count


def scan_source(
    source_id: str,
    source_tokens: list[str],
    size: int,
    generated: dict[int, list[tuple[str, str, tuple[str, ...]]]],
    scripture_windows: set[tuple[str, ...]],
    overlap_type: str,
    seen: set[tuple[str, str, str, str]],
    reports: list[str],
) -> None:
    for phrase in windows(source_tokens, size):
        if phrase in scripture_windows:
            continue
        for reference, field, candidate in generated.get(hash(phrase), ()):
            if candidate != phrase:
                continue
            key = (reference, field, source_id, overlap_type)
            if key in seen:
                continue
            seen.add(key)
            reports.append(
                f"{reference} {field} has a {size}-word {overlap_type} overlap with {source_id}."
            )
            if len(reports) >= MAX_REPORTS:
                return


def main() -> int:
    if EXACT_WINDOW < 16:
        print("CORINTHIANS_OVERLAP_WORDS must be at least 16.", file=sys.stderr)
        return 2
    if NORMALIZED_WINDOW < 12:
        print("CORINTHIANS_NORMALIZED_OVERLAP_WORDS must be at least 12.", file=sys.stderr)
        return 2
    if not CORPUS_TEXT_ROOT.exists():
        print("Corinthians copying audit skipped: private corpus is not available.")
        return 0

    exact, normalized, kjv_exact, kjv_normalized, paragraph_count, field_count = generated_indexes()
    reports: list[str] = []
    checked_sources = 0
    seen: set[tuple[str, str, str, str]] = set()

    for source_path in sorted(CORPUS_TEXT_ROOT.glob("*.txt")):
        source_text = source_path.read_text(encoding="utf-8", errors="ignore")
        checked_sources += 1
        scan_source(
            source_path.stem,
            words(source_text),
            EXACT_WINDOW,
            exact,
            kjv_exact,
            "exact",
            seen,
            reports,
        )
        if len(reports) >= MAX_REPORTS:
            break
        scan_source(
            source_path.stem,
            normalized_content_words(source_text),
            NORMALIZED_WINDOW,
            normalized,
            kjv_normalized,
            "normalized-content",
            seen,
            reports,
        )
        if len(reports) >= MAX_REPORTS:
            break

    if reports:
        print("\n".join(reports))
        return 1

    print(
        f"Corinthians copying audit passed: {paragraph_count} paragraphs across "
        f"{field_count} public editorial fields checked against "
        f"{checked_sources} private source texts using {EXACT_WINDOW}-word exact and "
        f"{NORMALIZED_WINDOW}-content-word normalized windows (shared KJV wording excluded)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
