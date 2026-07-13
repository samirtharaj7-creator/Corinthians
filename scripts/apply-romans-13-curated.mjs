import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansThirteenCuration } from "./lib/romans-13-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-13.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 13 || chapter.verses?.length !== 14) {
  throw new Error("Expected content/romans/chapter-13.json to contain Romans 13 with 14 verses.");
}

const updated = applyRomansThirteenCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 13 commentary to content/romans/chapter-13.json.");
