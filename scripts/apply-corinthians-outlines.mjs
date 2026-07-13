import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

let chapterCount = 0;
let sectionCount = 0;

for (const [bookSlug, book] of Object.entries(books)) {
  const outlinePath = join(root, "scripts", "data", `${bookSlug}-outlines.json`);
  const outlines = JSON.parse(readFileSync(outlinePath, "utf8"));
  const expectedChapterKeys = book.verseCounts.map((_, index) => String(index + 1));
  const actualChapterKeys = Object.keys(outlines);

  if (JSON.stringify(actualChapterKeys) !== JSON.stringify(expectedChapterKeys)) {
    throw new Error(`${outlinePath} must define every ${book.name} chapter in order.`);
  }

  book.verseCounts.forEach((verseCount, index) => {
    const chapterNumber = index + 1;
    const sections = outlines[String(chapterNumber)];
    validateOutline(book.name, chapterNumber, verseCount, sections);

    const chapterPath = join(
      root,
      "content",
      bookSlug,
      `chapter-${String(chapterNumber).padStart(2, "0")}.json`
    );
    const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));
    if (chapter.chapterNumber !== chapterNumber || chapter.verses?.length !== verseCount) {
      throw new Error(`${book.name} ${chapterNumber} content does not match its outline definition.`);
    }

    chapter.outline = sections;
    writeFileSync(chapterPath, `${JSON.stringify(chapter, null, 2)}\n`);
    chapterCount += 1;
    sectionCount += sections.length;
  });
}

console.log(`Applied ${sectionCount} passage outline sections across ${chapterCount} Corinthians chapters.`);

function validateOutline(bookName, chapterNumber, verseCount, sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error(`${bookName} ${chapterNumber} must have at least one outline section.`);
  }

  let expectedStart = 1;
  for (const [index, section] of sections.entries()) {
    if (
      typeof section?.range !== "string" ||
      typeof section?.title !== "string" ||
      typeof section?.summary !== "string" ||
      !section.title.trim() ||
      !section.summary.trim()
    ) {
      throw new Error(`${bookName} ${chapterNumber} outline section ${index + 1} is incomplete.`);
    }

    const match = section.range.match(/^(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`${bookName} ${chapterNumber} has an invalid outline range: ${section.range}.`);
    }

    const rangeChapter = Number(match[1]);
    const startVerse = Number(match[2]);
    const endVerse = Number(match[3] ?? match[2]);
    if (rangeChapter !== chapterNumber || startVerse !== expectedStart || endVerse < startVerse) {
      throw new Error(`${bookName} ${section.range} is out of order or overlaps another section.`);
    }
    if (endVerse > verseCount) {
      throw new Error(`${bookName} ${section.range} exceeds the chapter’s ${verseCount} verses.`);
    }

    expectedStart = endVerse + 1;
  }

  if (expectedStart !== verseCount + 1) {
    throw new Error(`${bookName} ${chapterNumber} outline does not cover every verse.`);
  }
}
