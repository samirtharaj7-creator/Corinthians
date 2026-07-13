import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookChapterStrip } from "@/components/book-chapter-strip";
import { ChapterStudy, type PublicChapterContent } from "@/components/verse-accordion";
import {
  getCorinthiansBookConfig,
  getCorinthiansChapter,
  getCorinthiansChapterAdjacency,
  getCorinthiansStaticParams
} from "@/lib/corinthians";
import type { ChapterContent } from "@/lib/schemas";

const BOOK_SLUG = "1-corinthians" as const;
const book = getCorinthiansBookConfig(BOOK_SLUG);

export function generateStaticParams() {
  return getCorinthiansStaticParams(BOOK_SLUG);
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter } = await params;
  const content = getCorinthiansChapter(BOOK_SLUG, chapter);
  if (!content) notFound();

  return {
    title: `${book.name} ${content.chapterNumber}`,
    description: content.summary || `${book.name} ${content.chapterNumber} — King James Version with verse-by-verse study notes.`
  };
}

export default async function FirstCorinthiansChapterPage({
  params
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const content = getCorinthiansChapter(BOOK_SLUG, chapter);
  const adjacency = getCorinthiansChapterAdjacency(BOOK_SLUG, chapter);
  if (!content || !adjacency) notFound();

  const publicContent = withoutAuditSources(content);

  return (
    <main className="reader-page">
      <BookChapterStrip
        key={`${book.slug}-${content.chapterNumber}-navigator`}
        activeChapter={content.chapterNumber}
        bookSlug={book.slug}
        bookName={book.name}
        chapterCount={book.chapterCount}
        verseCounts={book.verseCounts}
      />
      <ChapterStudy
        key={`${book.slug}-${content.chapterNumber}-reader`}
        chapter={publicContent}
        bookName={book.name}
      />
      <nav className="reader-chapter-nav no-print" aria-label={`${book.name} adjacent chapters`}>
        {adjacency.previous ? (
          <a href={`/${book.slug}/${adjacency.previous}/`}>
            <ChevronLeft className="h-4 w-4" />
            {book.name} {adjacency.previous}
          </a>
        ) : (
          <span />
        )}
        {adjacency.next ? (
          <a href={`/${book.slug}/${adjacency.next}/`}>
            {book.name} {adjacency.next}
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : null}
      </nav>
    </main>
  );
}

function withoutAuditSources(chapter: ChapterContent): PublicChapterContent {
  return JSON.parse(JSON.stringify(chapter, stripAuditKeys)) as PublicChapterContent;
}

function stripAuditKeys(key: string, value: unknown) {
  return key === "sources" || key === "sourceAudit" ? undefined : value;
}
