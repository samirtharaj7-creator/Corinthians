import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChapterContentSchema, type ChapterContent } from "@/lib/schemas";
import { padChapter } from "@/lib/utils";

export const CORINTHIANS_BOOKS = {
  "1-corinthians": {
    slug: "1-corinthians",
    name: "1 Corinthians",
    chapterCount: 16,
    verseCounts: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24]
  },
  "2-corinthians": {
    slug: "2-corinthians",
    name: "2 Corinthians",
    chapterCount: 13,
    verseCounts: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
  }
} as const;

export type CorinthiansBookSlug = keyof typeof CORINTHIANS_BOOKS;
export type CorinthiansBookConfig = (typeof CORINTHIANS_BOOKS)[CorinthiansBookSlug];

export type ChapterAdjacency = {
  previous: number | null;
  next: number | null;
};

const contentRoot = join(process.cwd(), "content");

export function getCorinthiansBookConfig(bookSlug: CorinthiansBookSlug): CorinthiansBookConfig {
  return CORINTHIANS_BOOKS[bookSlug];
}

export function getCorinthiansStaticParams(bookSlug: CorinthiansBookSlug) {
  const { chapterCount } = getCorinthiansBookConfig(bookSlug);
  return Array.from({ length: chapterCount }, (_, index) => ({ chapter: String(index + 1) }));
}

export function parseCorinthiansChapterNumber(
  bookSlug: CorinthiansBookSlug,
  chapter: number | string
): number | null {
  const rawChapter = String(chapter);
  if (!/^[1-9]\d*$/.test(rawChapter)) return null;

  const chapterNumber = Number(rawChapter);
  const { chapterCount } = getCorinthiansBookConfig(bookSlug);
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber > chapterCount) return null;

  return chapterNumber;
}

export function getCorinthiansChapter(
  bookSlug: CorinthiansBookSlug,
  chapter: number | string
): ChapterContent | null {
  const chapterNumber = parseCorinthiansChapterNumber(bookSlug, chapter);
  if (chapterNumber === null) return null;

  const config = getCorinthiansBookConfig(bookSlug);
  const chapterPath = join(contentRoot, config.slug, `chapter-${padChapter(chapterNumber)}.json`);
  if (!existsSync(chapterPath)) return null;

  const parsed = ChapterContentSchema.parse(JSON.parse(readFileSync(chapterPath, "utf8")));
  const expectedVerseCount = config.verseCounts[chapterNumber - 1];

  if (parsed.chapterNumber !== chapterNumber) {
    throw new Error(
      `${config.name} ${chapterNumber} loaded chapterNumber ${parsed.chapterNumber}.`
    );
  }

  if (parsed.verses.length !== expectedVerseCount) {
    throw new Error(
      `${config.name} ${chapterNumber} has ${parsed.verses.length} verses; expected ${expectedVerseCount}.`
    );
  }

  parsed.verses.forEach((verse, index) => {
    const expectedReference = `${config.name} ${chapterNumber}:${index + 1}`;
    if (verse.verse !== expectedReference) {
      throw new Error(
        `${config.name} ${chapterNumber} contains ${verse.verse}; expected ${expectedReference}.`
      );
    }
  });

  return parsed;
}

export function getCorinthiansChapterAdjacency(
  bookSlug: CorinthiansBookSlug,
  chapter: number | string
): ChapterAdjacency | null {
  const chapterNumber = parseCorinthiansChapterNumber(bookSlug, chapter);
  if (chapterNumber === null) return null;

  const { chapterCount } = getCorinthiansBookConfig(bookSlug);
  return {
    previous: chapterNumber > 1 ? chapterNumber - 1 : null,
    next: chapterNumber < chapterCount ? chapterNumber + 1 : null
  };
}
