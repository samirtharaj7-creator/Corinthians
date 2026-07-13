import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
import { SearchInterface } from "@/components/search-interface";
import { getSearchIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Romans chapters and verses."
};

export default function SearchPage() {
  const items = getSearchIndex();
  return (
    <main>
      <PageHero
        eyebrow="Search"
        title="Search"
        description="Search Romans chapter text, KJV verses, and study commentary."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="rounded-lg border border-border bg-card p-6">Loading search...</div>}>
          <SearchInterface items={items} />
        </Suspense>
      </div>
    </main>
  );
}
