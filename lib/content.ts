import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ChapterContentSchema,
  IntroductionContentSchema,
  ResourceSchema,
  type ChapterContent,
  type IntroductionContent,
  type Resource
} from "@/lib/schemas";
import { padChapter } from "@/lib/utils";

const contentRoot = join(process.cwd(), "content");
const bookSlug = "romans";
const bookName = "Romans";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(contentRoot, path), "utf8")) as T;
}

export function getChapter(chapter: number | string): ChapterContent {
  const data = readJson<unknown>(`${bookSlug}/chapter-${padChapter(chapter)}.json`);
  return ChapterContentSchema.parse(data);
}

export function getAllChapters(): ChapterContent[] {
  return readdirSync(join(contentRoot, bookSlug))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ChapterContentSchema.parse(readJson<unknown>(`${bookSlug}/${file}`)));
}

export function getIntroduction(): IntroductionContent {
  const data = readJson<unknown>("introduction.json");
  return IntroductionContentSchema.parse(data);
}

export function getResources(): Resource[] {
  const data = readJson<{ resources: unknown[] }>("resources/bibliography.json");
  return data.resources.map((resource) => ResourceSchema.parse(resource));
}

export function getSourceMap() {
  return Object.fromEntries(getResources().map((resource) => [resource.id, resource]));
}

export function getSearchIndex() {
  const introduction = getIntroduction();
  const chapters = getAllChapters();
  const introductionSectionText = introduction.sections
    .map((section) =>
      [
        section.title,
        section.body.join(" "),
        section.items.map((item) => `${item.title ?? ""} ${item.body}`).join(" "),
        section.subsections
          .map((subsection) => `${subsection.title} ${subsection.body.join(" ")} ${subsection.items.join(" ")}`)
          .join(" ")
      ].join(" ")
    )
    .join(" ");

  return [
    {
      id: "introduction",
      type: "introduction",
      title: introduction.title,
      href: "/introduction",
      text: `${introduction.summary} ${introduction.facts.map((fact) => `${fact.label} ${fact.value}`).join(" ")} ${introduction.highlights.join(" ")} ${introductionSectionText} ${introduction.relatedLinks.map((link) => `${link.title} ${link.description}`).join(" ")}`
    },
    ...chapters.map((chapter) => ({
      id: `chapter-${chapter.chapterNumber}`,
      type: "chapter",
      title: `${bookName} ${chapter.chapterNumber}`,
      href: `/${bookSlug}/${chapter.chapterNumber}`,
      text: `${chapter.summary} ${chapter.historicalContext} ${chapter.literaryContext} ${chapter.themes.join(" ")}`
    })),
    ...chapters.flatMap((chapter) =>
      chapter.verses.map((verse) => ({
        id: verse.verse,
        type: "verse",
        title: verse.verse,
        href: `/${bookSlug}/${chapter.chapterNumber}#${verse.verse.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        text: `${verse.bibleText} ${verse.explanation} ${verse.historicalBackground} ${verse.literaryContext} ${verse.theologicalInsight} ${verse.structuralNotes} ${verse.relatedConnection} ${verse.application} ${verse.commentary.detailedExplanation} ${verse.commentary.exegesis} ${verse.commentary.historicalBackground} ${verse.commentary.technicalNotes} ${verse.commentary.theologicalInsight} ${verse.commentary.structuralNotes} ${verse.commentary.otherCommentaryInsights} ${verse.commentary.application} ${verse.crossReferences.join(" ")} ${verse.wordNotes
          .map((note) => `${note.term} ${note.explanation} ${note.scriptureReferences.join(" ")}`)
          .join(" ")}`
      }))
    )
  ];
}
