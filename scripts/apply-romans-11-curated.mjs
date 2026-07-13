import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansElevenCuration } from "./lib/romans-11-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-11.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 11 || chapter.verses?.length !== 36) {
  throw new Error("Expected content/romans/chapter-11.json to contain Romans 11 with 36 verses.");
}

const updated = applyRomansElevenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 11 commentary to content/romans/chapter-11.json.");
