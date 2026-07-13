#!/usr/bin/env python3
"""Search the local Corinthians PDF corpus and return page-aware excerpts."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path


ROOT = Path.cwd()
DEFAULT_DATABASE = ROOT / ".research" / "corinthians-corpus" / "index.sqlite3"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query")
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--source", help="Restrict results to one source ID")
    parser.add_argument("--max-chars", type=int, default=900)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--raw", action="store_true", help="Use raw SQLite FTS5 query syntax")
    return parser.parse_args()


def safe_query(value: str) -> str:
    terms = re.findall(r"[\w’'-]+", value, flags=re.UNICODE)
    if not terms:
        raise SystemExit("Search query must include at least one word.")
    return " AND ".join(f'"{term.replace(chr(34), chr(34) * 2)}"' for term in terms)


def main() -> int:
    args = parse_args()
    database = args.database.expanduser().resolve()
    if not database.exists():
        raise SystemExit(
            f"Corpus index not found: {database}\n"
            "Run scripts/ingest-corinthians-library.py first."
        )
    query = args.query if args.raw else safe_query(args.query)
    sql = """
      SELECT
        chunk_id,
        source_id,
        title,
        author,
        page_start,
        page_end,
        text,
        bm25(chunks_fts, 0.0, 0.0, 2.0, 1.0, 0.6, 0.0, 0.0, 1.0) AS score
      FROM chunks_fts
      WHERE chunks_fts MATCH ?
    """
    params: list[object] = [query]
    if args.source:
        sql += " AND source_id = ?"
        params.append(args.source)
    sql += " ORDER BY score LIMIT ?"
    params.append(max(1, args.limit))

    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(sql, params).fetchall()
    except sqlite3.OperationalError as exc:
        raise SystemExit(f"Invalid search query: {exc}") from exc
    finally:
        connection.close()

    results = []
    for row in rows:
        excerpt = re.sub(r"\s+", " ", row["text"]).strip()
        if len(excerpt) > args.max_chars:
            excerpt = excerpt[: args.max_chars].rsplit(" ", 1)[0] + "..."
        results.append(
            {
                "chunkId": row["chunk_id"],
                "sourceId": row["source_id"],
                "title": row["title"],
                "author": row["author"],
                "pages": (
                    str(row["page_start"])
                    if row["page_start"] == row["page_end"]
                    else f"{row['page_start']}-{row['page_end']}"
                ),
                "score": row["score"],
                "excerpt": excerpt,
            }
        )

    if args.json:
        print(json.dumps({"query": args.query, "results": results}, ensure_ascii=False, indent=2))
        return 0

    if not results:
        print("No matching corpus passages found.")
        return 0
    for index, result in enumerate(results, start=1):
        print(f"{index}. {result['title']} - {result['author']}")
        print(f"   Source: {result['sourceId']} | Pages: {result['pages']}")
        print(f"   {result['excerpt']}")
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
