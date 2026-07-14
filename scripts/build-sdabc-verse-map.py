#!/usr/bin/env python3
"""Build a private page-aware SDA Commentary map for every Corinthians verse.

The output contains source identifiers, hashes, and PDF page spans only. Extracted
commentary prose remains in the ignored corpus and is never copied into the map.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
DEFAULT_CORPUS = ROOT / ".research" / "corinthians-corpus"
DEFAULT_MANIFEST = ROOT / ".research" / "corinthians-source-manifest.json"
DEFAULT_OUTPUT = ROOT / ".research" / "sdabc-alignment" / "verse-page-map.json"
DEFAULT_OVERRIDES = ROOT / ".research" / "sdabc-alignment" / "verse-map-overrides.json"

SOURCE_SPECS = {
    "1-corinthians": {
        "displayName": "1 Corinthians",
        "sha256": "3219f55568bfee58ee95d5403a7208f5ba2f53a9f645c7fc265a4c4b463358f0",
        "pageCount": 182,
        "chapters": 16,
    },
    "2-corinthians": {
        "displayName": "2 Corinthians",
        "sha256": "4c8d88c6759142ab50d41cbcb6267b25c2d2d7957dc177d32fe63d34ff842462",
        "pageCount": 118,
        "chapters": 13,
    },
}

ANCHOR_RE = re.compile(
    r"^(?P<label>\d{1,3}(?:\s*(?:,|\u2013|-|to)\s*\d{1,3})*)\.\s+(?P<head>\S.*)$",
    flags=re.IGNORECASE,
)
CHAPTER_RE = re.compile(r"^CHAPTER\s+(\d{1,2})$", flags=re.IGNORECASE)
TOKEN_RE = re.compile(r"[a-z0-9]+")
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
    "had", "has", "have", "he", "her", "him", "his", "i", "in", "is", "it",
    "not", "of", "on", "or", "our", "shall", "she", "that", "the", "their",
    "them", "they", "this", "to", "unto", "was", "we", "were", "which", "who",
    "with", "ye", "you", "your",
}


@dataclass(frozen=True)
class Line:
    ordinal: int
    page: int
    line_number: int
    text: str


@dataclass(frozen=True)
class Candidate:
    index: int
    line: Line
    label: str
    verses: tuple[int, ...]
    heading: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    return parser.parse_args()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def parse_label(label: str, maximum: int) -> tuple[int, ...]:
    normalized = re.sub(r"\s+", "", label.casefold()).replace("to", "-").replace("\u2013", "-")
    values: list[int] = []
    for part in normalized.split(","):
        if "-" in part:
            bounds = part.split("-", 1)
            if not all(value.isdigit() for value in bounds):
                return ()
            start, end = (int(value) for value in bounds)
            if start > end or end - start > maximum:
                return ()
            values.extend(range(start, end + 1))
        elif part.isdigit():
            values.append(int(part))
        else:
            return ()
    unique = tuple(dict.fromkeys(value for value in values if 1 <= value <= maximum))
    return unique if len(unique) == len(values) else ()


def normalized_tokens(value: str) -> list[str]:
    return [token for token in TOKEN_RE.findall(value.casefold()) if token not in STOPWORDS]


def candidate_score(candidate: Candidate, verse_text: str, occurrence: int) -> float:
    verse_tokens = normalized_tokens(verse_text)
    heading_tokens = normalized_tokens(candidate.heading)
    overlap = len(set(heading_tokens) & set(verse_tokens))
    score = overlap * 3.0
    if len(candidate.verses) == 1:
        score += 2.5
    else:
        score += 1.0
    if heading_tokens and verse_tokens and heading_tokens[0] == verse_tokens[0]:
        score += 3.0
    if heading_tokens and " ".join(heading_tokens[:2]) in " ".join(verse_tokens):
        score += 1.5
    score -= occurrence * 0.12
    return score


def load_chapter_content(book_slug: str) -> list[dict[str, Any]]:
    directory = ROOT / "content" / book_slug
    chapters = []
    for path in sorted(directory.glob("chapter-*.json")):
        content = json.loads(path.read_text(encoding="utf-8"))
        chapters.append(content)
    return chapters


def load_lines(connection: sqlite3.Connection, source_id: str) -> list[Line]:
    lines: list[Line] = []
    ordinal = 0
    for page, text in connection.execute(
        "SELECT page_number, text FROM pages WHERE source_id = ? ORDER BY page_number",
        (source_id,),
    ):
        for line_number, raw_line in enumerate(str(text).splitlines(), start=1):
            ordinal += 1
            text_line = re.sub(r"\s+", " ", raw_line).strip()
            lines.append(Line(ordinal=ordinal, page=int(page), line_number=line_number, text=text_line))
    return lines


def find_chapter_boundaries(lines: list[Line], expected_chapters: int) -> dict[int, int]:
    boundaries: dict[int, int] = {}
    previous_ordinal = -1
    for line in lines:
        match = CHAPTER_RE.fullmatch(line.text)
        if not match:
            continue
        chapter = int(match.group(1))
        if chapter not in boundaries and chapter == len(boundaries) + 1 and line.ordinal > previous_ordinal:
            boundaries[chapter] = line.ordinal
            previous_ordinal = line.ordinal
    require(
        list(boundaries) == list(range(1, expected_chapters + 1)),
        f"Could not identify all {expected_chapters} ordered chapter headings; found {list(boundaries)}.",
    )
    return boundaries


def collect_candidates(
    lines: list[Line], start_ordinal: int, end_ordinal: int, maximum_verse: int
) -> list[Candidate]:
    candidates: list[Candidate] = []
    for line in lines:
        if line.ordinal <= start_ordinal or line.ordinal >= end_ordinal:
            continue
        match = ANCHOR_RE.fullmatch(line.text)
        if not match:
            continue
        verses = parse_label(match.group("label"), maximum_verse)
        if not verses:
            continue
        candidates.append(
            Candidate(
                index=len(candidates),
                line=line,
                label=match.group("label"),
                verses=verses,
                heading=match.group("head"),
            )
        )
    return candidates


def add_synthetic_overrides(
    candidates: list[Candidate],
    lines: list[Line],
    chapter: dict[str, Any],
    book_name: str,
    overrides: dict[str, Any],
) -> list[Candidate]:
    """Supply a position-only anchor when a PDF text layer drops a verse number.

    Synthetic anchors are permitted only through the private override file. Their
    page and placement are recorded without copying the omitted source heading.
    """
    augmented = list(candidates)
    maximum_verse = len(chapter["verses"])
    for verse_number in range(1, maximum_verse + 1):
        if any(verse_number in candidate.verses for candidate in augmented):
            continue
        key = f"{book_name} {chapter['chapterNumber']}:{verse_number}"
        override = overrides.get(key, {})
        if not override.get("synthetic") or "pdfPage" not in override:
            continue
        page = int(override["pdfPage"])
        next_anchor = min(
            (
                candidate
                for candidate in augmented
                if any(value > verse_number for value in candidate.verses)
                and candidate.line.page >= page
            ),
            key=lambda candidate: candidate.line.ordinal,
            default=None,
        )
        previous_anchor = max(
            (
                candidate
                for candidate in augmented
                if any(value < verse_number for value in candidate.verses)
                and candidate.line.page <= page
            ),
            key=lambda candidate: candidate.line.ordinal,
            default=None,
        )
        page_lines = [line for line in lines if line.page == page and line.text]
        require(page_lines, f"Synthetic override page is empty for {key}.")
        if next_anchor and next_anchor.line.page == page:
            eligible = [line for line in page_lines if line.ordinal < next_anchor.line.ordinal]
            line = eligible[-1] if eligible else page_lines[0]
        elif previous_anchor and previous_anchor.line.page == page:
            eligible = [line for line in page_lines if line.ordinal > previous_anchor.line.ordinal]
            line = eligible[0] if eligible else page_lines[-1]
        else:
            line = page_lines[0]
        augmented.append(
            Candidate(
                index=-1,
                line=line,
                label=str(verse_number),
                verses=(verse_number,),
                heading="",
            )
        )

    ordered = sorted(augmented, key=lambda candidate: (candidate.line.ordinal, candidate.index))
    return [
        Candidate(
            index=index,
            line=candidate.line,
            label=candidate.label,
            verses=candidate.verses,
            heading=candidate.heading,
        )
        for index, candidate in enumerate(ordered)
    ]


def choose_candidates(
    candidates: list[Candidate],
    chapter: dict[str, Any],
    book_name: str,
    overrides: dict[str, Any],
) -> dict[int, Candidate]:
    verse_entries = chapter["verses"]
    by_verse: dict[int, list[Candidate]] = {}
    for verse_number in range(1, len(verse_entries) + 1):
        choices = [candidate for candidate in candidates if verse_number in candidate.verses]
        override = overrides.get(f"{book_name} {chapter['chapterNumber']}:{verse_number}")
        if override:
            if "pdfPage" in override:
                choices = [choice for choice in choices if choice.line.page == int(override["pdfPage"])]
            if "candidateOccurrence" in override:
                occurrence = int(override["candidateOccurrence"])
                choices = choices[occurrence : occurrence + 1]
        require(choices, f"No commentary anchor found for {book_name} {chapter['chapterNumber']}:{verse_number}.")
        by_verse[verse_number] = choices

    states: dict[int, tuple[float, list[Candidate]]] = {}
    first_text = verse_entries[0]["bibleText"]
    for occurrence, candidate in enumerate(by_verse[1]):
        states[candidate.index] = (candidate_score(candidate, first_text, occurrence), [candidate])

    for verse_number in range(2, len(verse_entries) + 1):
        next_states: dict[int, tuple[float, list[Candidate]]] = {}
        verse_text = verse_entries[verse_number - 1]["bibleText"]
        for occurrence, candidate in enumerate(by_verse[verse_number]):
            best: tuple[float, list[Candidate]] | None = None
            for previous_index, (previous_score, previous_path) in states.items():
                same_group = candidate.index == previous_index and verse_number in candidate.verses
                if candidate.index < previous_index or (candidate.index == previous_index and not same_group):
                    continue
                score = previous_score + candidate_score(candidate, verse_text, occurrence)
                if best is None or score > best[0]:
                    best = (score, [*previous_path, candidate])
            if best is not None:
                next_states[candidate.index] = best
        require(next_states, f"Could not construct an ordered verse map for {book_name} {chapter['chapterNumber']}.")
        states = next_states

    best_path = max(states.values(), key=lambda item: item[0])[1]
    return {verse_number: candidate for verse_number, candidate in enumerate(best_path, start=1)}


def confidence_for(candidate: Candidate, verse_text: str) -> str:
    overlap = set(normalized_tokens(candidate.heading)) & set(normalized_tokens(verse_text))
    if overlap:
        return "high"
    if len(candidate.verses) == 1:
        return "medium"
    return "low"


def main() -> int:
    args = parse_args()
    corpus = args.corpus.expanduser().resolve()
    manifest_path = args.manifest.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    overrides_path = args.overrides.expanduser().resolve()
    database_path = corpus / "index.sqlite3"
    require(database_path.exists(), f"Corpus database is missing: {database_path}")
    require(manifest_path.exists(), f"Private source manifest is missing: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    resources_by_hash = {
        item["sha256"]: item for item in manifest["resources"] if not item["duplicateOf"]
    }
    overrides_path.parent.mkdir(parents=True, exist_ok=True)
    if not overrides_path.exists():
        overrides_path.write_text(
            json.dumps({"version": 1, "overrides": {}}, indent=2) + "\n",
            encoding="utf-8",
        )
    overrides_payload = json.loads(overrides_path.read_text(encoding="utf-8"))
    overrides = overrides_payload.get("overrides", {})

    output: dict[str, Any] = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "note": (
            "Private page-reference map only. Source identities and page provenance must "
            "remain under .research and must not be imported by the public application."
        ),
        "books": {},
    }

    connection = sqlite3.connect(database_path)
    try:
        for book_slug, spec in SOURCE_SPECS.items():
            resource = resources_by_hash.get(spec["sha256"])
            require(resource is not None, f"Required SDA source is missing: {spec['sha256'][:16]}.")
            require(resource["pageCount"] == spec["pageCount"], "Required SDA source page count changed.")
            chapters = load_chapter_content(book_slug)
            require(len(chapters) == spec["chapters"], f"Unexpected chapter count for {book_slug}.")
            lines = load_lines(connection, resource["id"])
            boundaries = find_chapter_boundaries(lines, spec["chapters"])
            line_by_ordinal = {line.ordinal: line for line in lines}

            book_output: dict[str, Any] = {
                "displayName": spec["displayName"],
                "source": {
                    "sourceId": resource["id"],
                    "sha256": resource["sha256"],
                    "pageCount": resource["pageCount"],
                },
                "introduction": {
                    "pdfPages": [
                        1,
                        max(1, line_by_ordinal[boundaries[1]].page - 1),
                    ],
                    "chapterCommentaryBeginsOn": line_by_ordinal[boundaries[1]].page,
                },
                "chapters": [],
            }

            for chapter_index, chapter in enumerate(chapters, start=1):
                start_ordinal = boundaries[chapter_index]
                end_ordinal = boundaries.get(chapter_index + 1, lines[-1].ordinal + 1)
                maximum_verse = len(chapter["verses"])
                candidates = collect_candidates(lines, start_ordinal, end_ordinal, maximum_verse)
                candidates = add_synthetic_overrides(
                    candidates,
                    lines,
                    chapter,
                    str(spec["displayName"]),
                    overrides,
                )
                selected = choose_candidates(
                    candidates,
                    chapter,
                    str(spec["displayName"]),
                    overrides,
                )
                heading_page = line_by_ordinal[start_ordinal].page
                next_heading_page = (
                    line_by_ordinal[boundaries[chapter_index + 1]].page
                    if chapter_index < len(chapters)
                    else int(resource["pageCount"])
                )
                verse_rows = []
                for verse_number, verse_entry in enumerate(chapter["verses"], start=1):
                    candidate = selected[verse_number]
                    next_candidate = selected.get(verse_number + 1)
                    end_page = next_candidate.line.page if next_candidate else next_heading_page
                    verse_rows.append(
                        {
                            "verse": verse_entry["verse"],
                            "pdfPages": [candidate.line.page, max(candidate.line.page, end_page)],
                            "anchorLabel": candidate.label,
                            "confidence": confidence_for(candidate, verse_entry["bibleText"]),
                        }
                    )
                book_output["chapters"].append(
                    {
                        "chapter": chapter_index,
                        "headingPage": heading_page,
                        "pdfPages": [heading_page, next_heading_page],
                        "verses": verse_rows,
                    }
                )
            output["books"][book_slug] = book_output
    finally:
        connection.close()

    serialized = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(serialized, encoding="utf-8")
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    verse_count = sum(
        len(chapter["verses"])
        for book in output["books"].values()
        for chapter in book["chapters"]
    )
    confidence_counts: dict[str, int] = {}
    for book in output["books"].values():
        for chapter in book["chapters"]:
            for verse in chapter["verses"]:
                confidence_counts[verse["confidence"]] = confidence_counts.get(verse["confidence"], 0) + 1
    print(
        f"SDA verse map built: {verse_count} verses, confidence {confidence_counts}, "
        f"sha256 {digest[:16]}, output {output_path}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as exc:
        print(f"SDA verse-map build failed: {exc}", file=sys.stderr)
        sys.exit(1)
