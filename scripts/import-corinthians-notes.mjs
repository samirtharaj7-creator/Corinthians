import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const books = {
  "1-corinthians": {
    name: "1 Corinthians",
    verseCounts: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24]
  },
  "2-corinthians": {
    name: "2 Corinthians",
    verseCounts: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
  }
};

const [bookSlug, chapterArgument, notesArgument] = process.argv.slice(2);
const book = books[bookSlug];
const chapterNumber = Number(chapterArgument);

if (!book) {
  throw new Error("Book must be 1-corinthians or 2-corinthians.");
}

if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.verseCounts.length) {
  throw new Error(`${book.name} chapter must be between 1 and ${book.verseCounts.length}.`);
}

if (!notesArgument) {
  throw new Error("Provide the path to a verse-labeled notes file.");
}

const notesPath = resolve(root, notesArgument);
if (!existsSync(notesPath)) {
  throw new Error(`Notes file does not exist: ${notesPath}`);
}

const expectedVerseCount = book.verseCounts[chapterNumber - 1];
const allowPartial = process.env.ALLOW_PARTIAL_CORINTHIANS_NOTES === "1";
const headingPattern = new RegExp(`^(?:#{1,6}\\s+)?${escapeRegExp(book.name)} (\\d+):(\\d+)$`);
const notesByVerse = new Map();
let currentVerseNumber = null;
let currentLines = [];
let preamble = [];
let hasSeenHeading = false;

function flushCurrentVerse() {
  if (currentVerseNumber === null) return;
  const note = currentLines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!note) throw new Error(`${book.name} ${chapterNumber}:${currentVerseNumber} has no note text.`);
  if (notesByVerse.has(currentVerseNumber)) {
    throw new Error(`${book.name} ${chapterNumber}:${currentVerseNumber} is duplicated.`);
  }
  notesByVerse.set(currentVerseNumber, note);
}

for (const rawLine of readFileSync(notesPath, "utf8").split(/\r?\n/)) {
  const heading = rawLine.trim().match(headingPattern);
  if (heading) {
    flushCurrentVerse();
    hasSeenHeading = true;
    const headingChapter = Number(heading[1]);
    currentVerseNumber = headingChapter === chapterNumber ? Number(heading[2]) : null;
    currentLines = [];
    continue;
  }

  if (currentVerseNumber === null) {
    if (!hasSeenHeading) preamble.push(rawLine);
  } else {
    currentLines.push(rawLine.trimEnd());
  }
}

flushCurrentVerse();

if (preamble.some((line) => line.trim() && !/^#{1,6}\s+/.test(line.trim()))) {
  throw new Error("Notes file contains text before the first verse heading.");
}

if (!notesByVerse.size) {
  throw new Error(`Notes file has no entries for ${book.name} ${chapterNumber}.`);
}

for (const verseNumber of notesByVerse.keys()) {
  if (verseNumber < 1 || verseNumber > expectedVerseCount) {
    throw new Error(`${book.name} ${chapterNumber}:${verseNumber} is outside the chapter's verse range.`);
  }
}

if (!allowPartial) {
  for (let verseNumber = 1; verseNumber <= expectedVerseCount; verseNumber += 1) {
    if (!notesByVerse.has(verseNumber)) {
      throw new Error(`Notes file is missing ${book.name} ${chapterNumber}:${verseNumber}.`);
    }
  }

  if (notesByVerse.size !== expectedVerseCount) {
    throw new Error(`Expected ${expectedVerseCount} verse notes; found ${notesByVerse.size}.`);
  }
}

const chapterPath = join(root, "content", bookSlug, `chapter-${String(chapterNumber).padStart(2, "0")}.json`);
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

if (chapter.verses.length !== expectedVerseCount) {
  throw new Error(`${book.name} ${chapterNumber} content has an unexpected verse count.`);
}

let totalWords = 0;

chapter.verses.forEach((verse, index) => {
  const verseNumber = index + 1;
  const expectedReference = `${book.name} ${chapterNumber}:${verseNumber}`;
  if (verse.verse !== expectedReference) {
    throw new Error(`Expected ${expectedReference}; found ${verse.verse}.`);
  }

  const nextNote = notesByVerse.get(verseNumber);
  if (nextNote === undefined) return;
  const existingNote = verse.commentary?.detailedExplanation?.trim() ?? "";
  if (
    existingNote &&
    existingNote !== nextNote &&
    process.env.ALLOW_OVERWRITE_CORINTHIANS_NOTES !== "1"
  ) {
    throw new Error(
      `${expectedReference} already has different notes. Set ALLOW_OVERWRITE_CORINTHIANS_NOTES=1 only for an intentional replacement.`
    );
  }

  verse.commentary.detailedExplanation = nextNote;
  verse.reviewStatus = "needs-source-review";
  totalWords += countWords(nextNote);
});

writeFileSync(chapterPath, `${JSON.stringify(chapter, null, 2)}\n`);
console.log(
  `Imported ${notesByVerse.size} notes (${totalWords} words) into ${book.name} ${chapterNumber}.`
);

function countWords(value) {
  return value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
