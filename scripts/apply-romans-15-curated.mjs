import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansFifteenCuration } from "./lib/romans-15-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-15.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 15 || chapter.verses?.length !== 33) {
  throw new Error("Expected content/romans/chapter-15.json to contain Romans 15 with 33 verses.");
}

const updated = applyRomansFifteenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 15 commentary to content/romans/chapter-15.json.");
