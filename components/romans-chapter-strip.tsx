import Link from "next/link";
import { BookOpen } from "lucide-react";

export function RomansChapterStrip({ activeChapter }: { activeChapter: number }) {
  const chapterRows = [
    Array.from({ length: 8 }, (_, index) => index + 1),
    Array.from({ length: 8 }, (_, index) => index + 9)
  ];

  return (
    <nav className="chapter-strip no-print" aria-label="Romans chapter navigation">
      <div className="chapter-strip-inner">
        <div className="chapter-strip-label">
          <BookOpen className="h-4 w-4" />
          Chapter
        </div>
        <div className="chapter-strip-links">
          {chapterRows.map((row, rowIndex) => (
            <div className="chapter-strip-row" key={rowIndex}>
              {row.map((chapter) => (
                <Link
                  key={chapter}
                  href={`/romans/${chapter}`}
                  aria-current={chapter === activeChapter ? "page" : undefined}
                  className={chapter === activeChapter ? "chapter-strip-link chapter-strip-link-active" : "chapter-strip-link"}
                >
                  {chapter}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
