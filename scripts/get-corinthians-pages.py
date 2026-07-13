#!/usr/bin/env python3
"""Retrieve page-aware text from the private Corinthians research corpus."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path


ROOT = Path.cwd()
DEFAULT_DATABASE = ROOT / ".research" / "corinthians-corpus" / "index.sqlite3"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_id")
    parser.add_argument("pages", help="One page or an inclusive range, such as 42 or 42-45")
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--json", action="store_true")
    return parser.parse_args()


def parse_range(value: str) -> tuple[int, int]:
    pieces = value.split("-", 1)
    try:
        start = int(pieces[0])
        end = int(pieces[1]) if len(pieces) == 2 else start
    except ValueError as exc:
        raise SystemExit("Pages must be a number or inclusive range such as 42-45.") from exc
    if start < 1 or end < start:
        raise SystemExit("The page range must be positive and increasing.")
    if end - start > 19:
        raise SystemExit("Retrieve at most 20 pages at a time.")
    return start, end


def main() -> int:
    args = parse_args()
    start, end = parse_range(args.pages)
    database = args.database.expanduser().resolve()
    if not database.exists():
        raise SystemExit(f"Corpus index not found: {database}")

    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    try:
        source = connection.execute(
            "SELECT source_id, title, author, page_count FROM sources WHERE source_id = ?",
            (args.source_id,),
        ).fetchone()
        if not source:
            raise SystemExit(f"Unknown source ID: {args.source_id}")
        rows = connection.execute(
            """
            SELECT page_number, extraction_method, text
            FROM pages
            WHERE source_id = ? AND page_number BETWEEN ? AND ?
            ORDER BY page_number
            """,
            (args.source_id, start, end),
        ).fetchall()
    finally:
        connection.close()

    if not rows:
        raise SystemExit(f"No pages found for {args.source_id} in range {start}-{end}.")

    payload = {
        "sourceId": source["source_id"],
        "title": source["title"],
        "author": source["author"],
        "requestedPages": args.pages,
        "pages": [dict(row) for row in rows],
    }
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    print(f"{source['title']} — {source['author']} ({source['source_id']})")
    for row in rows:
        print(f"\n=== PAGE {row['page_number']} [{row['extraction_method']}] ===\n")
        print(row["text"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
