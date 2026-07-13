import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansSixCuration } from "./lib/romans-6-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-06.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 6 || chapter.verses?.length !== 23) {
  throw new Error("Expected content/romans/chapter-06.json to contain Romans 6 with 23 verses.");
}

const updated = applyRomansSixCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 6 commentary to content/romans/chapter-06.json.");
