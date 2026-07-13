import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansSixteenCuration } from "./lib/romans-16-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-16.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 16 || chapter.verses?.length !== 27) {
  throw new Error("Expected content/romans/chapter-16.json to contain Romans 16 with 27 verses.");
}

const updated = applyRomansSixteenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 16 commentary to content/romans/chapter-16.json.");
