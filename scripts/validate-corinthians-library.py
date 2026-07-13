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
    require(summary["files"] == 38, f"Expected 38 PDF files; found {summary['files']}.")
    require(summary["uniqueFiles"] == 37, f"Expected 37 unique PDFs; found {summary['uniqueFiles']}.")
    require(summary["duplicates"] == 1, f"Expected one duplicate; found {summary['duplicates']}.")
    require(summary["pages"] == 8054, f"Expected 8,054 canonical pages; found {summary['pages']}.")
    require(summary["readable"] == 37, f"Every unique PDF must be readable; found {summary['readable']}.")
    require(summary["needsOcr"] == 0, f"No PDF should remain pending OCR; found {summary['needsOcr']}.")
    require(summary["ocrPages"] > 0, "The scanned source should contribute OCR pages.")
    require(all(item["extractionStatus"] == "readable" for item in resources), "A manifest resource is not readable.")
    require(not any(item["needsOcr"] for item in resources), "A manifest resource still needs OCR.")

    unique_resources = [item for item in resources if not item["duplicateOf"]]
    require(len(unique_resources) == 37, "Canonical resource count is inconsistent.")
    require(len(list((corpus / "text").glob("*.txt"))) == 37, "Expected one full-text file per unique PDF.")

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
