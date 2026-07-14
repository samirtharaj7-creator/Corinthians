#!/usr/bin/env python3
"""Validate the private Corinthians PDF corpus and full-text search index."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path


ROOT = Path.cwd()
DEFAULT_CORPUS = ROOT / ".research" / "corinthians-corpus"
DEFAULT_MANIFEST = ROOT / ".research" / "corinthians-source-manifest.json"
DEFAULT_PUBLIC_SUMMARY = ROOT / "research" / "corinthians-corpus-summary.json"

REQUIRED_SUPPLEMENTAL_SOURCES = {
    "3219f55568bfee58ee95d5403a7208f5ba2f53a9f645c7fc265a4c4b463358f0": {
        "pages": 182,
        "coverage": "1 Corinthians",
    },
    "4c8d88c6759142ab50d41cbcb6267b25c2d2d7957dc177d32fe63d34ff842462": {
        "pages": 118,
        "coverage": "2 Corinthians",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--public-summary", type=Path, default=DEFAULT_PUBLIC_SUMMARY)
    return parser.parse_args()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    args = parse_args()
    corpus = args.corpus.expanduser().resolve()
    manifest_path = args.manifest.expanduser().resolve()
    public_summary_path = args.public_summary.expanduser().resolve()
    database_path = corpus / "index.sqlite3"
    require(manifest_path.exists(), f"Metadata manifest is missing: {manifest_path}")
    require(public_summary_path.exists(), f"Public-safe corpus summary is missing: {public_summary_path}")
    require(database_path.exists(), f"Search database is missing: {database_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    summary = manifest["summary"]
    resources = manifest["resources"]
    public_summary = json.loads(public_summary_path.read_text(encoding="utf-8"))
    require("sourceDirectory" not in manifest, "Metadata-only manifest must not expose an absolute source path.")
    require("resources" not in public_summary, "Public-safe summary must not expose named resources.")
    require("sourceDirectory" not in public_summary, "Public-safe summary must not expose a source path.")
    require(public_summary.get("summary") == summary, "Public-safe aggregate statistics do not match the private manifest.")
    require(summary["files"] == len(resources), "Manifest file count is inconsistent.")
    require(
        summary["uniqueFiles"] == sum(1 for item in resources if not item["duplicateOf"]),
        "Manifest unique-file count is inconsistent.",
    )
    require(
        summary["duplicates"] == sum(1 for item in resources if item["duplicateOf"]),
        "Manifest duplicate count is inconsistent.",
    )
    require(
        summary["pages"]
        == sum(item["pageCount"] for item in resources if not item["duplicateOf"]),
        "Manifest canonical page count is inconsistent.",
    )
    require(
        summary["words"]
        == sum(item["wordCount"] for item in resources if not item["duplicateOf"]),
        "Manifest word count is inconsistent.",
    )
    require(
        summary["readable"] == summary["uniqueFiles"],
        f"Every unique PDF must be readable; found {summary['readable']} of {summary['uniqueFiles']}.",
    )
    require(summary["needsOcr"] == 0, f"No PDF should remain pending OCR; found {summary['needsOcr']}.")
    require(summary["ocrPages"] > 0, "The scanned source should contribute OCR pages.")
    require(all(item["extractionStatus"] == "readable" for item in resources), "A manifest resource is not readable.")
    require(not any(item["needsOcr"] for item in resources), "A manifest resource still needs OCR.")

    unique_resources = [item for item in resources if not item["duplicateOf"]]
    require(
        len(list((corpus / "text").glob("*.txt"))) == summary["uniqueFiles"],
        "Expected one full-text file per unique PDF.",
    )

    resources_by_hash = {item["sha256"]: item for item in unique_resources}
    for checksum, expectation in REQUIRED_SUPPLEMENTAL_SOURCES.items():
        item = resources_by_hash.get(checksum)
        require(item is not None, f"Required supplemental source is missing: {checksum[:16]}.")
        require(
            item["pageCount"] == expectation["pages"],
            f"Required supplemental source {checksum[:16]} has {item['pageCount']} pages; "
            f"expected {expectation['pages']}.",
        )
        require(
            expectation["coverage"] in item["coverage"],
            f"Required supplemental source {checksum[:16]} has unexpected coverage metadata.",
        )

    connection = sqlite3.connect(database_path)
    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        require(integrity == "ok", f"SQLite integrity check failed: {integrity}")
        require(not connection.execute("PRAGMA foreign_key_check").fetchall(), "SQLite foreign-key check failed.")

        source_count = connection.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
        page_count = connection.execute("SELECT COUNT(*) FROM pages").fetchone()[0]
        chunk_count = connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
        fts_count = connection.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
        require(source_count == summary["files"], "Database source count does not match the manifest.")
        require(page_count == summary["pages"], "Database page count does not match the manifest.")
        require(chunk_count == summary["chunks"], "Database chunk count does not match the manifest.")
        require(fts_count == chunk_count, "FTS row count does not match the chunk count.")

        for checksum, expectation in REQUIRED_SUPPLEMENTAL_SOURCES.items():
            row = connection.execute(
                "SELECT source_id, page_count, extraction_status FROM sources "
                "WHERE sha256 = ? AND duplicate_of IS NULL",
                (checksum,),
            ).fetchone()
            require(row is not None, f"Required supplemental source is absent from SQLite: {checksum[:16]}.")
            require(
                row[1:] == (expectation["pages"], "readable"),
                f"Required supplemental source {checksum[:16]} has invalid SQLite metadata: {row[1:]}",
            )

        for item in unique_resources:
            row = connection.execute(
                "SELECT COUNT(*), MIN(page_number), MAX(page_number) FROM pages WHERE source_id = ?",
                (item["id"],),
            ).fetchone()
            require(
                row == (item["pageCount"], 1, item["pageCount"]),
                f"Page sequence is incomplete for {item['id']}: {row}",
            )

        smoke_queries = {
            '"resurrection"': None,
            '"spiritual" AND "gifts"': None,
            '"collection"': None,
            '"new" AND "covenant"': None,
            '"agonistic" AND "paradigm"': "corinthians-1def536135321410",
        }
        for query, expected_source in smoke_queries.items():
            rows = connection.execute(
                "SELECT source_id FROM chunks_fts WHERE chunks_fts MATCH ? LIMIT 25",
                (query,),
            ).fetchall()
            require(rows, f"Smoke query returned no results: {query}")
            if expected_source:
                require(
                    any(row[0] == expected_source for row in rows),
                    f"OCR smoke query did not return the expected scanned source: {query}",
                )
    finally:
        connection.close()

    print(
        "Corinthians research library validated: "
        f"{summary['files']} PDFs, {summary['uniqueFiles']} unique sources, "
        f"{summary['pages']:,} pages, {summary['words']:,} words, "
        f"{summary['chunks']:,} searchable chunks, and {summary['ocrPages']} OCR pages."
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as exc:
        print(f"Corinthians research library validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
