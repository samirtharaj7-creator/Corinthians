#!/usr/bin/env python3
"""Create a metadata-only manifest for the local Romans resources.

The script intentionally stores no extracted source text. It records filenames,
dedupe status, extraction health, and human-readable bibliography fields so the
site can cite sources without committing copyrighted material.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

try:
    from docx import Document
except Exception:  # pragma: no cover - reported in manifest if missing
    Document = None

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - reported in manifest if missing
    PdfReader = None


ROOT = Path.cwd()
SOURCE_DIR = Path("/Users/samuel/Desktop/Romans")
EXTRA_SOURCE_FILES = [
    Path("/Users/samuel/Desktop/Hartland Lectures (Christian)/Pauline Epistles.pdf"),
]
OUT_DIR = ROOT / "content" / "resources"


FIXED_IDS = {
    "19. Samuel Amirtharaj_Pauline 1_Romans 1.docx": "samuel-romans-1",
    "20. Samuel Amirtharaj_Pauline 1_Romans 2.docx": "samuel-romans-2",
    "21. Samuel Amirtharaj_Pauline 1_Romans 3.docx": "samuel-romans-3",
    "22. Samuel Amirtharaj_Pauline 1_Romans 4.docx": "samuel-romans-4",
    "23. Samuel Amirtharaj_Pauline 1_Romans 5.docx": "samuel-romans-5",
    "24. Samuel Amirtharaj_Pauline 1_Romans 6.docx": "samuel-romans-6",
    "25. Samuel Amirtharaj_Pauline 1_Romans 7.docx": "samuel-romans-7",
    "26. Samuel Amirtharaj_Pauline 1_Romans 8.docx": "samuel-romans-8",
    "27. Samuel Amirtharaj_Pauline 1_Romans 9.docx": "samuel-romans-9",
    "28. Samuel Amirtharaj_Pauline 1_Romans 12.docx": "samuel-romans-12",
    "29. Samuel Amirtharaj_Pauline 1_Romans 13.docx": "samuel-romans-13",
    "30. Samuel Amirtharaj_Pauline 1_Romans 14.docx": "samuel-romans-14",
    "Lecture_21_-_Historical_Background_of_Romans.docx": "lecture-romans-background",
    "Lecture_23_-_Romans_5-6.docx": "lecture-romans-5-6",
    "Lecture_24_-_Romans_7-8.docx": "lecture-romans-7-8",
    "Lecture_25_-_Romans_9-11.docx": "lecture-romans-9-11",
    "Lecture_26_-_Romans_12-13.docx": "lecture-romans-12-13",
    "Lecture_27_-_Romans_14-16.docx": "lecture-romans-14-16",
    "Articles on Romans - Waggoner.pdf": "waggoner-articles-romans",
    "Exploring Romans A Devotional Commentary (George R. Knight) (z-library.sk, 1lib.sk, z-lib.sk).pdf": "knight-exploring-romans",
    "Experiencing Jesus Through Romans (Jay Gallimore) (z-library.sk, 1lib.sk, z-lib.sk).pdf": "gallimore-experiencing-romans",
    "Romans for the Everyday Man by Thomas A. Davis (z-lib.org).pdf": "davis-romans-everyday-man",
    "Encountering the Book of Romans A Theological Survey, 2nd Edition by Douglas J. Moo (z-lib.org).epub.pdf": "moo-encountering-romans",
    "Romans (Douglas J. Moo [Moo, Douglas J.]) (z-library.sk, 1lib.sk, z-lib.sk).pdf": "moo-romans-commentary",
    "Romans (Thomas R. Schreiner) (z-lib.org).epub.pdf": "schreiner-romans-commentary",
    "The Message of Romans Gods Good News for the World (The Bible Speaks Today Series) (John Stott [Stott, John]) (z-lib.org).pdf": "stott-message-romans",
    "The letter of Paul to the Romans  an introduction and commentary (Bruce, F. F. (Frederick Fyvie), 1910-1990 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf": "bruce-letter-romans",
    "Romans 1-7 for You For Reading, for Feeding, for Leading (Keller, Timothy) (Z-Library).pdf": "keller-romans-1-7",
    "Romans 8-16 for You For Reading, for Feeding, for Leading (Timothy Keller [Keller, Timothy]) (Z-Library).pdf": "keller-romans-8-16",
    "399971232-Romans-1-7-For-You-For-reading-Timothy-Keller-pdf.pdf": "keller-romans-1-7-alt",
    "0027, Romans 1;16-17.pdf": "romans-1-16-17-handout",
    "0601, Romans 12;1.pdf": "romans-12-1-handout",
    "0621, Righteousness by Faith - Romans 10.6;13.pdf": "romans-10-6-13-righteousness-by-faith",
    "1013, Romans 8.pdf": "romans-8-handout",
    "1076, Romans 5;3-5.pdf": "romans-5-3-5-handout",
    "Pauline Epistles.pdf": "hartland-pauline-epistles",
}


AUTHOR_HINTS = [
    ("Waggoner", "E. J. Waggoner", "Adventist"),
    ("George R. Knight", "George R. Knight", "Adventist"),
    ("Jay Gallimore", "Jay Gallimore", "Adventist"),
    ("Thomas A. Davis", "Thomas A. Davis", "Adventist"),
    ("Samuel Amirtharaj", "Samuel Amirtharaj", "Adventist"),
    ("Lecture_", "Samuel Amirtharaj", "Adventist"),
    ("Pauline Epistles", "Hartland College / Didasko", "Adventist"),
    ("Douglas J. Moo", "Douglas J. Moo", "Mainstream conservative"),
    ("Thomas R. Schreiner", "Thomas R. Schreiner", "Mainstream conservative"),
    ("John Stott", "John Stott", "Mainstream conservative"),
    ("Bruce", "F. F. Bruce", "Mainstream conservative"),
    ("Keller", "Timothy Keller", "Mainstream conservative"),
    ("Timothy", "Timothy Keller", "Mainstream conservative"),
    ("Martyn Lloyd Jones", "Martyn Lloyd-Jones", "Mainstream conservative"),
    ("MacArthur", "John F. MacArthur", "Mainstream conservative"),
    ("Thiselton", "Anthony C. Thiselton", "Mainstream academic"),
    ("N. T. Wright", "N. T. Wright", "Mainstream academic"),
    ("Scot McKnight", "Scot McKnight", "Mainstream academic"),
    ("Michael F. Bird", "Michael F. Bird", "Mainstream academic"),
    ("Michael J. Gorman", "Michael J. Gorman", "Mainstream academic"),
    ("Beverly Roberts Gaventa", "Beverly Roberts Gaventa", "Mainstream academic"),
    ("Klaus Haacker", "Klaus Haacker", "Mainstream academic"),
    ("Paul J. Achtemeier", "Paul J. Achtemeier", "Mainstream academic"),
    ("Myer Pearlman", "Myer Pearlman", "Conservative devotional"),
]


def ascii_clean(value: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value


def slugify(value: str) -> str:
    value = ascii_clean(value).lower()
    value = re.sub(r"\([^)]*\)", " ", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value[:80] or "resource"


def normalized_name(path: Path) -> str:
    stem = ascii_clean(path.stem)
    stem = re.sub(r"\s+2$", "", stem)
    return f"{stem}{path.suffix.lower()}"


def title_from_filename(path: Path) -> str:
    title = ascii_clean(path.stem)
    title = re.sub(r"^\d+[.,]?\s*", "", title)
    title = title.replace("_", " ")
    title = re.sub(r"\s*\((?:z-lib|Z-Library|z-library|1lib|z-library\.sk|z-lib\.org)[^)]*\)", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title or path.stem


def infer_author_and_tradition(path: Path) -> tuple[str, str]:
    name = ascii_clean(path.name)
    for needle, author, tradition in AUTHOR_HINTS:
        if needle in name:
            return author, tradition
    return "Various", "Reference"


def infer_type(path: Path) -> str:
    name = path.name
    if name == "Pauline Epistles.pdf":
        return "Lecture notes"
    if name.endswith(".docx"):
        return "Lecture notes" if name.startswith("Lecture_") else "Class notes"
    if "handout" in name.lower() or re.match(r"^\d{4},", name):
        return "Topical PDF"
    return "Commentary or study resource"


def infer_category(tradition: str, path: Path) -> str:
    name = path.name
    if name == "Pauline Epistles.pdf":
        return "Controlling Adventist lecture source"
    if "Samuel Amirtharaj" in name or name.startswith("Lecture_"):
        return "Controlling user resource"
    if tradition == "Adventist":
        return "Adventist interpretive guide"
    if tradition.startswith("Mainstream"):
        return "Conservative support and comparison"
    return "Supplementary reference"


def infer_coverage(path: Path) -> list[str]:
    name = ascii_clean(path.name)
    ranges: list[str] = []
    if name == "Pauline Epistles.pdf":
        return ["Romans introduction", "Romans 1", "Romans 1:16-17", "Romans 3"]
    if "Romans 1;16-17" in name or "Romans 1-16-17" in name:
        ranges.append("Romans 1:16-17")
    if "Romans 12;1" in name:
        ranges.append("Romans 12:1")
    if "Romans 10.6;13" in name:
        ranges.append("Romans 10:6-13")
    if "Romans 8" in name and name.startswith("1013"):
        ranges.append("Romans 8")
    if "Romans 5;3-5" in name:
        ranges.append("Romans 5:3-5")
    match = re.search(r"Romans\s+(\d+)\.docx$", name)
    if match:
        ranges.append(f"Romans {int(match.group(1))}")
    match = re.search(r"Romans_(\d+)", name)
    if match:
        ranges.append(f"Romans {int(match.group(1))}")
    match = re.search(r"Romans_(\d+)-(\d+)", name)
    if match:
        ranges.append(f"Romans {int(match.group(1))}-{int(match.group(2))}")
    match = re.search(r"Romans_(\d+)-(\d+)", name)
    if match:
        ranges.append(f"Romans {int(match.group(1))}-{int(match.group(2))}")
    match = re.search(r"Romans\s+(\d+)-(\d+)", name)
    if match:
        ranges.append(f"Romans {int(match.group(1))}-{int(match.group(2))}")
    if "Chapters 1-8" in name or "Romans Part 1" in name:
        ranges.append("Romans 1-8")
    if "Chapters 6-16" in name or "Romans Part 2" in name:
        ranges.append("Romans 6-16")
    if not ranges:
        ranges.append("Romans")
    return sorted(set(ranges))


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extraction_metrics(path: Path) -> dict[str, object]:
    if path.suffix.lower() == ".docx":
        if Document is None:
            return {"status": "missing-python-docx"}
        try:
            doc = Document(str(path))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return {
                "status": "readable",
                "paragraphs": len(paragraphs),
                "firstTextChars": len(paragraphs[0]) if paragraphs else 0,
            }
        except Exception as exc:
            return {"status": "error", "message": str(exc)}
    if path.suffix.lower() == ".pdf":
        if PdfReader is None:
            return {"status": "missing-pypdf"}
        try:
            reader = PdfReader(str(path))
            first_text = ""
            if reader.pages:
                first_text = reader.pages[0].extract_text() or ""
            return {
                "status": "readable" if first_text.strip() else "opened-no-first-page-text",
                "pages": len(reader.pages),
                "firstTextChars": len(first_text.strip()),
            }
        except Exception as exc:
            return {"status": "error", "message": str(exc)}
    return {"status": "unsupported"}


def fixed_or_generated_id(path: Path) -> str:
    if path.name in FIXED_IDS:
        return FIXED_IDS[path.name]
    normalized = normalized_name(path)
    for filename, source_id in FIXED_IDS.items():
        if normalized_name(Path(filename)) == normalized:
            return source_id
    return slugify(title_from_filename(path))


def build_manifest() -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    if not SOURCE_DIR.exists():
        raise SystemExit(f"Romans source directory not found: {SOURCE_DIR}")

    missing_extra_sources = [str(path) for path in EXTRA_SOURCE_FILES if not path.exists()]
    if missing_extra_sources:
        raise SystemExit(f"Extra Romans source files not found: {missing_extra_sources}")

    files = sorted(
        [
            *[path for path in SOURCE_DIR.iterdir() if path.suffix.lower() in {".docx", ".pdf"}],
            *[path for path in EXTRA_SOURCE_FILES if path.suffix.lower() in {".docx", ".pdf"}],
        ],
        key=lambda path: (normalized_name(path).lower(), bool(re.search(r"\s+2$", ascii_clean(path.stem))), path.name.lower()),
    )
    by_normalized: dict[str, str] = {}
    by_hash: dict[str, str] = {}
    inventory: list[dict[str, object]] = []
    bibliography: list[dict[str, object]] = [
        {
            "id": "kjv-gutenberg-30",
            "title": "The Bible, King James Version, Complete",
            "author": "Project Gutenberg",
            "type": "Bible text",
            "tradition": "Public domain",
            "interpretiveCategory": "Primary text",
            "howUsed": "Source for the Romans KJV verse text in this study workspace.",
            "citationFormat": "Project Gutenberg eBook #30, The Bible, King James Version, Complete.",
        }
    ]
    seen_ids = {"kjv-gutenberg-30"}

    for path in files:
        source_id = fixed_or_generated_id(path)
        checksum = file_sha256(path)
        duplicate_of = by_hash.get(checksum) or by_normalized.get(normalized_name(path))
        by_hash.setdefault(checksum, source_id)
        by_normalized.setdefault(normalized_name(path), source_id)
        author, tradition = infer_author_and_tradition(path)
        title = title_from_filename(path)
        resource_type = infer_type(path)
        category = infer_category(tradition, path)
        coverage = infer_coverage(path)
        metrics = extraction_metrics(path)
        item = {
            "id": source_id,
            "filename": ascii_clean(path.name),
            "normalizedFilename": normalized_name(path),
            "fileType": path.suffix.lower().lstrip("."),
            "sha256": checksum,
            "bytes": path.stat().st_size,
            "duplicateOf": duplicate_of,
            "coverage": coverage,
            "extraction": metrics,
            "title": title,
            "author": author,
            "tradition": tradition,
            "interpretiveCategory": category,
        }
        inventory.append(item)

        if duplicate_of or source_id in seen_ids:
            continue

        seen_ids.add(source_id)
        bibliography.append(
            {
                "id": source_id,
                "title": title,
                "author": author,
                "type": resource_type,
                "tradition": tradition,
                "interpretiveCategory": category,
                "howUsed": (
                    "Used as a controlling source for Adventist-oriented synthesis."
                    if category in {"Controlling user resource", "Controlling Adventist lecture source", "Adventist interpretive guide"}
                    else "Used as a supporting source for grammar, historical setting, structure, and comparison."
                ),
                "citationFormat": f"{author}. {title}. Local study file: {ascii_clean(path.name)}.",
            }
        )

    return inventory, bibliography


def main() -> int:
    inventory, bibliography = build_manifest()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "source-inventory.json").write_text(
        json.dumps(
            {
                "sourceDirectory": str(SOURCE_DIR),
                "additionalSourceFiles": [str(path) for path in EXTRA_SOURCE_FILES],
                "note": "Metadata only. No extracted source text is stored in this manifest.",
                "resources": inventory,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "bibliography.json").write_text(
        json.dumps({"resources": bibliography}, indent=2) + "\n",
        encoding="utf-8",
    )
    readable = sum(1 for item in inventory if item["extraction"]["status"] == "readable")
    duplicates = sum(1 for item in inventory if item["duplicateOf"])
    print(
        f"Inventoried {len(inventory)} source files; {len(bibliography)} bibliography entries; "
        f"{duplicates} duplicates; {readable} readable smoke checks."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
