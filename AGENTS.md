# Corinthians Study Workspace

## Private research context

The local PDF research corpus lives under `.research/corinthians-corpus/` and is intentionally ignored by Git. Before drafting or revising historical, exegetical, theological, or cultural commentary, search it with:

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/search-corinthians-library.py "SEARCH TERMS"
```

Use `--json` when a machine-readable context pack is helpful. Search results include stable source IDs and PDF page spans for internal verification.

Retrieve the actual page text before relying on a search excerpt:

```bash
/Users/samuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/get-corinthians-pages.py SOURCE_ID PAGE-RANGE
```

## Copyright and public-output rules

- Use the corpus to form an independent factual synthesis in original wording.
- Do not copy long or distinctive passages from source PDFs into commentary.
- Do not expose source filenames, author credits, bibliography entries, page citations, or research-process language on public pages.
- Keep public `sources` and `sourceAudit` arrays empty unless the user explicitly changes this policy.
- Never import `.research/`, PDF files, extracted text, JSONL files, or SQLite databases into the Next.js application.
- Record private claim provenance under `.research/humanization/`, then draft from factual propositions rather than source sentences.

## Commentary voice

- Work passage-by-passage so adjacent verse notes share context without repeating it.
- Use a blended pastoral-scholarly and formal voice, with varied paragraph shape and length governed by the text.
- Avoid stock openings, balanced disclaimer chains, transferable applications, and automatic polished conclusions.
- Preserve Adventist theological safeguards while integrating them into the exegesis.
- Add no more than two selective `wordNotes` per verse. Greek lexical notes should show the Greek form and transliteration, explain the contextual sense, and avoid root or gloss fallacies.
- Run `validate:corinthians`, `validate:theology`, `validate:humanization`, and `audit:corinthians-copying` after content work.

## Corpus maintenance

- Rebuild with `scripts/ingest-corinthians-library.py` when the Desktop source folder changes.
- Validate with `scripts/validate-corinthians-library.py` after every rebuild.
- Private named inventory: `.research/corinthians-source-manifest.json`.
- Public-safe aggregate statistics: `research/corinthians-corpus-summary.json`.
- Full workflow notes: `research/README.md`.
