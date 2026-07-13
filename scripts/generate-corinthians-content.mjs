import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const kjvPath = "/Users/samuel/Documents/Codex/2026-06-05/i-want-you-to-create-a/work/kjv-gutenberg-30.txt";
const contentRoot = join(root, "content");

if (process.env.ALLOW_RESET_CORINTHIANS_CONTENT !== "1") {
  throw new Error(
    "This seed script resets Corinthians study notes. Set ALLOW_RESET_CORINTHIANS_CONTENT=1 only when intentionally rebuilding blank seed files."
  );
}

const books = [
  {
    slug: "1-corinthians",
    name: "1 Corinthians",
    kjvBookCode: "46",
    verseCounts: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24]
  },
  {
    slug: "2-corinthians",
    name: "2 Corinthians",
    kjvBookCode: "47",
    verseCounts: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
  }
];

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

function makeChapter(book, chapterNumber, verses) {
  return {
    chapterNumber,
    title: "",
    summary: "",
    historicalContext: "",
    literaryContext: "",
    themes: [],
    outline: [],
    verses: verses.map((verse) => ({
      verse: `${book.name} ${chapterNumber}:${verse.verseNumber}`,
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
}

const booksByCode = new Map(books.map((book) => [book.kjvBookCode, book]));
const parsedChapters = new Map(books.map((book) => [book.slug, new Map()]));
const lines = readFileSync(kjvPath, "utf8").split(/\r?\n/);
let currentVerse = null;

for (const rawLine of lines) {
  const line = rawLine.trim();
  const match = line.match(/^(46|47):(\d{3}):(\d{3})\s+(.*)$/);

  if (match) {
    const book = booksByCode.get(match[1]);
    const chapterNumber = Number(match[2]);
    const verseNumber = Number(match[3]);
    const chapters = parsedChapters.get(book.slug);

    if (!chapters.has(chapterNumber)) chapters.set(chapterNumber, []);
    const verse = { verseNumber, text: match[4].trim() };
    chapters.get(chapterNumber).push(verse);
    currentVerse = verse;
    continue;
  }

  if (line.startsWith("Book ")) {
    currentVerse = null;
    continue;
  }

  if (currentVerse && line) {
    currentVerse.text = `${currentVerse.text} ${line}`.replace(/\s+/g, " ").trim();
  }
}

let totalVerses = 0;

for (const book of books) {
  const bookRoot = join(contentRoot, book.slug);
  const chapters = parsedChapters.get(book.slug);
  mkdirSync(bookRoot, { recursive: true });

  for (let chapterNumber = 1; chapterNumber <= book.verseCounts.length; chapterNumber += 1) {
    const verses = chapters.get(chapterNumber) ?? [];
    const expectedVerseCount = book.verseCounts[chapterNumber - 1];

    if (verses.length !== expectedVerseCount) {
      throw new Error(
        `${book.name} ${chapterNumber} has ${verses.length} verses; expected ${expectedVerseCount}.`
      );
    }

    for (let index = 0; index < verses.length; index += 1) {
      const expectedVerseNumber = index + 1;
      if (verses[index].verseNumber !== expectedVerseNumber) {
        throw new Error(
          `${book.name} ${chapterNumber} is missing or reorders verse ${expectedVerseNumber}.`
        );
      }
    }

    const chapter = makeChapter(book, chapterNumber, verses);
    writeFileSync(
      join(bookRoot, `chapter-${pad(chapterNumber)}.json`),
      `${JSON.stringify(chapter, null, 2)}\n`
    );
    totalVerses += verses.length;
  }
}

console.log(`Generated ${books.length} Corinthians books, 29 chapters, and ${totalVerses} KJV verses.`);
