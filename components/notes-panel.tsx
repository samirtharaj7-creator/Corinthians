"use client";

import { NotebookPen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const key = "romans.notes.v1";
const fallbackNotes: Record<string, string> = {};

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readNotes(): Record<string, string> {
  const store = storage();
  if (!store) return fallbackNotes;
  try {
    return JSON.parse(store.getItem(key) ?? "{}") as Record<string, string>;
  } catch {
    return fallbackNotes;
  }
}

function writeNotes(notes: Record<string, string>) {
  Object.assign(fallbackNotes, notes);
  const store = storage();
  if (store) store.setItem(key, JSON.stringify(notes));
}

export function NotesPanel({ id, title }: { id: string; title: string }) {
  const [value, setValue] = useState(() => readNotes()[id] ?? "");

  function save(next: string) {
    const notes = readNotes();
    notes[id] = next;
    writeNotes(notes);
    setValue(next);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notes for ${title}`}>
          <NotebookPen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} Notes</DialogTitle>
          <DialogDescription>Private notes are stored only in this browser with local storage.</DialogDescription>
        </DialogHeader>
        <textarea
          className="min-h-48 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={value}
          onChange={(event) => save(event.target.value)}
          placeholder="Add your study notes here. Stored only in this browser."
        />
      </DialogContent>
    </Dialog>
  );
}
