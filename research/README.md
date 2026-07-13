# Internal Corinthians Research Library

This workspace has a local, searchable corpus built from the PDFs in the external `Desktop/Corinthians` folder. The corpus is for research and synthesis while developing the commentary; it is not part of the public website.

Current indexed corpus: 38 PDF files, 37 unique sources, 8,054 canonical pages, 2,884,015 extracted words, and 7,410 searchable chunks. One 194-page scanned source was processed with macOS Vision OCR; 190 nonblank pages contributed OCR text.

## Rebuild the corpus

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/ingest-corinthians-library.py
```

The command writes full extracted text, page records, chunks, a SQLite FTS5 index, and a named metadata manifest under `.research/`. That directory is intentionally ignored by Git so copyrighted source text and source identities are not published or pushed to GitHub. Only aggregate corpus statistics are written to `research/corinthians-corpus-summary.json`.

The ingestion process can also consume page-numbered OCR overrides from `.research/corinthians-ocr/<sha256>.txt`. This is used for scanned books that do not contain a searchable text layer; the manifest records how many pages came from OCR.

## Search for future commentary work

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/search-corinthians-library.py "resurrection body 1 Corinthians 15"
```

Useful options:

- `--limit 12` changes the number of results.
- `--source SOURCE_ID` restricts results to one source.
- `--json` emits machine-readable results for a context pack.
- `--max-chars 1800` expands each returned excerpt.

Search results identify a source and page span. Retrieve the actual page text before drafting:

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/get-corinthians-pages.py SOURCE_ID 42-44
```

## Use policy

- Treat the corpus as internal research context.
- Write fresh synthesis in original wording; do not paste long source passages into public commentary.
- Do not expose source filenames, author credits, bibliography data, or research-process language on public pages.
- Keep page and source identifiers internally so claims can be checked during drafting and review.
- Build page-aware context packs under `.research/humanization/`; record the claim, source ID, page span, and confidence without copying source prose into public files.
- For word studies, search Greek spelling, transliteration, and English glosses separately, then verify the form and contextual sense with a proper language reference.

## Validate the corpus

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/validate-corinthians-library.py
```

Validation checks the manifest, every page sequence, SQLite integrity, FTS row counts, duplicate handling, OCR coverage, and representative research queries.
