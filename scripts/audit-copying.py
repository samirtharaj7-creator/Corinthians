#!/usr/bin/env python3
"""Check generated Romans prose for long exact overlaps with local sources.

This is a bounded audit, not a stored extraction pipeline. It reads source text
into memory, compares normalized generated paragraphs, prints a summary, and
does not write extracted source text to disk.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

try:
    from docx import Document
except Exception:  # pragma: no cover
    Document = None

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None


ROOT = Path.cwd()
CONTENT_ROOT = ROOT / "content"
INVENTORY_PATH = CONTENT_ROOT / "resources" / "source-inventory.json"
MIN_OVERLAP_CHARS = int(os.environ.get("MIN_OVERLAP_CHARS", "220"))
PDF_PAGE_LIMIT = int(os.environ.get("PDF_PAGE_LIMIT", "25"))


def normalize(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def generated_fragments() -> list[tuple[str, str]]:
    fragments: list[tuple[str, str]] = []
    for chapter_path in sorted((CONTENT_ROOT / "romans").glob("chapter-*.json")):
      chapter = json.loads(chapter_path.read_text(encoding="utf-8"))
      for verse in chapter["verses"]:
          fields = [
              verse.get("explanation", ""),
              verse.get("historicalBackground", ""),
              verse.get("literaryContext", ""),
              verse.get("theologicalInsight", ""),
              verse.get("structuralNotes", ""),
              verse.get("relatedConnection", ""),
              verse.get("application", ""),
          ]
          fields.extend(verse.get("commentary", {}).get(field, "") for field in [
              "detailedExplanation",
              "exegesis",
              "historicalBackground",
              "technicalNotes",
              "theologicalInsight",
              "structuralNotes",
              "otherCommentaryInsights",
              "application",
          ])
          for field in fields:
              for paragraph in str(field).split("\n\n"):
                  cleaned = normalize(paragraph)
                  if len(cleaned) >= MIN_OVERLAP_CHARS:
                      fragments.append((verse["verse"], cleaned))
    return fragments


def extract_docx(path: Path) -> str:
    if Document is None:
        return ""
    try:
        doc = Document(str(path))
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)
    except Exception:
        return ""


def extract_pdf(path: Path) -> str:
    if PdfReader is None:
        return ""
    try:
        reader = PdfReader(str(path))
        page_count = min(len(reader.pages), PDF_PAGE_LIMIT)
        parts = []
        for index in range(page_count):
            parts.append(reader.pages[index].extract_text() or "")
        return "\n".join(parts)
    except Exception:
        return ""


def main() -> int:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    source_dir = Path(inventory["sourceDirectory"])
    fragments = generated_fragments()
    overlaps: list[str] = []
    scanned = 0
    readable = 0

    for resource in inventory["resources"]:
        if resource.get("duplicateOf"):
            continue
        path = source_dir / resource["filename"]
        if not path.exists():
            continue
        scanned += 1
        raw_text = extract_docx(path) if resource["fileType"] == "docx" else extract_pdf(path)
        source_text = normalize(raw_text)
        if not source_text:
            continue
        readable += 1
        for verse_ref, fragment in fragments:
            if fragment in source_text:
                overlaps.append(f"{verse_ref} overlaps {resource['id']} with {len(fragment)} normalized chars")
                if len(overlaps) >= 20:
                    break
        if len(overlaps) >= 20:
            break

    if overlaps:
        print("\n".join(overlaps))
        return 1

    print(
        f"Copying audit passed: {len(fragments)} generated fragments checked against "
        f"{readable}/{scanned} readable source samples; PDF page limit {PDF_PAGE_LIMIT}; "
        f"minimum overlap {MIN_OVERLAP_CHARS} chars."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
