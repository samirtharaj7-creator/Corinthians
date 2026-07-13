import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansFiveCuration } from "./lib/romans-5-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-05.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 5 || chapter.verses?.length !== 21) {
  throw new Error("Expected content/romans/chapter-05.json to contain Romans 5 with 21 verses.");
}

const updated = applyRomansFiveCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 5 commentary to content/romans/chapter-05.json.");
