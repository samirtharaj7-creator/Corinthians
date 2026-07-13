import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansNineCuration } from "./lib/romans-9-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-09.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 9 || chapter.verses?.length !== 33) {
  throw new Error("Expected content/romans/chapter-09.json to contain Romans 9 with 33 verses.");
}

const updated = applyRomansNineCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 9 commentary to content/romans/chapter-09.json.");
