import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansTwelveCuration } from "./lib/romans-12-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-12.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 12 || chapter.verses?.length !== 21) {
  throw new Error("Expected content/romans/chapter-12.json to contain Romans 12 with 21 verses.");
}

const updated = applyRomansTwelveCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 12 commentary to content/romans/chapter-12.json.");
