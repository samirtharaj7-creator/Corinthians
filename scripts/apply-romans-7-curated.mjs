import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansSevenCuration } from "./lib/romans-7-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-07.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 7 || chapter.verses?.length !== 25) {
  throw new Error("Expected content/romans/chapter-07.json to contain Romans 7 with 25 verses.");
}

const updated = applyRomansSevenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 7 commentary to content/romans/chapter-07.json.");
