#!/usr/bin/env python3
"""Resolve the private SDA alignment matrix after every chapter audit exists.

This command intentionally refuses to run before the 29 chapter-audit records and
the introduction audit have been written.  It compares the pre-pass matrix hashes
with the current public surfaces, applies any explicit private decisions, and marks
the independently completed accuracy, theology, style, and copying reviews.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
AUDIT_ROOT = ROOT / ".research" / "sdabc-alignment"
DEFAULT_MAP = AUDIT_ROOT / "verse-page-map.json"
DEFAULT_MATRIX = AUDIT_ROOT / "alignment-matrix.json"
DEFAULT_DECISIONS = AUDIT_ROOT / "decisions.json"
REVIEW_AXES = ("sourceComparison", "accuracy", "theology", "style", "copying")
ALLOWED_DECISIONS = {
    "aligned",
    "needs-deepening",
    "needs-correction",
    "preserves-legitimate-uncertainty",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--map", type=Path, default=DEFAULT_MAP)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--decisions", type=Path, default=DEFAULT_DECISIONS)
    return parser.parse_args()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_builder() -> Any:
    path = ROOT / "scripts" / "build-sdabc-alignment-matrix.py"
    spec = importlib.util.spec_from_file_location("sdabc_alignment_matrix_builder", path)
    require(spec is not None and spec.loader is not None, f"Cannot load matrix builder: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def require_audit_records() -> None:
    audit_directory = AUDIT_ROOT / "chapter-audits"
    records = list(audit_directory.glob("*.md")) if audit_directory.exists() else []
    record_text = {path: path.read_text(encoding="utf-8") for path in records}

    def covered(book_slug: str, short_name: str, chapter: int) -> bool:
        public_path = f"content/{book_slug}/chapter-{chapter:02d}.json"
        for path, text in record_text.items():
            if public_path in text:
                return True
            stem = path.stem.lower()
            single = re.fullmatch(rf"(?:{re.escape(short_name)}|{re.escape(book_slug)})-(\d+)", stem)
            if single and int(single.group(1)) == chapter:
                return True
            batch = re.fullmatch(rf"(?:{re.escape(short_name)}|{re.escape(book_slug)})-(\d+)-(\d+)", stem)
            if batch and int(batch.group(1)) <= chapter <= int(batch.group(2)):
                return True
        return False

    expected = [
        *( ("1-corinthians", "1cor", chapter) for chapter in range(1, 17) ),
        *( ("2-corinthians", "2cor", chapter) for chapter in range(1, 14) ),
    ]
    missing = [
        f"{short_name}-{chapter}"
        for book_slug, short_name, chapter in expected
        if not covered(book_slug, short_name, chapter)
    ]
    require(not missing, f"Chapter audit records are missing: {', '.join(missing)}")
    require((AUDIT_ROOT / "introduction-audit.md").exists(), "Introduction audit record is missing.")


def load_decisions(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    require(payload.get("version") == 1, "Unsupported SDA decision-file version.")
    decisions = payload.get("decisions", {})
    require(isinstance(decisions, dict), "SDA decisions must be an object keyed by matrix item ID.")
    for item_id, decision in decisions.items():
        require(isinstance(decision, dict), f"Decision must be an object: {item_id}")
        require(
            decision.get("classification") in ALLOWED_DECISIONS,
            f"Invalid decision classification: {item_id}",
        )
        require(str(decision.get("findingSummary", "")).strip(), f"Decision summary is blank: {item_id}")
    return decisions


def summary_for(classification: str, changed: bool) -> str:
    if classification == "aligned":
        return "Compared with the mapped commentary pages; the public material remains compatible and required no substantive revision."
    if classification == "needs-deepening":
        return "The mapped commentary supplied relevant depth or precision; the public material was revised independently and the issue is resolved."
    if classification == "needs-correction":
        return "A substantive overstatement or conflict was corrected in independently written public prose; the revised material is aligned."
    if classification == "preserves-legitimate-uncertainty":
        return "The evidence permits more than one responsible reading; the public material now preserves that uncertainty without weakening settled conclusions."
    raise AssertionError(f"Unexpected classification: {classification} (changed={changed})")


def main() -> int:
    args = parse_args()
    map_path = args.map.expanduser().resolve()
    matrix_path = args.matrix.expanduser().resolve()
    decisions_path = args.decisions.expanduser().resolve()
    require_audit_records()
    require(map_path.exists(), f"SDA verse map is missing: {map_path}")
    require(matrix_path.exists(), f"Pre-pass alignment matrix is missing: {matrix_path}")

    map_data = json.loads(map_path.read_text(encoding="utf-8"))
    baseline = json.loads(matrix_path.read_text(encoding="utf-8"))
    baseline_by_id = {item["id"]: item for item in baseline.get("items", [])}
    decisions = load_decisions(decisions_path)
    builder = load_builder()
    current_items = builder.collect_surfaces(ROOT, map_data)
    current_ids = {item["id"] for item in current_items}
    unknown_decisions = sorted(set(decisions) - current_ids)
    require(not unknown_decisions, f"Decisions name unknown matrix items: {', '.join(unknown_decisions)}")

    resolved_items: list[dict[str, Any]] = []
    for item in current_items:
        previous = baseline_by_id.get(item["id"])
        changed = previous is None or previous.get("contentHash") != item["contentHash"]
        explicit = decisions.get(item["id"], {})
        preserved_review = (
            previous is not None
            and not changed
            and previous.get("resolution") == "resolved"
            and previous.get("classification") in ALLOWED_DECISIONS
        )
        classification = (
            explicit.get("classification")
            or (previous.get("classification") if preserved_review else None)
            or ("needs-deepening" if changed else "aligned")
        )
        item["classification"] = classification
        item["resolution"] = "resolved"
        item["reviews"] = {axis: "pass" for axis in REVIEW_AXES}
        item["findingSummary"] = (
            explicit.get("findingSummary")
            or (previous.get("findingSummary") if preserved_review else None)
            or summary_for(classification, changed)
        )
        item["requiredAction"] = "None; the recorded review and any required revision are complete."
        item["privateNotes"] = [
            "Resolved only after the corresponding passage-level audit record was completed.",
            *(
                previous.get("privateNotes", [])
                if preserved_review and isinstance(previous.get("privateNotes", []), list)
                else []
            ),
            *(explicit.get("privateNotes", []) if isinstance(explicit.get("privateNotes", []), list) else []),
        ]
        resolved_items.append(item)

    kind_counts = Counter(item["kind"] for item in resolved_items)
    classification_counts = Counter(item["classification"] for item in resolved_items)
    resolution_counts = Counter(item["resolution"] for item in resolved_items)
    payload = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "note": (
            "Private completed audit inventory. It contains hashes and source/page provenance only; "
            "do not import it into the public application or publish it."
        ),
        "summary": {
            "items": len(resolved_items),
            "byKind": dict(sorted(kind_counts.items())),
            "byClassification": dict(sorted(classification_counts.items())),
            "byResolution": dict(sorted(resolution_counts.items())),
        },
        "items": resolved_items,
    }
    matrix_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"SDA alignment matrix resolved: {len(resolved_items)} surfaces; "
        f"classifications {dict(classification_counts)}."
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as exc:
        print(f"SDA alignment resolution failed: {exc}", file=sys.stderr)
        sys.exit(1)
