"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SearchItem = {
  id: string;
  type: string;
  title: string;
  href: string;
  text: string;
};

export function SearchInterface({ items }: { items: SearchItem[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState("all");
  const searchableItems = useMemo(() => items.filter((item) => item.text.trim()), [items]);
  const fuse = useMemo(
    () =>
      new Fuse(searchableItems, {
        keys: ["title", "text", "type"],
        threshold: 0.32,
        includeMatches: true
      }),
    [searchableItems]
  );
  const results = useMemo(() => {
    const trimmed = query.trim();
    const normalized = trimmed.toLowerCase();
    const requiredTerms = normalized.split(/\s+/).filter((term) => term && !["a", "an", "and", "of", "the", "to"].includes(term));
    const directMatches = trimmed
      ? searchableItems.filter((item) => {
        const searchable = `${item.title} ${item.text}`.toLowerCase();
        return searchable.includes(normalized) || requiredTerms.every((term) => searchable.includes(term));
      })
      : [];
    const fuzzyMatches = trimmed ? fuse.search(trimmed).map((result) => result.item) : [];
    const seen = new Set<string>();
    const base = [...directMatches, ...fuzzyMatches].filter((item) => {
      const key = `${item.type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return type === "all" ? base.slice(0, 80) : base.filter((item) => item.type === type).slice(0, 80);
  }, [fuse, searchableItems, query, type]);
  const types = ["all", ...Array.from(new Set(searchableItems.map((item) => item.type)))];

  return (
    <div className="space-y-5">
      <div className="folio-panel p-4">
        <label className="text-sm font-semibold" htmlFor="search">Search the study</label>
        <input
          id="search"
          className="mt-2 h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Romans chapters or verses"
        />
        {types.length > 1 ? <div className="mt-4 flex flex-wrap gap-2">
          {types.map((item) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${type === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"}`}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div> : null}
      </div>
      <div className="grid gap-3">
        {!searchableItems.length ? (
          <div className="empty-slot flex min-h-56 items-center justify-center p-6 text-center">
          <div>
            <Search className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-bold text-muted-foreground">Search index is being prepared.</p>
          </div>
          </div>
        ) : results.length ? results.map((item) => (
          <Link key={`${item.type}-${item.id}`} href={item.href} className="folio-panel-soft p-4 transition hover:border-primary/70">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.type}</Badge>
              <h2 className="font-serif-display text-lg font-semibold">{item.title}</h2>
            </div>
            {item.text ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.text}</p> : null}
          </Link>
        )) : (
          <div className="empty-slot flex min-h-48 items-center justify-center p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No matching study text found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
