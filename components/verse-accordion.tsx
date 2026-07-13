"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Library, List, Minus, Plus } from "lucide-react";
import type { ChapterContent, VerseEntry } from "@/lib/schemas";
import {
  READER_VERSE_CHANGE_EVENT,
  type ReaderVerseEventDetail
} from "@/lib/reader-events";
import { slugify } from "@/lib/utils";

type PublicVerseEntry = Omit<VerseEntry, "sources" | "sourceAudit">;
type PublicSymbol = Omit<ChapterContent["symbols"][number], "sources">;
type PublicRelatedConnection = Omit<ChapterContent["relatedConnections"][number], "sources">;
type PublicEvangelisticNotes = Omit<ChapterContent["evangelisticNotes"], "sources">;

export type PublicChapterContent = Omit<
  ChapterContent,
  "sources" | "symbols" | "relatedConnections" | "evangelisticNotes" | "verses"
> & {
  symbols: PublicSymbol[];
  relatedConnections: PublicRelatedConnection[];
  evangelisticNotes: PublicEvangelisticNotes;
  verses: PublicVerseEntry[];
};

const SCRIPTURE_MIN_LEVEL = -1;
const SCRIPTURE_MOBILE_MAX_LEVEL = 3;
const SCRIPTURE_DESKTOP_MAX_LEVEL = 5;
const NOTES_MIN_LEVEL = -1;
const NOTES_MAX_LEVEL = 3;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ChapterStudy({
  chapter,
  bookName = "Romans"
}: {
  chapter: PublicChapterContent;
  bookName?: string;
}) {
  const firstVerse = chapter.verses[0]?.verse ?? "";
  const [selectedVerseRef, setSelectedVerseRef] = useState(firstVerse);
  const [scriptureLevel, setScriptureLevel] = useState(0);
  const [notesLevel, setNotesLevel] = useState(0);
  const [isMobileReader, setIsMobileReader] = useState(false);

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      const simpleVerse = hash.match(/^v-?(\d+)$/);
      const match = simpleVerse
        ? chapter.verses[Number(simpleVerse[1]) - 1]
        : chapter.verses.find((verse) => slugify(verse.verse) === hash);
      if (match) {
        setSelectedVerseRef(match.verse);
        window.requestAnimationFrame(() => {
          document.getElementById(slugify(match.verse))?.scrollIntoView({ block: "center" });
        });
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [chapter.verses]);

  useEffect(() => {
    const match = selectedVerseRef.match(/:(\d+)$/);
    if (!match) return;

    window.dispatchEvent(
      new CustomEvent<ReaderVerseEventDetail>(READER_VERSE_CHANGE_EVENT, {
        detail: {
          bookName,
          chapter: chapter.chapterNumber,
          verse: Number(match[1])
        }
      })
    );
  }, [bookName, chapter.chapterNumber, selectedVerseRef]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    function syncReaderWidth() {
      setIsMobileReader(mediaQuery.matches);
    }

    syncReaderWidth();
    mediaQuery.addEventListener("change", syncReaderWidth);
    return () => mediaQuery.removeEventListener("change", syncReaderWidth);
  }, []);

  const selectedVerse = useMemo(
    () => chapter.verses.find((verse) => verse.verse === selectedVerseRef) ?? chapter.verses[0],
    [chapter.verses, selectedVerseRef]
  );

  const outlineByStartVerse = useMemo(() => {
    const sections = new Map<string, PublicChapterContent["outline"][number]>();
    chapter.outline.forEach((section) => {
      const parsed = parseReference(section.range);
      if (parsed) {
        sections.set(`${bookName} ${parsed.chapter}:${parsed.startVerse}`, section);
      }
    });
    return sections;
  }, [bookName, chapter.outline]);

  function selectVerse(verse: PublicVerseEntry) {
    setSelectedVerseRef(verse.verse);
    if (typeof window !== "undefined") {
      const verseNumber = verse.verse.match(/:(\d+)$/)?.[1];
      window.history.replaceState(null, "", verseNumber ? `#v${verseNumber}` : `#${slugify(verse.verse)}`);
    }
  }

  if (!selectedVerse) return null;

  const scriptureMaxLevel = isMobileReader ? SCRIPTURE_MOBILE_MAX_LEVEL : SCRIPTURE_DESKTOP_MAX_LEVEL;
  const scriptureMobileFontSize = clampNumber(18 + scriptureLevel * 2, 16, 24);
  const scriptureDesktopFontSize = clampNumber(20 + scriptureLevel * 2, 18, 30);
  const notesFontSize = clampNumber(18 + notesLevel * 2, 16, 24);
  const chapterTheme = chapter.title || chapter.themes[0] || "";
  const hasDetailedExplanation = Boolean(selectedVerse.commentary.detailedExplanation.trim());
  const hasStudyLinks = selectedVerse.crossReferences.length > 0 || selectedVerse.wordNotes.length > 0;

  return (
    <section
      className="split-reader"
      aria-label={`${bookName} ${chapter.chapterNumber} reader`}
      style={{
        "--scripture-mobile-font-size": `${scriptureMobileFontSize}px`,
        "--scripture-desktop-font-size": `${scriptureDesktopFontSize}px`,
        "--notes-font-size": `${notesFontSize}px`
      } as CSSProperties}
    >
      <div className="scripture-pane">
        <div className="reader-pane-toolbar no-print">
          <div>
            <div className="reader-pane-kicker">
              <BookOpen className="h-5 w-5" />
              King James Version
            </div>
            <p className="reader-pane-subtitle">
              <span className="reader-pane-subtitle-main">{bookName} {chapter.chapterNumber}</span>
              {chapterTheme ? (
                <>
                  <span className="reader-pane-subtitle-separator" aria-hidden="true">
                    ·
                  </span>
                  <span className="reader-pane-subtitle-theme">{chapterTheme}</span>
                </>
              ) : null}
            </p>
          </div>
          <FontScaleControls
            label="Bible text size controls"
            decreaseLabel="Decrease Bible text size"
            increaseLabel="Increase Bible text size"
            onDecrease={() => setScriptureLevel((value) => Math.max(SCRIPTURE_MIN_LEVEL, value - 1))}
            onIncrease={() => setScriptureLevel((value) => Math.min(scriptureMaxLevel, value + 1))}
          />
        </div>
        <div className="scripture-pane-body">
          <div className="scripture-pane-header">
            <h1>{bookName} Chapter {chapter.chapterNumber}</h1>
            {chapter.summary ? <p className="scripture-chapter-summary">{chapter.summary}</p> : null}
          </div>
          <div className="scripture-list">
            {chapter.verses.map((verse, index) => {
              const outlineSection = outlineByStartVerse.get(verse.verse);

              return (
                <div className="scripture-list-item" key={verse.verse}>
                  {outlineSection ? (
                    <PassageOutlineDivider
                      bookName={bookName}
                      chapterNumber={chapter.chapterNumber}
                      section={outlineSection}
                    />
                  ) : null}
                  <VerseButton
                    index={index + 1}
                    verse={verse}
                    active={verse.verse === selectedVerse.verse}
                    onSelect={() => selectVerse(verse)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="commentary-pane">
        <div className="reader-pane-toolbar reader-pane-toolbar-notes no-print">
          <div className="reader-pane-kicker">
            <List className="h-5 w-5" />
            Study Notes
          </div>
          <FontScaleControls
            label="Study Notes text size controls"
            decreaseLabel="Decrease Study Notes text size"
            increaseLabel="Increase Study Notes text size"
            onDecrease={() => setNotesLevel((value) => Math.max(NOTES_MIN_LEVEL, value - 1))}
            onIncrease={() => setNotesLevel((value) => Math.min(NOTES_MAX_LEVEL, value + 1))}
          />
        </div>
        <div className="commentary-pane-body">
          <div className="commentary-shell">
          <article className={hasDetailedExplanation || hasStudyLinks ? "exposition-card" : "exposition-card exposition-card-blank"}>
            <div className="exposition-card-heading">
              <h2>{selectedVerse.verse}</h2>
            </div>
            {hasDetailedExplanation ? (
              <DetailedExplanation value={selectedVerse.commentary.detailedExplanation} />
            ) : (
              <div className="commentary-blank-space" aria-label={`Blank study notes for ${selectedVerse.verse}`} />
            )}
            {hasStudyLinks ? (
              <VerseStudyCard
                crossReferences={selectedVerse.crossReferences}
                wordNotes={selectedVerse.wordNotes}
              />
            ) : null}
          </article>
          </div>
        </div>
      </aside>
    </section>
  );
}

function PassageOutlineDivider({
  bookName,
  chapterNumber,
  section
}: {
  bookName: string;
  chapterNumber: number;
  section: PublicChapterContent["outline"][number];
}) {
  return (
    <div className="passage-outline-divider" aria-label={`Passage outline: ${bookName} ${section.range}`}>
      <div className="passage-outline-range">{bookName} {section.range}</div>
      <div className="passage-outline-title">{section.title}</div>
      <span className="sr-only">Chapter {chapterNumber} passage section</span>
    </div>
  );
}

function FontScaleControls({
  label,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease
}: {
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="reader-pane-controls" aria-label={label}>
      <button type="button" onClick={onDecrease} aria-label={decreaseLabel}>
        <Minus className="h-5 w-5" />
      </button>
      <button type="button" onClick={onIncrease} aria-label={increaseLabel}>
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

function VerseButton({ index, verse, active, onSelect }: { index: number; verse: PublicVerseEntry; active: boolean; onSelect: () => void }) {
  return (
    <button
      id={slugify(verse.verse)}
      className={active ? "scripture-card scripture-card-active" : "scripture-card"}
      onClick={onSelect}
      type="button"
    >
      <span className="verse-number">{index}</span>
      <span className="verse-copy">
        {verse.bibleText || "Verse text unavailable."}
      </span>
    </button>
  );
}

function DetailedExplanation({ value }: { value: string }) {
  return (
    <div className="commentary-reading">
      {value.split("\n\n").map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function VerseStudyCard({
  crossReferences,
  wordNotes
}: {
  crossReferences: string[];
  wordNotes: PublicVerseEntry["wordNotes"];
}) {
  const hasReferences = crossReferences.length > 0;
  const hasWordNotes = wordNotes.length > 0;

  return (
    <section className="verse-study-card" aria-label="Cross references and word notes">
      <div className="verse-study-card-header">
        <Library className="h-4 w-4" />
        Study Links
      </div>
      {hasReferences || hasWordNotes ? (
        <div className="verse-study-grid">
          {hasReferences ? (
            <div className="study-card-section">
              <h3>Cross References</h3>
              <div className="reference-chip-list">
                {crossReferences.map((reference) => (
                  <span className="reference-chip" key={reference}>
                    {reference}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {hasWordNotes ? (
            <div className="study-card-section study-card-section-wide">
              <h3>Word / Phrase Notes</h3>
              <div className="word-note-list">
                {wordNotes.map((note) => (
                  <article className="word-note" key={`${note.term}-${note.scriptureReferences.join("-")}`}>
                    <div className="word-note-title">{note.term}</div>
                    <p>{note.explanation}</p>
                    {note.scriptureReferences.length > 0 ? (
                      <div className="word-reference-list" aria-label={`${note.term} Scripture references`}>
                        {note.scriptureReferences.map((reference) => (
                          <span className="word-reference-chip" key={`${note.term}-${reference}`}>
                            {reference}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="study-card-empty">Study links are ready to be added for this verse.</p>
      )}
    </section>
  );
}

function parseReference(reference: string) {
  const match = reference.match(/(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const chapter = Number(match[1]);
  const verse = Number(match[2]);
  const endVerse = Number(match[3] ?? match[2]);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse) || !Number.isFinite(endVerse)) return null;
  return { chapter, verse, startVerse: verse, endVerse };
}
