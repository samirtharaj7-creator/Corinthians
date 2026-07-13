#!/usr/bin/env python3
"""Extract and index the local Corinthians PDF library for private research.

Full extracted text, the SQLite index, and the named source manifest are written
under `.research/`, which is intentionally ignored by Git. Only aggregate
corpus statistics are written under `research/`.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import logging
import re
import shutil
import sqlite3
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader


ROOT = Path.cwd()
DEFAULT_SOURCE_DIR = Path("/Users/samuel/Desktop/Corinthians")
DEFAULT_OUTPUT_DIR = ROOT / ".research" / "corinthians-corpus"
DEFAULT_OCR_DIR = ROOT / ".research" / "corinthians-ocr"
PRIVATE_MANIFEST_PATH = ROOT / ".research" / "corinthians-source-manifest.json"
SAFE_SUMMARY_PATH = ROOT / "research" / "corinthians-corpus-summary.json"

AUTHOR_HINTS = [
    ("Kay Arthur", "Kay Arthur"),
    ("Paul Stevens  Dan Williams", "Paul Stevens; Dan Williams"),
    ("Paul Stevens", "Paul Stevens"),
    ("Andrew Wilson", "Andrew Wilson"),
    ("Carson, D. A", "D. A. Carson"),
    ("D. A. Carson", "D. A. Carson"),
    ("James A. Davis", "James A. Davis"),
    ("Ben Witherington III", "Ben Witherington III"),
    ("Daniel L. Akin", "Daniel L. Akin; James Merritt"),
    ("Hays, Richard B", "Richard B. Hays"),
    ("L. Ann Jervis", "L. Ann Jervis; Peter Richardson"),
    ("Michael Lakey", "Michael Lakey"),
    ("Matthew R. Malcolm", "Matthew R. Malcolm"),
    ("Bailey, Kenneth E", "Kenneth E. Bailey"),
    ("Margaret M. Mitchell", "Margaret M. Mitchell"),
    ("Mark D. Nanos", "Mark D. Nanos"),
    ("Ron Cameron", "Ron Cameron; Merrill P. Miller"),
    ("Ryan S. Schellenberg", "Ryan S. Schellenberg"),
    ("Ernest Best", "Ernest Best"),
    ("Best, Ernest", "Ernest Best"),
    ("Paul Han", "Paul Han"),
    ("Robert Dutch", "Robert Dutch"),
    ("Kar Yong Lim", "Kar Yong Lim"),
]

COVERAGE_HINTS = [
    ("01 God's People in Corinth", ["1 Corinthians 1"]),
    ("02 Divisions in Corinth", ["1 Corinthians 1-4"]),
    ("03 Sexual Immorality in Corinth", ["1 Corinthians 5-7"]),
    ("05 Food Offered to Idols", ["1 Corinthians 8-10"]),
    ("1 Corinthians 13 and Survival", ["1 Corinthians 13"]),
    ("Image and Glory of God", ["1 Corinthians 11:2-16"]),
    ("Showing the Spirit", ["1 Corinthians 12-14"]),
    ("A model of Christian maturity", ["2 Corinthians 10-13"]),
    ("Rethinking Pauls Rhetorical Education", ["2 Corinthians 10-13"]),
    ("Swimming in the Sea of Scripture", ["2 Corinthians 4:7-13:13"]),
    ("The Sufferings of Christ", ["2 Corinthians"]),
    ("Paul for Everyone. 1 Corinthians", ["1 Corinthians"]),
    ("Paul for Everyone. 2 Corinthians", ["2 Corinthians"]),
    ("Syllabus 1 Corinthians", ["1 Corinthians"]),
    ("Syllabus 2 Corinthians", ["2 Corinthians"]),
    ("Second Corinthians", ["2 Corinthians"]),
    ("2 Corinthians", ["2 Corinthians"]),
    ("First Corinthians", ["1 Corinthians"]),
    ("1 Corinthians", ["1 Corinthians"]),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--ocr-dir", type=Path, default=DEFAULT_OCR_DIR)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--chunk-words", type=int, default=450)
    parser.add_argument("--chunk-overlap", type=int, default=60)
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value[:72] or "source"


def filename_title(path: Path) -> str:
    title = unicodedata.normalize("NFKC", path.stem).replace("_", " ")
    title = re.sub(
        r"\s*\((?:[^)]*(?:z-library|z-lib|1lib)[^)]*)\)\s*",
        " ",
        title,
        flags=re.IGNORECASE,
    )
    title = re.sub(r"\s+", " ", title).strip()
    return title


def infer_author(filename: str, metadata_author: str | None) -> str:
    for needle, author in AUTHOR_HINTS:
        if needle.casefold() in filename.casefold():
            return author
    if metadata_author and metadata_author.strip() and metadata_author.casefold() not in {
        "unknown",
        "anonymous",
        "microsoft word",
    } and not re.fullmatch(r"[A-Za-z]?\d{3,}", metadata_author.strip()):
        return metadata_author.strip()
    return "Various"


def infer_coverage(filename: str) -> list[str]:
    lowered = filename.casefold()
    if any(token in lowered for token in ["1 & 2 corinthians", "1-2 corinthians", "1 and 2 corinthians"]):
        return ["1 Corinthians", "2 Corinthians"]
    for needle, coverage in COVERAGE_HINTS:
        if needle.casefold() in lowered:
            return coverage
    return ["Corinthians and Pauline studies"]


def usable_metadata_title(value: str | None) -> bool:
    if not value:
        return False
    lowered = value.casefold().strip()
    return not (
        lowered in {"untitled", "document"}
        or lowered.startswith("microsoft word")
        or re.fullmatch(r"binder\d*(?:\.pdf)?", lowered)
        or lowered.endswith((".pdf", ".doc", ".docx"))
    )


def clean_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    value = value.replace("\x00", "").replace("\u00ad", "")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"(?<=[A-Za-z])-\n(?=[a-z])", "", value)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.split("\n")]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def safe_metadata_value(value: Any) -> str | None:
    if value is None:
        return None
    text = clean_text(str(value))
    return text[:500] if text else None


def extract_pdf(job: dict[str, Any]) -> dict[str, Any]:
    path = Path(job["path"])
    result: dict[str, Any] = {
        "source_id": job["source_id"],
        "pages": [],
        "page_errors": [],
        "metadata_title": None,
        "metadata_author": None,
        "encrypted": False,
    }
    try:
        reader = PdfReader(str(path), strict=False)
        result["encrypted"] = bool(reader.is_encrypted)
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                pass
        metadata = reader.metadata or {}
        result["metadata_title"] = safe_metadata_value(getattr(metadata, "title", None))
        result["metadata_author"] = safe_metadata_value(getattr(metadata, "author", None))
        for page_number, page in enumerate(reader.pages, start=1):
            try:
                text = clean_text(page.extract_text() or "")
            except Exception as exc:  # keep other pages usable
                text = ""
                result["page_errors"].append({"page": page_number, "message": str(exc)[:400]})
            result["pages"].append(
                {"page": page_number, "text": text, "method": "text-layer" if text else "none"}
            )
    except Exception as exc:
        result["fatal_error"] = str(exc)[:1000]
    return result


def load_ocr_override(path: Path, expected_pages: int) -> list[dict[str, Any]]:
    value = path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^=== Page (\d+) ===\s*$", value, flags=re.MULTILINE))
    pages = []
    for index, match in enumerate(matches):
        page_number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(value)
        text = clean_text(value[match.end() : end])
        pages.append({"page": page_number, "text": text, "method": "vision-ocr" if text else "none"})
    if len(pages) != expected_pages or [page["page"] for page in pages] != list(range(1, expected_pages + 1)):
        raise ValueError(
            f"OCR override {path} must contain contiguous pages 1-{expected_pages}; found {len(pages)} pages."
        )
    return pages


def make_chunks(
    source_id: str,
    pages: list[dict[str, Any]],
    chunk_words: int,
    overlap: int,
) -> list[dict[str, Any]]:
    words: list[tuple[str, int]] = []
    for page in pages:
        words.extend((word, int(page["page"])) for word in re.findall(r"\S+", page["text"]))
    if not words:
        return []
    step = max(1, chunk_words - overlap)
    chunks = []
    ordinal = 1
    for start in range(0, len(words), step):
        selected = words[start : start + chunk_words]
        if not selected:
            break
        chunks.append(
            {
                "chunk_id": f"{source_id}-c{ordinal:05d}",
                "source_id": source_id,
                "ordinal": ordinal,
                "page_start": selected[0][1],
                "page_end": selected[-1][1],
                "word_count": len(selected),
                "text": " ".join(word for word, _ in selected),
            }
        )
        ordinal += 1
        if start + chunk_words >= len(words):
            break
    return chunks


def init_database(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        CREATE TABLE sources (
          source_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          filename TEXT NOT NULL,
          sha256 TEXT NOT NULL,
          bytes INTEGER NOT NULL,
          page_count INTEGER NOT NULL,
          text_chars INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          extraction_status TEXT NOT NULL,
          ocr_pages INTEGER NOT NULL,
          extraction_methods TEXT NOT NULL,
          coverage TEXT NOT NULL,
          duplicate_of TEXT
        );
        CREATE TABLE pages (
          source_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          text TEXT NOT NULL,
          text_chars INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          extraction_method TEXT NOT NULL,
          PRIMARY KEY (source_id, page_number)
        );
        CREATE TABLE chunks (
          chunk_id TEXT PRIMARY KEY,
          source_id TEXT NOT NULL,
          ordinal INTEGER NOT NULL,
          page_start INTEGER NOT NULL,
          page_end INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          text TEXT NOT NULL
        );
        CREATE VIRTUAL TABLE chunks_fts USING fts5(
          chunk_id UNINDEXED,
          source_id UNINDEXED,
          title,
          author,
          coverage,
          page_start UNINDEXED,
          page_end UNINDEXED,
          text,
          tokenize = 'unicode61 remove_diacritics 2'
        );
        CREATE INDEX chunks_source_idx ON chunks(source_id, ordinal);
        """
    )
    return connection


def write_full_text(path: Path, item: dict[str, Any], pages: list[dict[str, Any]]) -> None:
    header = [
        f"Source ID: {item['id']}",
        f"Title: {item['title']}",
        f"Author: {item['author']}",
        f"Filename: {item['filename']}",
        f"Coverage: {', '.join(item['coverage'])}",
        "",
    ]
    body = []
    for page in pages:
        body.extend([f"=== PAGE {page['page']} ===", page["text"], ""])
    path.write_text("\n".join([*header, *body]).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    source_dir = args.source_dir.expanduser().resolve()
    output_dir = args.output_dir.expanduser().resolve()
    ocr_dir = args.ocr_dir.expanduser().resolve()
    if not source_dir.is_dir():
        raise SystemExit(f"Source directory not found: {source_dir}")
    if args.chunk_overlap >= args.chunk_words:
        raise SystemExit("--chunk-overlap must be smaller than --chunk-words")

    pdfs = sorted(source_dir.glob("*.pdf"), key=lambda path: path.name.casefold())
    if not pdfs:
        raise SystemExit(f"No PDF files found in {source_dir}")

    output_dir.parent.mkdir(parents=True, exist_ok=True)
    staging = output_dir.with_name(f"{output_dir.name}.staging")
    if staging.exists():
        shutil.rmtree(staging)
    (staging / "text").mkdir(parents=True)

    base_items = []
    canonical_by_hash: dict[str, str] = {}
    duplicate_count_by_hash: dict[str, int] = {}
    for path in pdfs:
        checksum = sha256_file(path)
        canonical_id = f"corinthians-{checksum[:16]}"
        duplicate_of = canonical_by_hash.get(checksum)
        duplicate_count_by_hash[checksum] = duplicate_count_by_hash.get(checksum, 0) + 1
        source_id = (
            canonical_id
            if duplicate_of is None
            else f"{canonical_id}-duplicate-{duplicate_count_by_hash[checksum]}"
        )
        canonical_by_hash.setdefault(checksum, canonical_id)
        base_items.append(
            {
                "path": str(path),
                "source_id": source_id,
                "filename": path.name,
                "filename_title": filename_title(path),
                "sha256": checksum,
                "bytes": path.stat().st_size,
                "duplicate_of": duplicate_of,
            }
        )

    canonical_jobs = [item for item in base_items if not item["duplicate_of"]]
    extracted_by_id: dict[str, dict[str, Any]] = {}
    logging.getLogger("pypdf").setLevel(logging.ERROR)
    with concurrent.futures.ProcessPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(extract_pdf, item): item for item in canonical_jobs}
        completed = 0
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            completed += 1
            try:
                extracted_by_id[item["source_id"]] = future.result()
            except Exception as exc:
                extracted_by_id[item["source_id"]] = {
                    "source_id": item["source_id"],
                    "pages": [],
                    "page_errors": [],
                    "fatal_error": str(exc)[:1000],
                }
            print(f"[{completed}/{len(canonical_jobs)}] extracted {item['filename']}", flush=True)

    database_path = staging / "index.sqlite3"
    connection = init_database(database_path)
    pages_jsonl = (staging / "pages.jsonl").open("w", encoding="utf-8")
    chunks_jsonl = (staging / "chunks.jsonl").open("w", encoding="utf-8")
    resources = []
    canonical_resource_by_id: dict[str, dict[str, Any]] = {}
    total_chunks = 0

    for base in base_items:
        duplicate_of = base["duplicate_of"]
        extracted = extracted_by_id.get(duplicate_of or base["source_id"], {})
        pages = extracted.get("pages", []) if not duplicate_of else []
        if not duplicate_of and pages and not any(page["text"].strip() for page in pages):
            override_path = ocr_dir / f"{base['sha256']}.txt"
            if override_path.exists():
                pages = load_ocr_override(override_path, len(pages))
                extracted["pages"] = pages
                extracted["ocr_override"] = str(override_path)
        canonical = canonical_resource_by_id.get(duplicate_of) if duplicate_of else None
        metadata_title = extracted.get("metadata_title")
        metadata_author = extracted.get("metadata_author")
        title = metadata_title if usable_metadata_title(metadata_title) else base["filename_title"]
        author = infer_author(base["filename"], metadata_author)
        coverage = infer_coverage(base["filename"])

        if duplicate_of and canonical:
            metrics = {key: canonical[key] for key in [
                "pageCount",
                "pagesWithText",
                "textChars",
                "wordCount",
                "extractionStatus",
                "needsOcr",
                "ocrPages",
                "extractionMethods",
                "pageErrors",
            ]}
        else:
            page_count = len(pages)
            pages_with_text = sum(1 for page in pages if len(page["text"].strip()) >= 30)
            text_chars = sum(len(page["text"]) for page in pages)
            word_count = sum(len(re.findall(r"\S+", page["text"])) for page in pages)
            ocr_pages = sum(1 for page in pages if page.get("method") == "vision-ocr" and page["text"])
            extraction_methods = sorted(
                {page.get("method", "unknown") for page in pages if page["text"].strip()}
            )
            ratio = pages_with_text / page_count if page_count else 0
            if extracted.get("fatal_error"):
                status = "error"
            elif text_chars == 0:
                status = "no-text"
            elif ratio < 0.5:
                status = "partial-text"
            else:
                status = "readable"
            metrics = {
                "pageCount": page_count,
                "pagesWithText": pages_with_text,
                "textChars": text_chars,
                "wordCount": word_count,
                "extractionStatus": status,
                "needsOcr": status in {"no-text", "partial-text"} and ocr_pages == 0,
                "ocrPages": ocr_pages,
                "extractionMethods": extraction_methods,
                "pageErrors": extracted.get("page_errors", []),
            }

        resource = {
            "id": base["source_id"],
            "filename": base["filename"],
            "title": title,
            "author": author,
            "sha256": base["sha256"],
            "bytes": base["bytes"],
            "duplicateOf": duplicate_of,
            "coverage": coverage,
            "encrypted": bool(extracted.get("encrypted", False)),
            **metrics,
        }
        resources.append(resource)
        if not duplicate_of:
            canonical_resource_by_id[base["source_id"]] = resource

        connection.execute(
            """
            INSERT INTO sources (
              source_id, title, author, filename, sha256, bytes, page_count,
              text_chars, word_count, extraction_status, ocr_pages,
              extraction_methods, coverage, duplicate_of
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                resource["id"],
                resource["title"],
                resource["author"],
                resource["filename"],
                resource["sha256"],
                resource["bytes"],
                resource["pageCount"],
                resource["textChars"],
                resource["wordCount"],
                resource["extractionStatus"],
                resource["ocrPages"],
                json.dumps(resource["extractionMethods"], ensure_ascii=False),
                json.dumps(resource["coverage"], ensure_ascii=False),
                resource["duplicateOf"],
            ),
        )

        if duplicate_of or resource["extractionStatus"] == "error":
            continue

        write_full_text(staging / "text" / f"{resource['id']}.txt", resource, pages)
        for page in pages:
            page_words = len(re.findall(r"\S+", page["text"]))
            record = {
                "source_id": resource["id"],
                "page": page["page"],
                "extraction_method": page.get("method", "unknown"),
                "text": page["text"],
            }
            pages_jsonl.write(json.dumps(record, ensure_ascii=False) + "\n")
            connection.execute(
                "INSERT INTO pages VALUES (?, ?, ?, ?, ?, ?)",
                (
                    resource["id"],
                    page["page"],
                    page["text"],
                    len(page["text"]),
                    page_words,
                    page.get("method", "unknown"),
                ),
            )

        chunks = make_chunks(resource["id"], pages, args.chunk_words, args.chunk_overlap)
        total_chunks += len(chunks)
        coverage_text = "; ".join(resource["coverage"])
        for chunk in chunks:
            chunks_jsonl.write(json.dumps(chunk, ensure_ascii=False) + "\n")
            connection.execute(
                "INSERT INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    chunk["chunk_id"],
                    chunk["source_id"],
                    chunk["ordinal"],
                    chunk["page_start"],
                    chunk["page_end"],
                    chunk["word_count"],
                    chunk["text"],
                ),
            )
            connection.execute(
                "INSERT INTO chunks_fts VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    chunk["chunk_id"],
                    chunk["source_id"],
                    resource["title"],
                    resource["author"],
                    coverage_text,
                    chunk["page_start"],
                    chunk["page_end"],
                    chunk["text"],
                ),
            )

    pages_jsonl.close()
    chunks_jsonl.close()
    connection.commit()
    connection.execute("PRAGMA optimize")
    connection.close()

    unique_resources = [item for item in resources if not item["duplicateOf"]]
    manifest = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "note": (
            "Metadata only. Full extracted text and the search index are local under "
            ".research/corinthians-corpus and must not be published."
        ),
        "summary": {
            "files": len(resources),
            "uniqueFiles": len(unique_resources),
            "duplicates": sum(1 for item in resources if item["duplicateOf"]),
            "readable": sum(1 for item in unique_resources if item["extractionStatus"] == "readable"),
            "needsOcr": sum(1 for item in unique_resources if item["needsOcr"]),
            "pages": sum(item["pageCount"] for item in unique_resources),
            "ocrPages": sum(item["ocrPages"] for item in unique_resources),
            "words": sum(item["wordCount"] for item in unique_resources),
            "chunks": total_chunks,
        },
        "resources": resources,
    }
    local_manifest = {"sourceDirectory": str(source_dir), **manifest}
    (staging / "manifest.json").write_text(
        json.dumps(local_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    PRIVATE_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    PRIVATE_MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    SAFE_SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SAFE_SUMMARY_PATH.write_text(
        json.dumps(
            {
                "version": manifest["version"],
                "generatedAt": manifest["generatedAt"],
                "note": "Aggregate statistics only. Named source metadata remains private under .research/.",
                "summary": manifest["summary"],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if output_dir.exists():
        shutil.rmtree(output_dir)
    staging.rename(output_dir)
    print(json.dumps(manifest["summary"], indent=2))
    print(f"Local corpus: {output_dir}")
    print(f"Private metadata manifest: {PRIVATE_MANIFEST_PATH}")
    print(f"Public-safe corpus summary: {SAFE_SUMMARY_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
