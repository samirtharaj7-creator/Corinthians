import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ChapterContentSchema, IntroductionContentSchema, ResourceSchema } from "../lib/schemas";

const contentRoot = join(process.cwd(), "content");
const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
const errors: string[] = [];
const requiredCommentaryFields = [
  "detailedExplanation",
  "exegesis",
  "historicalBackground",
  "technicalNotes",
  "theologicalInsight",
  "structuralNotes",
  "otherCommentaryInsights",
  "application"
] as const;

function readJson(path: string) {
  return JSON.parse(readFileSync(join(contentRoot, path), "utf8"));
}

function assert(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

const intro = IntroductionContentSchema.safeParse(readJson("introduction.json"));
assert(intro.success, "content/introduction.json does not match the introduction schema.");

const resources = readJson("resources/bibliography.json") as { resources?: unknown[] };
assert(Array.isArray(resources.resources), "content/resources/bibliography.json must contain a resources array.");
const sourceIds = new Set<string>();
for (const resource of resources.resources ?? []) {
  const parsed = ResourceSchema.safeParse(resource);
  assert(parsed.success, "A resource entry does not match the resource schema.");
  if (parsed.success) {
    assert(!sourceIds.has(parsed.data.id), `Duplicate resource id: ${parsed.data.id}.`);
    sourceIds.add(parsed.data.id);
  }
}
assert(sourceIds.has("kjv-gutenberg-30"), "Bibliography must include kjv-gutenberg-30.");

const sourceInventoryPath = join(contentRoot, "resources", "source-inventory.json");
assert(existsSync(sourceInventoryPath), "content/resources/source-inventory.json must exist.");

const chapterFiles = readdirSync(join(contentRoot, "romans")).filter((file) => file.endsWith(".json")).sort();
assert(chapterFiles.length === 16, `Expected 16 Romans chapter files, found ${chapterFiles.length}.`);

chapterFiles.forEach((file, index) => {
  const parsed = ChapterContentSchema.safeParse(readJson(`romans/${file}`));
  if (!parsed.success) {
    errors.push(`${file} does not match the chapter schema.`);
    return;
  }

  const chapter = parsed.data;
  const expectedChapterNumber = index + 1;
  assert(chapter.chapterNumber === expectedChapterNumber, `${file} has chapterNumber ${chapter.chapterNumber}; expected ${expectedChapterNumber}.`);
  assert(chapter.verses.length === expectedVerseCounts[index], `${file} has ${chapter.verses.length} verses; expected ${expectedVerseCounts[index]}.`);
  assert(Boolean(chapter.summary.trim()), `${file} is missing chapter summary.`);
  assert(chapter.themes.length >= 3, `${file} should have at least 3 chapter themes.`);
  assert(chapter.outline.length > 0, `${file} should have an outline.`);
  assert(chapter.sources.length > 0, `${file} should have chapter source references.`);
  assert(chapter.reflectionQuestions.length >= 3, `${file} should have reflection questions.`);

  chapter.sources.forEach((source) => {
    assert(sourceIds.has(source.sourceId), `${file} has unknown chapter source id ${source.sourceId}.`);
  });

  chapter.verses.forEach((verse, verseIndex) => {
    const expectedRef = `Romans ${chapter.chapterNumber}:${verseIndex + 1}`;
    assert(verse.verse === expectedRef, `${file} verse ${verseIndex + 1} is ${verse.verse}; expected ${expectedRef}.`);
    assert(Boolean(verse.bibleText.trim()), `${expectedRef} is missing Bible text.`);
    assert(verse.reviewStatus !== "placeholder", `${expectedRef} still has placeholder review status.`);
    assert(verse.sources.length > 0, `${expectedRef} is missing source references.`);
    assert(verse.crossReferences.length > 0, `${expectedRef} is missing cross references.`);
    assert(Boolean(verse.explanation.trim()), `${expectedRef} is missing top-level explanation.`);
    assert(Boolean(verse.theologicalInsight.trim()), `${expectedRef} is missing top-level theological insight.`);
    assert(Boolean(verse.application.trim()), `${expectedRef} is missing top-level application.`);

    requiredCommentaryFields.forEach((field) => {
      const value = verse.commentary[field];
      assert(value.trim().length >= 80, `${expectedRef} commentary.${field} is too short or missing.`);
    });

    verse.sources.forEach((source) => {
      assert(sourceIds.has(source.sourceId), `${expectedRef} has unknown source id ${source.sourceId}.`);
      assert(Boolean(source.locator.trim()), `${expectedRef} has source ${source.sourceId} without a locator.`);
    });

    Object.entries(verse.sourceAudit).forEach(([field, refs]) => {
      assert(refs.length > 0, `${expectedRef} sourceAudit.${field} is empty.`);
      refs.forEach((source) => {
        assert(sourceIds.has(source.sourceId), `${expectedRef} sourceAudit.${field} has unknown source id ${source.sourceId}.`);
      });
    });
  });
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Romans content validated.");
