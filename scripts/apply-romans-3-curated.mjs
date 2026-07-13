import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansThreeCuration } from "./lib/romans-3-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-03.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 3 || chapter.verses?.length !== 31) {
  throw new Error("Expected content/romans/chapter-03.json to contain Romans 3 with 31 verses.");
}

const updated = applyRomansThreeCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 3 commentary to content/romans/chapter-03.json.");
