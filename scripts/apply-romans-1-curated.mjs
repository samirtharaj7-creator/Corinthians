import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansOneCuration } from "./lib/romans-1-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-01.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 1 || chapter.verses?.length !== 32) {
  throw new Error("Expected content/romans/chapter-01.json to contain Romans 1 with 32 verses.");
}

const updated = applyRomansOneCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 1 commentary to content/romans/chapter-01.json.");
