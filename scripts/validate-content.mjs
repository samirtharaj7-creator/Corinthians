import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const contentRoot = join(process.cwd(), "content");
const correctedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
const requiredCommentaryFields = [
  "detailedExplanation",
  "exegesis",
  "historicalBackground",
  "technicalNotes",
  "theologicalInsight",
  "structuralNotes",
  "otherCommentaryInsights",
  "application"
];
const requiredAuditFields = [
  "exegesis",
  "historicalBackground",
  "technicalNotes",
  "theologicalInsight",
  "structuralNotes",
  "otherCommentaryInsights",
  "application"
];
const bannedPublicPhrases = [
  /filecite/i,
  /uploaded/i,
  /supplied resources/i,
  /source anchors/i,
  /source trail/i,
  /resources used for this commentary/i,
  /materials used for this commentary/i,
  /source-backed/i,
  /belongs to the movement/i,
  /used here for synthesis/i,
  /blank study/i,
  /empty verse/i,
  /study notes empty/i
];
const romansOneBannedPhrases = [
  /begins with good news/i,
  /the chapter moves/i,
  /building his case patiently/i,
  /one step in the gospel's movement/i
];
const errors = [];

function readJson(path) {
  return JSON.parse(readFileSync(join(contentRoot, path), "utf8"));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSourceRef(source, context, sourceIds) {
  assert(source && typeof source === "object", `${context} has an invalid source reference.`);
  assert(isNonEmptyString(source?.sourceId), `${context} has a source without sourceId.`);
  assert(sourceIds.has(source?.sourceId), `${context} has unknown source id ${source?.sourceId}.`);
  assert(isNonEmptyString(source?.locator), `${context} has source ${source?.sourceId} without a locator.`);
  assert(isNonEmptyString(source?.claimType), `${context} has source ${source?.sourceId} without claimType.`);
  assert(typeof source?.priority === "number", `${context} has source ${source?.sourceId} without numeric priority.`);
}

function assertPublicText(value, context) {
  if (typeof value !== "string" || !value.trim()) return;
  bannedPublicPhrases.forEach((pattern) => {
    assert(!pattern.test(value), `${context} contains banned public phrase matching ${pattern}.`);
  });
}

function assertRomansOneText(value, context) {
  if (typeof value !== "string" || !value.trim()) return;
  romansOneBannedPhrases.forEach((pattern) => {
    assert(!pattern.test(value), `${context} contains stale Romans 1 phrase matching ${pattern}.`);
  });
}

function assertPublicTextArray(values, context) {
  (values ?? []).forEach((value, index) => assertPublicText(value, `${context}[${index}]`));
}

const intro = readJson("introduction.json");
assert(isNonEmptyString(intro.title), "content/introduction.json is missing title.");
assert(isNonEmptyString(intro.summary), "content/introduction.json is missing summary.");
assert(Array.isArray(intro.sections) && intro.sections.length >= 3, "content/introduction.json should have at least 3 sections.");
assertPublicText(intro.title, "introduction.title");
assertPublicText(intro.subtitle, "introduction.subtitle");
assertPublicText(intro.summary, "introduction.summary");
assertPublicTextArray(intro.highlights, "introduction.highlights");
intro.sections.forEach((section, index) => {
  assertPublicText(section.title, `introduction.sections[${index}].title`);
  assertPublicTextArray(section.body, `introduction.sections[${index}].body`);
});
intro.relatedLinks.forEach((link, index) => {
  assertPublicText(link.title, `introduction.relatedLinks[${index}].title`);
  assertPublicText(link.description, `introduction.relatedLinks[${index}].description`);
});

const bibliography = readJson("resources/bibliography.json");
assert(Array.isArray(bibliography.resources), "content/resources/bibliography.json must contain a resources array.");
const sourceIds = new Set();
for (const resource of bibliography.resources ?? []) {
  assert(isNonEmptyString(resource.id), "A resource entry is missing id.");
  assert(!sourceIds.has(resource.id), `Duplicate resource id: ${resource.id}.`);
  sourceIds.add(resource.id);
  assert(isNonEmptyString(resource.title), `${resource.id} is missing title.`);
  assert(isNonEmptyString(resource.author), `${resource.id} is missing author.`);
  assert(isNonEmptyString(resource.type), `${resource.id} is missing type.`);
  assert(isNonEmptyString(resource.tradition), `${resource.id} is missing tradition.`);
  assert(isNonEmptyString(resource.interpretiveCategory), `${resource.id} is missing interpretiveCategory.`);
  assert(isNonEmptyString(resource.howUsed), `${resource.id} is missing howUsed.`);
  assert(isNonEmptyString(resource.citationFormat), `${resource.id} is missing citationFormat.`);
}
assert(sourceIds.has("kjv-gutenberg-30"), "Bibliography must include kjv-gutenberg-30.");
assert(existsSync(join(contentRoot, "resources", "source-inventory.json")), "content/resources/source-inventory.json must exist.");

const chapterFiles = readdirSync(join(contentRoot, "romans")).filter((file) => file.endsWith(".json")).sort();
assert(chapterFiles.length === 16, `Expected 16 Romans chapter files, found ${chapterFiles.length}.`);

chapterFiles.forEach((file, index) => {
  const chapter = readJson(`romans/${file}`);
  const expectedChapterNumber = index + 1;
  assert(chapter.chapterNumber === expectedChapterNumber, `${file} has chapterNumber ${chapter.chapterNumber}; expected ${expectedChapterNumber}.`);
  assert(Array.isArray(chapter.verses), `${file} is missing verses.`);
  assert(chapter.verses.length === correctedVerseCounts[index], `${file} has ${chapter.verses.length} verses; expected ${correctedVerseCounts[index]}.`);
  assert(isNonEmptyString(chapter.summary), `${file} is missing chapter summary.`);
  assert(Array.isArray(chapter.themes) && chapter.themes.length >= 3, `${file} should have at least 3 chapter themes.`);
  assert(Array.isArray(chapter.outline) && chapter.outline.length > 0, `${file} should have an outline.`);
  assert(Array.isArray(chapter.sources) && chapter.sources.length > 0, `${file} should have chapter source references.`);
  assert(Array.isArray(chapter.reflectionQuestions) && chapter.reflectionQuestions.length >= 3, `${file} should have reflection questions.`);
  assertPublicText(chapter.title, `${file} title`);
  assertPublicText(chapter.summary, `${file} summary`);
  assertPublicText(chapter.historicalContext, `${file} historicalContext`);
  assertPublicText(chapter.literaryContext, `${file} literaryContext`);
  assertPublicTextArray(chapter.themes, `${file} themes`);
  assertPublicTextArray(chapter.crossReferences, `${file} crossReferences`);
  assertPublicTextArray(chapter.reflectionQuestions, `${file} reflectionQuestions`);
  chapter.outline.forEach((section, sectionIndex) => {
    assertPublicText(section.title, `${file} outline[${sectionIndex}].title`);
    assertPublicText(section.summary, `${file} outline[${sectionIndex}].summary`);
  });

  chapter.sources.forEach((source) => validateSourceRef(source, `${file} chapter sources`, sourceIds));

  chapter.verses.forEach((verse, verseIndex) => {
    const expectedRef = `Romans ${chapter.chapterNumber}:${verseIndex + 1}`;
    assert(verse.verse === expectedRef, `${file} verse ${verseIndex + 1} is ${verse.verse}; expected ${expectedRef}.`);
    assert(isNonEmptyString(verse.bibleText), `${expectedRef} is missing Bible text.`);
    assert(verse.reviewStatus !== "placeholder", `${expectedRef} still has placeholder review status.`);
    assert(Array.isArray(verse.sources) && verse.sources.length > 0, `${expectedRef} is missing source references.`);
    assert(Array.isArray(verse.crossReferences) && verse.crossReferences.length > 0, `${expectedRef} is missing cross references.`);
    assert(isNonEmptyString(verse.explanation), `${expectedRef} is missing top-level explanation.`);
    assert(isNonEmptyString(verse.theologicalInsight), `${expectedRef} is missing top-level theological insight.`);
    assert(isNonEmptyString(verse.application), `${expectedRef} is missing top-level application.`);
    assertPublicText(verse.explanation, `${expectedRef} explanation`);
    assertPublicText(verse.historicalBackground, `${expectedRef} historicalBackground`);
    assertPublicText(verse.literaryContext, `${expectedRef} literaryContext`);
    assertPublicText(verse.theologicalInsight, `${expectedRef} theologicalInsight`);
    assertPublicText(verse.structuralNotes, `${expectedRef} structuralNotes`);
    assertPublicText(verse.relatedConnection, `${expectedRef} relatedConnection`);
    assertPublicText(verse.application, `${expectedRef} application`);
    if (chapter.chapterNumber === 1) {
      assertRomansOneText(verse.explanation, `${expectedRef} explanation`);
      assertRomansOneText(verse.historicalBackground, `${expectedRef} historicalBackground`);
      assertRomansOneText(verse.literaryContext, `${expectedRef} literaryContext`);
      assertRomansOneText(verse.theologicalInsight, `${expectedRef} theologicalInsight`);
      assertRomansOneText(verse.structuralNotes, `${expectedRef} structuralNotes`);
      assertRomansOneText(verse.relatedConnection, `${expectedRef} relatedConnection`);
      assertRomansOneText(verse.application, `${expectedRef} application`);
    }

    requiredCommentaryFields.forEach((field) => {
      assert(typeof verse.commentary?.[field] === "string" && verse.commentary[field].trim().length >= 80, `${expectedRef} commentary.${field} is too short or missing.`);
      assertPublicText(verse.commentary?.[field], `${expectedRef} commentary.${field}`);
      if (chapter.chapterNumber === 1) {
        assertRomansOneText(verse.commentary?.[field], `${expectedRef} commentary.${field}`);
      }
    });
    verse.wordNotes.forEach((note, noteIndex) => {
      assertPublicText(note.term, `${expectedRef} wordNotes[${noteIndex}].term`);
      assertPublicText(note.explanation, `${expectedRef} wordNotes[${noteIndex}].explanation`);
      assertPublicTextArray(note.scriptureReferences, `${expectedRef} wordNotes[${noteIndex}].scriptureReferences`);
      if (chapter.chapterNumber === 1) {
        assertRomansOneText(note.term, `${expectedRef} wordNotes[${noteIndex}].term`);
        assertRomansOneText(note.explanation, `${expectedRef} wordNotes[${noteIndex}].explanation`);
      }
    });

    verse.sources.forEach((source) => validateSourceRef(source, `${expectedRef} sources`, sourceIds));
    requiredAuditFields.forEach((field) => {
      const refs = verse.sourceAudit?.[field];
      assert(Array.isArray(refs) && refs.length > 0, `${expectedRef} sourceAudit.${field} is empty.`);
      (refs ?? []).forEach((source) => validateSourceRef(source, `${expectedRef} sourceAudit.${field}`, sourceIds));
    });
  });
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Romans content validated.");
