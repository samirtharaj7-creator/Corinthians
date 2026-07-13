import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansFourCuration } from "./lib/romans-4-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-04.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 4 || chapter.verses?.length !== 25) {
  throw new Error("Expected content/romans/chapter-04.json to contain Romans 4 with 25 verses.");
}

const updated = applyRomansFourCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 4 commentary to content/romans/chapter-04.json.");
