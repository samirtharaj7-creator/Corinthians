import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const kjvPath = "/Users/samuel/Documents/Codex/2026-06-05/i-want-you-to-create-a/work/kjv-gutenberg-30.txt";
const contentRoot = join(root, "content");
const romansRoot = join(contentRoot, "romans");

if (process.env.ALLOW_RESET_ROMANS_CONTENT !== "1") {
  throw new Error("This seed script resets Romans study notes. Set ALLOW_RESET_ROMANS_CONTENT=1 only when intentionally rebuilding blank seed files.");
}

const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
function emptyCommentary() {
  return {
    detailedExplanation: "",
    exegesis: "",
    historicalBackground: "",
    technicalNotes: "",
    theologicalInsight: "",
    structuralNotes: "",
    otherCommentaryInsights: "",
    application: "",
    reviewFlags: []
  };
}

function emptySourceAudit() {
  return {
    exegesis: [],
    historicalBackground: [],
    technicalNotes: [],
    theologicalInsight: [],
    structuralNotes: [],
    otherCommentaryInsights: [],
    application: []
  };
}

function emptyTeachingNotes() {
  return {
    openingQuestion: "",
    mainPoint: "",
    keyVerses: [],
    importantTerms: [],
    discussionQuestions: [],
    commonMisunderstandings: [],
    emphasis: "",
    closingAppeal: ""
  };
}

function emptyEvangelisticNotes() {
  return {
    mainDoctrinalTheme: "",
    keyBibleTexts: [],
    flow: [],
    simpleIllustrations: [],
    appealQuestion: "",
    cautions: [],
    sources: []
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

const lines = readFileSync(kjvPath, "utf8").split(/\r?\n/);
const chapters = new Map();
let current = null;

for (const rawLine of lines) {
  const line = rawLine.trim();
  const match = line.match(/^45:(\d{3}):(\d{3})\s+(.*)$/);
  if (match) {
    const chapterNumber = Number(match[1]);
    const verseNumber = Number(match[2]);
    current = { chapterNumber, verseNumber };
    if (!chapters.has(chapterNumber)) chapters.set(chapterNumber, []);
    chapters.get(chapterNumber).push({ verseNumber, text: match[3].trim() });
    continue;
  }

  if (current && line && !line.startsWith("Book ")) {
    const chapter = chapters.get(current.chapterNumber);
    const verse = chapter.at(-1);
    verse.text = `${verse.text} ${line}`.replace(/\s+/g, " ").trim();
  } else if (current && line.startsWith("Book 46 ")) {
    break;
  }
}

mkdirSync(romansRoot, { recursive: true });

for (let chapterNumber = 1; chapterNumber <= 16; chapterNumber += 1) {
  const verses = chapters.get(chapterNumber) ?? [];
  const expected = expectedVerseCounts[chapterNumber - 1];
  if (verses.length !== expected) {
    throw new Error(`Romans ${chapterNumber} has ${verses.length} verses; expected ${expected}.`);
  }

  const chapter = {
    chapterNumber,
    title: `Chapter ${chapterNumber}`,
    summary: "",
    historicalContext: "",
    literaryContext: "",
    themes: [],
    outline: [],
    verses: verses.map((verse) => ({
      verse: `Romans ${chapterNumber}:${verse.verseNumber}`,
      bibleText: verse.text,
      explanation: "",
      historicalBackground: "",
      literaryContext: "",
      theologicalInsight: "",
      structuralNotes: "",
      relatedConnection: "",
      crossReferences: [],
      application: "",
      sources: [],
      commentary: emptyCommentary(),
      wordNotes: [],
      sourceAudit: emptySourceAudit(),
      reviewStatus: "placeholder"
    })),
    symbols: [],
    charts: [],
    images: [],
    crossReferences: [],
    relatedConnections: [],
    teachingNotes: emptyTeachingNotes(),
    evangelisticNotes: emptyEvangelisticNotes(),
    reflectionQuestions: [],
    sources: []
  };

  writeFileSync(join(romansRoot, `chapter-${pad(chapterNumber)}.json`), `${JSON.stringify(chapter, null, 2)}\n`);
}

const introduction = {
  title: "Romans",
  subtitle: "KJV text with empty verse-by-verse study space.",
  summary: "Romans is ready for source-backed study notes. The chapter text is loaded, and the exposition fields are blank.",
  facts: [
    { label: "Book", value: "Romans" },
    { label: "Text", value: "King James Version" },
    { label: "Chapters", value: "16" },
    { label: "Verses", value: "433" }
  ],
  highlights: [
    "KJV chapter text is complete.",
    "Study-note fields are blank.",
    "Resources can be added as synthesis begins."
  ],
  sections: [
    {
      id: "text-ready",
      title: "Text Ready",
      body: [
        "All sixteen chapters of Romans are available in the reader from the King James Version."
      ]
    },
    {
      id: "notes-empty",
      title: "Study Notes Blank",
      body: [
        "Each verse has blank study-note, cross-reference, word-note, and source-audit fields for future synthesis."
      ]
    }
  ],
  relatedLinks: [
    {
      title: "Open Romans 1",
      href: "/romans/1",
      description: "Begin reading the chapter text."
    },
    {
      title: "Resources",
      href: "/resources",
      description: "Review the current source list."
    }
  ]
};

writeFileSync(join(contentRoot, "introduction.json"), `${JSON.stringify(introduction, null, 2)}\n`);

const bibliography = {
  resources: [
    {
      id: "kjv-gutenberg-30",
      title: "The Bible, King James Version, Complete",
      author: "Project Gutenberg",
      type: "Bible text",
      tradition: "Public domain",
      interpretiveCategory: "Primary text",
      howUsed: "Source for the Romans KJV verse text in this study workspace.",
      citationFormat: "Project Gutenberg eBook #30, The Bible, King James Version, Complete."
    }
  ]
};

mkdirSync(join(contentRoot, "resources"), { recursive: true });
writeFileSync(join(contentRoot, "resources", "bibliography.json"), `${JSON.stringify(bibliography, null, 2)}\n`);

console.log("Generated Romans content from KJV.");
