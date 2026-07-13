"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const key = "romans.bookmarks.v1";
const fallbackBookmarks = new Set<string>();

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readBookmarks(): string[] {
  const store = storage();
  if (!store) return Array.from(fallbackBookmarks);
  try {
    return JSON.parse(store.getItem(key) ?? "[]") as string[];
  } catch {
    return Array.from(fallbackBookmarks);
  }
}

function writeBookmarks(next: string[]) {
  const store = storage();
  fallbackBookmarks.clear();
  next.forEach((item) => fallbackBookmarks.add(item));
  if (store) store.setItem(key, JSON.stringify(next));
}

export function BookmarkButton({ id, label }: { id: string; label: string }) {
  const [bookmarked, setBookmarked] = useState(() => readBookmarks().includes(id));

  function toggle() {
    const current = readBookmarks();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeBookmarks(next);
    setBookmarked(next.includes(id));
  }

  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={toggle} className={cn(bookmarked && "text-primary")}>
      <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
    </Button>
  );
}
