import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const romansRoot = join(root, "content", "romans");
const audit = JSON.parse(readFileSync(join(root, "research", "romans-humanization-audit.json"), "utf8"));
const contextPacks = JSON.parse(readFileSync(join(root, "research", "romans-humanization-context-packs.json"), "utf8"));
const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
const notes = [];
const errors = [];

const stockPatterns = [
  { label: '“This verse”', pattern: /\bthis verse\b/giu, max: 8 },
  { label: '“The verse also”', pattern: /\bthe verse also\b/giu, max: 5 },
  { label: '“For the reader”', pattern: /\bfor the reader\b/giu, max: 5 },
  { label: '“The issue is not”', pattern: /\bthe issue is not\b/giu, max: 3 },
  { label: '“This does not mean”', pattern: /\bthis does not mean\b/giu, max: 3 },
  { label: '“At the same time”', pattern: /\bat the same time\b/giu, max: 10 },
  { label: '“There is tenderness”', pattern: /\bthere is tenderness\b/giu, max: 2 },
  { label: '“Christian maturity”', pattern: /\bchristian maturity\b/giu, max: 3 },
  { label: '“Paul does not”', pattern: /\bpaul does not\b/giu, max: 115 }
];

const forbiddenPublicPatterns = [
  { label: "Adventist attribution", pattern: /\bAdventist\b/iu },
  { label: "General Conference source name", pattern: /General Conference of Seventh-day Adventists/iu },
  { label: "Biblical Research Institute source name", pattern: /Biblical Research Institute/iu },
  { label: "Ellen White source name", pattern: /Ellen G\.? White/iu },
  { label: "public URL", pattern: /https?:\/\/|\bwww\./iu },
  { label: "citation marker", pattern: /\bfilecite\b|[]/iu },
  { label: "research-process language", pattern: /\b(?:our research|source audit|research process|private source)\b/iu },
  { label: "unresolved replacement placeholder", pattern: /\$\d/u },
  { label: "duplicated copular clause", pattern: /\b(?:is|are|was|were)\s+(?:it|he|she|they|we|you|I)\s+(?:is|are|was|were)\b/u },
  { label: "unsafe contrast inversion", pattern: /\brather than (?:told|called|asked|required|invited)\b/iu }
];

function words(value) {
  return String(value).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];
}

function wordCount(value) {
  return words(value).length;
}

function normalize(value) {
  return words(value).join(" ").toLocaleLowerCase();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function splitSentences(value) {
  return String(value)
    .replace(/\s+/gu, " ")
    .split(/(?<=[.!?])\s+(?=[“"']?[A-Z0-9])/gu)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function ngrams(value, size = 4) {
  const tokens = words(value).map((word) => word.toLocaleLowerCase());
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = left.size <= right.size ? right : left;
  for (const value of smaller) if (larger.has(value)) overlap += 1;
  return overlap / (left.size + right.size - overlap);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coefficientOfVariation(values) {
  const average = mean(values);
  if (!average) return 0;
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance) / average;
}

function countMatches(value, pattern) {
  pattern.lastIndex = 0;
  return [...value.matchAll(pattern)].length;
}

function stripPrivateFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivateFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "sources" && key !== "sourceAudit")
      .map(([key, entry]) => [key, stripPrivateFields(entry)])
  );
}

const chapterFiles = readdirSync(romansRoot)
  .filter((file) => /^chapter-\d+\.json$/u.test(file))
  .sort((left, right) => Number(left.match(/\d+/u)[0]) - Number(right.match(/\d+/u)[0]));
const chapters = chapterFiles.map((file) => JSON.parse(readFileSync(join(romansRoot, file), "utf8")));

chapters.forEach((chapter, chapterIndex) => {
  const expected = expectedVerseCounts[chapterIndex];
  if (chapter.chapterNumber !== chapterIndex + 1 || chapter.verses.length !== expected) {
    errors.push(`Romans ${chapterIndex + 1} has ${chapter.verses.length} verses; expected ${expected}.`);
  }
  for (const verse of chapter.verses) {
    const text = String(verse.commentary?.detailedExplanation ?? "").trim();
    notes.push({
      reference: verse.verse,
      chapter: chapter.chapterNumber,
      text,
      words: wordCount(text),
      paragraphs: text.split(/\n\s*\n/gu).filter(Boolean).length,
      sentences: splitSentences(text),
      grams: ngrams(text),
      reviewStatus: verse.reviewStatus,
      reviewFlags: verse.commentary?.reviewFlags ?? [],
      publicText: JSON.stringify(stripPrivateFields(verse))
    });
  }
});

if (notes.length !== 433) errors.push(`Expected 433 Romans notes; found ${notes.length}.`);
if (audit.expectedNotes !== 433 || audit.reviewedNotes !== 433 || audit.notes?.length !== 433) {
  errors.push("The humanization audit does not account for all 433 notes.");
}
if (!Array.isArray(contextPacks.passages) || contextPacks.passages.length < 40) {
  errors.push("Passage-level context packs are missing or incomplete.");
}

const auditByReference = new Map((audit.notes ?? []).map((entry) => [entry.reference, entry]));
for (const note of notes) {
  const entry = auditByReference.get(note.reference);
  if (!entry) {
    errors.push(`${note.reference} is missing from the humanization audit.`);
    continue;
  }
  if (entry.beforeHash === entry.afterHash) errors.push(`${note.reference} was not changed from its baseline.`);
  if (entry.afterHash !== sha256(note.text)) errors.push(`${note.reference} no longer matches its audited humanized text.`);
  if (note.reviewStatus !== "verified-seed") errors.push(`${note.reference} is not verified-seed.`);
  if (note.reviewFlags.length) errors.push(`${note.reference} still has review flags.`);
  if (note.words < 150 || note.words > 700) errors.push(`${note.reference} has ${note.words} words; expected 150–700.`);
  if (entry.passageRole === "connective" && note.words > 275) {
    errors.push(`${note.reference} is classified as connective but remains ${note.words} words.`);
  }
  if (/ {2,}/u.test(note.text)) errors.push(`${note.reference} contains repeated spaces.`);
  for (const forbidden of forbiddenPublicPatterns) {
    if (forbidden.pattern.test(note.publicText)) errors.push(`${note.reference} exposes ${forbidden.label}.`);
  }
}

const allText = notes.map((note) => note.text).join("\n");
for (const item of stockPatterns) {
  item.count = countMatches(allText, item.pattern);
  if (item.count > item.max) errors.push(`${item.label} occurs ${item.count} times; expected ${item.max} or fewer.`);
}

const repeatedSentences = new Map();
const repeatedParagraphs = new Map();
for (const note of notes) {
  for (const sentence of note.sentences) {
    if (wordCount(sentence) < 14) continue;
    const key = normalize(sentence);
    const refs = repeatedSentences.get(key) ?? [];
    refs.push(note.reference);
    repeatedSentences.set(key, refs);
  }
  for (const paragraph of note.text.split(/\n\s*\n/gu)) {
    if (wordCount(paragraph) < 30) continue;
    const key = normalize(paragraph);
    const refs = repeatedParagraphs.get(key) ?? [];
    refs.push(note.reference);
    repeatedParagraphs.set(key, refs);
  }
}
const duplicatedSentences = [...repeatedSentences.values()].filter((refs) => refs.length > 1);
const duplicatedParagraphs = [...repeatedParagraphs.values()].filter((refs) => refs.length > 1);
if (duplicatedSentences.length) errors.push(`${duplicatedSentences.length} long sentence(s) remain duplicated.`);
if (duplicatedParagraphs.length) errors.push(`${duplicatedParagraphs.length} substantial paragraph(s) remain duplicated.`);

const adjacentSimilarity = [];
for (let index = 1; index < notes.length; index += 1) {
  const previous = notes[index - 1];
  const current = notes[index];
  if (previous.chapter !== current.chapter) continue;
  const score = jaccard(previous.grams, current.grams);
  if (score >= 0.42) adjacentSimilarity.push({ left: previous.reference, right: current.reference, score });
}
const severeAdjacent = adjacentSimilarity.filter((entry) => entry.score >= 0.56);
if (severeAdjacent.length) errors.push(`${severeAdjacent.length} adjacent pair(s) retain severe phrase similarity.`);

const openerCounts = new Map();
for (const note of notes) {
  const opener = words(note.sentences[0] ?? "").slice(0, 5).join(" ").toLocaleLowerCase();
  openerCounts.set(opener, (openerCounts.get(opener) ?? 0) + 1);
}
const repeatedOpeners = [...openerCounts.entries()].filter(([, count]) => count > 4);
if (repeatedOpeners.length) errors.push(`${repeatedOpeners.length} five-word opener(s) occur more than four times.`);

for (const chapter of chapters) {
  const chapterNotes = notes.filter((note) => note.chapter === chapter.chapterNumber);
  const variation = coefficientOfVariation(chapterNotes.map((note) => note.words));
  if (chapterNotes.length >= 10 && variation < 0.09) {
    errors.push(`Romans ${chapter.chapterNumber} remains too uniform (word-count CV ${variation.toFixed(3)}).`);
  }
  const paragraphFrequency = new Map();
  for (const note of chapterNotes) {
    paragraphFrequency.set(note.paragraphs, (paragraphFrequency.get(note.paragraphs) ?? 0) + 1);
  }
  const dominant = [...paragraphFrequency.entries()].sort((left, right) => right[1] - left[1])[0];
  if (dominant && dominant[1] / chapterNotes.length > 0.78) {
    errors.push(`Romans ${chapter.chapterNumber} gives ${dominant[1]} notes exactly ${dominant[0]} paragraphs.`);
  }
}

const contrastCount = countMatches(allText, /\bnot\b[^.!?]{0,110}\bbut\b/giu);
const genericEndingCount = notes.filter((note) =>
  /\b(?:this (?:line|statement|part of the argument) (?:calls|invites)|christian maturity|for the reader|generic faithfulness)\b/iu.test(note.sentences.at(-1) ?? "")
).length;
const roleSummary = Object.fromEntries(
  [...new Set(audit.notes.map((entry) => entry.passageRole))].map((role) => [role, audit.notes.filter((entry) => entry.passageRole === role).length])
);

console.log("Romans humanization audit");
console.log(`- Notes: ${notes.length}`);
console.log(`- Total words: ${notes.reduce((sum, note) => sum + note.words, 0).toLocaleString()}`);
console.log(`- Average words per note: ${mean(notes.map((note) => note.words)).toFixed(1)}`);
console.log(`- Word range: ${Math.min(...notes.map((note) => note.words))}–${Math.max(...notes.map((note) => note.words))}`);
console.log(`- Average paragraphs per note: ${mean(notes.map((note) => note.paragraphs)).toFixed(1)}`);
console.log(`- Passage roles: ${JSON.stringify(roleSummary)}`);
console.log(`- Repeated long sentences: ${duplicatedSentences.length}`);
console.log(`- Repeated substantial paragraphs: ${duplicatedParagraphs.length}`);
console.log(`- Adjacent similarity flags: ${adjacentSimilarity.length} (${severeAdjacent.length} severe)`);
console.log(`- Repeated five-word openers: ${repeatedOpeners.length}`);
console.log(`- “not … but …” contrasts: ${contrastCount}`);
console.log(`- Generic endings: ${genericEndingCount}`);
for (const item of stockPatterns) console.log(`- ${item.label}: ${item.count}`);

if (errors.length) {
  console.error(`Romans humanization validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Romans humanization validation passed.");
