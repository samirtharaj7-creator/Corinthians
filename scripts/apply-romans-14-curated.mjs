import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansFourteenCuration } from "./lib/romans-14-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-14.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 14 || chapter.verses?.length !== 23) {
  throw new Error("Expected content/romans/chapter-14.json to contain Romans 14 with 23 verses.");
}

const updated = applyRomansFourteenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 14 commentary to content/romans/chapter-14.json.");
