import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansEightCuration } from "./lib/romans-8-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-08.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 8 || chapter.verses?.length !== 39) {
  throw new Error("Expected content/romans/chapter-08.json to contain Romans 8 with 39 verses.");
}

const updated = applyRomansEightCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 8 commentary to content/romans/chapter-08.json.");
