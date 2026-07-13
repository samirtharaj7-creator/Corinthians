import { readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function firstParagraph(value) {
  return value.split("\n\n")[0].trim();
}

function validateSourceRefs(verse, sourceIds) {
  for (const source of verse.sources ?? []) {
    if (!sourceIds.has(source.sourceId)) {
      throw new Error(`${verse.verse} has unknown source id ${source.sourceId}.`);
    }
  }
}

export function loadRomansTwelveCuration(root = process.cwd()) {
  return readJson(join(root, "scripts", "data", "romans-12-curated.json"));
}

export function applyRomansTwelveCuration(chapter, sourceIds, root = process.cwd()) {
  const curation = loadRomansTwelveCuration(root);
  const verseMap = new Map(curation.verses.map((entry) => [entry.verse, entry]));

  if (chapter.chapterNumber !== 12 || chapter.verses?.length !== 21) {
    throw new Error("Expected Romans 12 content with 21 verses.");
  }

  const verses = chapter.verses.map((verse) => {
    const entry = verseMap.get(verse.verse);
    if (!entry) throw new Error(`Missing curated Romans 12 entry for ${verse.verse}`);
    validateSourceRefs(verse, sourceIds);

    const commentary = {
      ...verse.commentary,
      detailedExplanation: entry.essay,
      exegesis: firstParagraph(entry.essay),
      theologicalInsight: entry.theology,
      application: entry.application,
      reviewFlags: []
    };

    return {
      ...verse,
      explanation: firstParagraph(entry.essay),
      theologicalInsight: entry.theology,
      crossReferences: entry.crossReferences,
      application: entry.application,
      commentary,
      wordNotes: entry.wordNotes,
      reviewStatus: "needs-source-review"
    };
  });

  return {
    ...chapter,
    ...curation.chapter,
    verses,
    crossReferences: curation.chapter.crossReferences,
    reflectionQuestions: curation.chapter.reflectionQuestions,
    teachingNotes: {
      ...chapter.teachingNotes,
      mainPoint: curation.chapter.summary,
      importantTerms: curation.chapter.themes
    }
  };
}
