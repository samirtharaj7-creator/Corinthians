import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansTwoCuration } from "./lib/romans-2-curation.mjs";

const root = process.cwd();
const chapterPath = join(root, "content", "romans", "chapter-02.json");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.chapterNumber !== 2 || chapter.verses?.length !== 29) {
  throw new Error("Expected content/romans/chapter-02.json to contain Romans 2 with 29 verses.");
}

const updated = applyRomansTwoCuration(chapter, sourceIds, root);
writeFileSync(chapterPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log("Applied curated Romans 2 commentary to content/romans/chapter-02.json.");
