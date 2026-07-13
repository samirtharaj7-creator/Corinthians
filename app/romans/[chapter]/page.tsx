import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RomansChapterStrip } from "@/components/romans-chapter-strip";
import { ChapterStudy, type PublicChapterContent } from "@/components/verse-accordion";
import { getChapter } from "@/lib/content";
import type { ChapterContent } from "@/lib/schemas";

const CHAPTER_COUNT = 16;

export function generateStaticParams() {
  return Array.from({ length: CHAPTER_COUNT }, (_, index) => ({ chapter: String(index + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const { chapter } = await params;
  const content = getChapter(chapter);
  return {
    title: `Romans ${content.chapterNumber}`,
    description: content.summary || `Romans ${content.chapterNumber}`
  };
}

export default async function RomansChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const content = getChapter(chapter);
  const publicContent = withoutAuditSources(content);
  const previous = content.chapterNumber > 1 ? content.chapterNumber - 1 : null;
  const next = content.chapterNumber < CHAPTER_COUNT ? content.chapterNumber + 1 : null;

  return (
    <main className="reader-page">
      <RomansChapterStrip activeChapter={content.chapterNumber} />
      <ChapterStudy chapter={publicContent} />
      <nav className="reader-chapter-nav no-print">
        {previous ? (
          <Link href={`/romans/${previous}`}>
            <ChevronLeft className="h-4 w-4" />
            Romans {previous}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/romans/${next}`}>
            Romans {next}
            <ChevronRight className="h-4 w-4" />
          </Link>
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
