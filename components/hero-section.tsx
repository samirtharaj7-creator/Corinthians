/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation is intentional for the static Pages export. */

import {
  ArrowRight,
  BookOpen,
  BookOpenCheck
} from "lucide-react";

const studyActions = [
  {
    title: "First Corinthians",
    href: "/1-corinthians/1/",
    description: "Read the sixteen-chapter study of unity, holiness, worship, gifts, love, and resurrection.",
    icon: BookOpen
  },
  {
    title: "Second Corinthians",
    href: "/2-corinthians/1/",
    description: "Read the thirteen-chapter study of comfort, ministry, reconciliation, generosity, and strength.",
    icon: BookOpen
  },
  {
    title: "Historical Background",
    href: "/background/",
    description: "Explore Corinth, Paul's mission, the church's makeup, and the setting of both letters.",
    icon: BookOpenCheck
  }
] as const;

const bookPlans = [
  {
    id: "first-corinthians",
    slug: "1-corinthians",
    eyebrow: "First Letter · 16 Chapters",
    title: "1 Corinthians",
    chapterCount: 16
  },
  {
    id: "second-corinthians",
    slug: "2-corinthians",
    eyebrow: "Second Letter · 13 Chapters",
    title: "2 Corinthians",
    chapterCount: 13
  }
] as const;

export function HeroSection() {
  return (
    <section className="home-showcase">
      <div className="home-showcase-shell">
        <section className="home-showcase-hero" aria-labelledby="home-title">
          <div className="home-showcase-copy">
            <p className="home-title-prefix">The Epistles to the</p>
            <h1 id="home-title">Corinthians</h1>
            <p className="home-showcase-description">
              Read 1 and 2 Corinthians verse by verse, with the King James text alongside clear
              study notes that trace Paul&apos;s argument, theology, and pastoral counsel.
            </p>
            <div className="home-showcase-actions">
              <a href="/1-corinthians/1/" className="home-showcase-primary">
                Explore 1 Corinthians
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/2-corinthians/1/" className="home-showcase-secondary">
                Explore 2 Corinthians
              </a>
              <a href="/background/" className="home-showcase-secondary">
                Read the Background
              </a>
            </div>
          </div>
        </section>

        <section className="home-action-grid" aria-label="Primary study paths">
          {studyActions.map((action) => {
            const Icon = action.icon;
            return (
              <a key={action.href} href={action.href} className="home-action-card">
                <span className="home-action-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
                <em>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </em>
              </a>
            );
          })}
        </section>

        <section className="home-chapter-study" aria-labelledby="home-chapter-title">
          <div className="home-section-split">
            <div>
              <p className="home-section-kicker">Two-Book Study</p>
              <h2 id="home-chapter-title">Choose a letter and follow Paul&apos;s pastoral argument.</h2>
            </div>
            <p id="content-status">
              The complete 29-chapter reader places Scripture on the left and verse-by-verse
              exposition, historical context, and selected word studies on the right.
            </p>
          </div>

          <div className="home-chapter-group-grid">
            {bookPlans.map((book) => (
              <article key={book.id} id={book.id} className="home-chapter-group">
                <BookOpen className="home-chapter-group-icon h-6 w-6" />
                <p>{book.eyebrow}</p>
                <h3>{book.title}</h3>
                <div className="home-chapter-mini-grid">
                  {Array.from({ length: book.chapterCount }, (_, index) => index + 1).map((chapterNumber) => (
                    <a key={chapterNumber} href={`/${book.slug}/${chapterNumber}/`} aria-label={`${book.title} chapter ${chapterNumber}`}>
                      <span>{book.title}</span>
                      <strong>Chapter {chapterNumber}</strong>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
