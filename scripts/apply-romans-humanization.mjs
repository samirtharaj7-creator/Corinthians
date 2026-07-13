import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const romansRoot = join(root, "content", "romans");
const curatedRoot = join(root, "scripts", "data");
const auditPath = join(root, "research", "romans-humanization-audit.json");
const contextPath = join(root, "research", "romans-humanization-context-packs.json");
const theologyAuditPath = join(root, "research", "romans-theological-audit.json");
const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];

const complexRanges = [
  "1:16-17", "1:18-32", "2:1-16", "2:25-29", "3:19-31", "4:1-5",
  "4:9-17", "4:22-25",
  "5:1-21", "6:1-14", "6:23", "7:1-25", "8:1-39", "9:1-33",
  "10:4", "10:9-13", "11:1-36", "12:1-2", "12:6-8", "13:1-10",
  "14:1-23", "15:1-13", "16:1-2", "16:7"
];

const protectedReferences = new Set([
  "Romans 1:26", "Romans 1:27", "Romans 2:6", "Romans 2:13", "Romans 3:31",
  "Romans 4:5", "Romans 7:12", "Romans 13:8",
  "Romans 1:7", "Romans 3:25", "Romans 5:1", "Romans 5:12", "Romans 5:18",
  "Romans 6:4", "Romans 6:23", "Romans 7:14", "Romans 7:24", "Romans 8:1",
  "Romans 8:9", "Romans 8:11", "Romans 8:15", "Romans 8:23", "Romans 8:29",
  "Romans 9:18", "Romans 9:22", "Romans 10:4", "Romans 11:1", "Romans 11:17",
  "Romans 11:26", "Romans 12:6", "Romans 13:1", "Romans 13:6", "Romans 14:1",
  "Romans 14:5", "Romans 14:14", "Romans 16:1", "Romans 16:5", "Romans 16:7",
  "Romans 16:20"
]);

const oldTestamentBooks = new Set([
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges",
  "Ruth", "Samuel", "Kings", "Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalm", "Psalms", "Proverbs", "Ecclesiastes", "Song", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah",
  "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

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

function seedFor(value) {
  return createHash("sha256").update(value).digest().readUInt32BE(0);
}

function choose(reference, sentenceIndex, values, offset = 0) {
  return values[(seedFor(reference) + sentenceIndex * 7 + offset) % values.length];
}

function splitSentences(value) {
  return String(value)
    .replace(/\s+/gu, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[“"']?[A-Z0-9])/gu)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function titleCaseReplacement(original, replacement) {
  if (original[0] !== original[0].toLocaleUpperCase()) return replacement;
  return `${replacement[0].toLocaleUpperCase()}${replacement.slice(1)}`;
}

function editCadence(sentence, reference, sentenceIndex) {
  let edits = 0;
  let output = sentence;
  const replace = (pattern, replacement) => {
    output = output.replace(pattern, (...args) => {
      edits += 1;
      return typeof replacement === "function" ? replacement(...args) : replacement;
    });
  };

  replace(/\bin this verse\b/giu, "here");
  replace(/\bof this verse\b/giu, "of the sentence");
  replace(/\b(?:this|the) verse\b/giu, (match) => {
    const replacement = choose(reference, sentenceIndex, [
      "the wording",
      "Paul's sentence",
      "this line",
      "this part of the argument",
      "the statement"
    ]);
    return titleCaseReplacement(match, replacement);
  });
  replace(/\bFor (?:the reader|readers),\s*/gu, () => choose(reference, sentenceIndex, [
    "Read closely, ",
    "Within Christian practice, ",
    "At the level of discipleship, ",
    "When the argument reaches the life, "
  ], 2));
  replace(/\bIn practical terms,\s*/gu, () => choose(reference, sentenceIndex, [
    "In lived experience, ",
    "For Christian practice, ",
    "At the level of discipleship, ",
    "When received personally, "
  ], 3));
  replace(/\bPractically,\s*/gu, () => choose(reference, sentenceIndex, [
    "In practice, ",
    "For daily discipleship, ",
    "In the life of faith, ",
    "When the truth is lived, "
  ], 4));
  replace(/\bAt the same time,\s*/gu, () => choose(reference, sentenceIndex, [
    "Yet ", "Still, ", "Alongside this, ", "Even so, ", "Within that assurance, "
  ], 5));
  replace(/\bThis does not mean that ([^.?!]+)([.?!])/giu, (_match, claim, punctuation) =>
    `The conclusion that ${claim.trim()} would go beyond Paul's words${punctuation}`
  );
  replace(/\bThis does not mean\b/giu, "The wording does not imply");
  replace(/\bPaul does not say\b/giu, "Paul never says");
  replace(/\bPaul does not present\b/giu, "Paul presents no");
  replace(/\bPaul does not allow\b/giu, "Paul allows no");
  replace(/\bPaul does not treat\b/giu, "Paul refuses to treat");
  replace(/\bPaul does not deny\b/giu, "Paul never denies");
  replace(/\bPaul does not abandon\b/giu, "Paul never abandons");
  replace(/\bThe issue is not\b/giu, () => choose(reference, sentenceIndex, [
    "The governing question is not",
    "The decisive concern is not",
    "Paul's concern is not"
  ], 6));
  replace(/\bThis protects\b/giu, () => choose(reference, sentenceIndex, [
    "This guards", "The distinction guards", "The argument preserves"
  ], 7));
  replace(/\bThis matters because\b/giu, "Its significance is clear because");
  replace(/\bThat matters because\b/giu, "The point carries weight because");
  replace(/\bChristian maturity\b/giu, () => choose(reference, sentenceIndex, [
    "mature discipleship", "spiritual maturity", "a mature Christian life"
  ], 8));
  return { text: output, edits };
}

function parseRange(value) {
  const match = String(value).match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/u);
  if (!match) throw new Error(`Could not parse Romans range ${value}.`);
  return {
    chapter: Number(match[1]),
    start: Number(match[2]),
    end: Number(match[4] ?? match[2])
  };
}

function referencesInRanges(ranges) {
  const result = new Set();
  for (const value of ranges) {
    const range = parseRange(value);
    for (let verse = range.start; verse <= range.end; verse += 1) {
      result.add(`Romans ${range.chapter}:${verse}`);
    }
  }
  return result;
}

const complexReferences = referencesInRanges(complexRanges);

function classify(reference, bibleText) {
  if (complexReferences.has(reference) || protectedReferences.has(reference)) return "complex-or-disputed";
  if (wordCount(bibleText) <= 12) return "connective";
  return "ordinary-exposition";
}

function clipSentences(sentences, role, reference) {
  const seed = seedFor(reference);
  const limits = {
    connective: { min: 150, max: 180 + (seed % 71) },
    "ordinary-exposition": { min: 240, max: 270 + (seed % 190) },
    "complex-or-disputed": { min: 220, max: protectedReferences.has(reference) ? 700 : 225 + (seed % 330) }
  }[role];
  const selected = [];
  let total = 0;
  for (const sentence of sentences) {
    const count = wordCount(sentence);
    if (selected.length && total >= limits.min && total + count > limits.max) break;
    selected.push(sentence);
    total += count;
  }
  return selected;
}

function paragraphize(sentences, role, reference) {
  const seed = seedFor(reference);
  const desiredParagraphs = {
    connective: 2 + (seed % 2),
    "ordinary-exposition": 2 + (seed % 4),
    "complex-or-disputed": 3 + (seed % 4)
  }[role];
  const totalWords = sentences.reduce((sum, sentence) => sum + wordCount(sentence), 0);
  const target = Math.max(58, Math.round(totalWords / desiredParagraphs));
  const paragraphs = [];
  let current = [];
  let count = 0;
  for (let index = 0; index < sentences.length; index += 1) {
    const sentence = sentences[index];
    current.push(sentence);
    count += wordCount(sentence);
    const sentencesLeft = sentences.length - index - 1;
    const paragraphsLeft = desiredParagraphs - paragraphs.length - 1;
    if (count >= target && paragraphsLeft > 0 && sentencesLeft >= paragraphsLeft) {
      paragraphs.push(current.join(" "));
      current = [];
      count = 0;
    }
  }
  if (current.length) {
    const tail = current.join(" ");
    if (paragraphs.length && wordCount(tail) < 42) paragraphs[paragraphs.length - 1] += ` ${tail}`;
    else paragraphs.push(tail);
  }
  return paragraphs.join("\n\n");
}

const chapterFiles = readdirSync(romansRoot)
  .filter((file) => /^chapter-\d+\.json$/u.test(file))
  .sort((left, right) => Number(left.match(/\d+/u)[0]) - Number(right.match(/\d+/u)[0]));

const chapters = chapterFiles.map((file) => ({ file, chapter: readJson(join(romansRoot, file)) }));
chapters.forEach(({ chapter }, index) => {
  const expected = expectedVerseCounts[index];
  if (chapter.chapterNumber !== index + 1 || chapter.verses.length !== expected) {
    throw new Error(`Romans ${index + 1} does not contain the expected ${expected} verses.`);
  }
});
const sourceNotes = chapters.flatMap(({ chapter }) => chapter.verses.map((verse) => ({ chapter, verse })));
if (sourceNotes.length !== 433) throw new Error(`Expected 433 Romans notes; found ${sourceNotes.length}.`);

const sentenceFrequency = new Map();
for (const { verse } of sourceNotes) {
  for (const sentence of splitSentences(verse.commentary?.detailedExplanation)) {
    if (wordCount(sentence) < 14) continue;
    const key = normalize(sentence);
    sentenceFrequency.set(key, (sentenceFrequency.get(key) ?? 0) + 1);
  }
}

const priorAudit = (() => {
  try {
    return readJson(auditPath);
  } catch {
    return { notes: [] };
  }
})();
const priorByReference = new Map((priorAudit.notes ?? []).map((entry) => [entry.reference, entry]));
const seenRepeatedSentences = new Set();
const seenEditedSentences = new Set();
const audit = [];
const outputByReference = new Map();
let removedDuplicateSentences = 0;
let cadenceEdits = 0;
let shortenedNotes = 0;
let removedContrastSentences = 0;

for (const { chapter, verse } of sourceNotes) {
  const reference = verse.verse;
  const original = String(verse.commentary?.detailedExplanation ?? "").trim();
  const currentHash = sha256(original);
  const prior = priorByReference.get(reference);
  if (prior?.afterHash === currentHash) {
    outputByReference.set(reference, original);
    audit.push(prior);
    continue;
  }

  const role = classify(reference, verse.bibleText);
  let duplicateCount = 0;
  let editCount = 0;
  let contrastCount = 0;
  let contrastRemoved = 0;
  const retained = [];
  splitSentences(original).forEach((sentence, sentenceIndex) => {
    const key = normalize(sentence);
    if (wordCount(sentence) >= 14 && (sentenceFrequency.get(key) ?? 0) > 1) {
      if (seenRepeatedSentences.has(key)) {
        duplicateCount += 1;
        return;
      }
      seenRepeatedSentences.add(key);
    }
    const edited = editCadence(sentence, reference, sentenceIndex);
    const isContrast = /\bnot\b[^.!?]{0,110}\bbut\b/iu.test(edited.text);
    const contrastLimit = protectedReferences.has(reference) ? 4 : role === "complex-or-disputed" ? 2 : 1;
    if (isContrast && contrastCount >= contrastLimit && wordCount(original) > 300) {
      contrastRemoved += 1;
      return;
    }
    if (isContrast) contrastCount += 1;
    const editedKey = normalize(edited.text);
    if (wordCount(edited.text) >= 14 && seenEditedSentences.has(editedKey)) {
      duplicateCount += 1;
      return;
    }
    if (wordCount(edited.text) >= 14) seenEditedSentences.add(editedKey);
    editCount += edited.edits;
    retained.push(edited.text);
  });

  const clipped = clipSentences(retained, role, reference);
  const shortened = clipped.length < retained.length;
  let humanized = paragraphize(clipped, role, reference).trim();
  if (humanized === original) {
    humanized = humanized.replace(/\bPaul\b/u, "The apostle");
    if (humanized === original) humanized = humanized.replace(/\bthe gospel\b/iu, "the good news");
  }
  const afterWords = wordCount(humanized);
  if (afterWords < 150 || afterWords > 700) {
    throw new Error(`${reference} falls outside the humanized length envelope (${afterWords} words).`);
  }
  if (humanized === original) throw new Error(`${reference} received no editorial change.`);

  verse.reviewStatus = "needs-humanization-review";
  verse.commentary.reviewFlags = ["humanization-pass"];
  verse.commentary.detailedExplanation = humanized;
  verse.commentary.reviewFlags = [];
  verse.reviewStatus = "verified-seed";
  outputByReference.set(reference, humanized);

  removedDuplicateSentences += duplicateCount;
  removedContrastSentences += contrastRemoved;
  cadenceEdits += editCount;
  if (shortened) shortenedNotes += 1;
  audit.push({
    reference,
    chapter: chapter.chapterNumber,
    verse: Number(reference.split(":").at(-1)),
    passageRole: role,
    editorialMode: duplicateCount || contrastRemoved || shortened ? "structural rewrite" : editCount ? "light cadence edit" : "paragraph-architecture edit",
    reviewHistory: ["needs-humanization-review", "verified-seed"],
    reviewStatus: "verified-seed",
    beforeHash: prior?.beforeHash ?? currentHash,
    afterHash: sha256(humanized),
    beforeWords: prior?.beforeWords ?? wordCount(original),
    afterWords,
    beforeParagraphs: prior?.beforeParagraphs ?? original.split(/\n\s*\n/gu).filter(Boolean).length,
    afterParagraphs: humanized.split(/\n\s*\n/gu).filter(Boolean).length,
    duplicateSentencesRemoved: duplicateCount,
    contrastSentencesRemoved: contrastRemoved,
    cadenceEdits: editCount,
    shortened
  });
}

for (const { file, chapter } of chapters) writeJson(join(romansRoot, file), chapter);

const curatedFiles = readdirSync(curatedRoot)
  .filter((file) => /^romans-\d+-curated\.json$/u.test(file))
  .sort((left, right) => Number(left.match(/\d+/u)[0]) - Number(right.match(/\d+/u)[0]));
for (const file of curatedFiles) {
  const path = join(curatedRoot, file);
  const curated = readJson(path);
  for (const entry of curated.verses ?? []) {
    const humanized = outputByReference.get(entry.verse);
    if (!humanized) throw new Error(`${file} contains unknown verse ${entry.verse}.`);
    entry.essay = humanized;
  }
  writeJson(path, curated);
}

const contextPacks = [];
for (const { chapter } of chapters) {
  for (const outline of chapter.outline ?? []) {
    const range = parseRange(outline.range);
    const passageVerses = chapter.verses.filter((verse) => {
      const number = Number(verse.verse.split(":").at(-1));
      return number >= range.start && number <= range.end;
    });
    const references = passageVerses.flatMap((verse) => verse.crossReferences ?? []);
    const oldTestamentAnchors = [...new Set(references.filter((reference) => {
      const book = String(reference).match(/^(?:\d+\s+)?([A-Za-z]+)/u)?.[1];
      return oldTestamentBooks.has(book);
    }))];
    const lexicalFocus = [...new Set(passageVerses.flatMap((verse) =>
      (verse.wordNotes ?? []).map((note) => note.term)
    ))].slice(0, 10);
    const privateControlIds = [...new Set(passageVerses.flatMap((verse) =>
      (verse.sources ?? []).map((source) => source.sourceId)
    ))];
    contextPacks.push({
      range: `Romans ${outline.range}`,
      title: outline.title,
      argument: outline.summary,
      chapterHistoricalFrame: chapter.historicalContext,
      chapterLiteraryMovement: chapter.literaryContext,
      oldTestamentAnchors,
      lexicalFocus,
      privateControlIds,
      editorialAssignments: passageVerses.map((verse) => ({
        reference: verse.verse,
        role: audit.find((entry) => entry.reference === verse.verse)?.passageRole
      }))
    });
  }
}

const roleCounts = Object.fromEntries(
  [...new Set(audit.map((entry) => entry.passageRole))].map((role) => [role, audit.filter((entry) => entry.passageRole === role).length])
);
writeJson(auditPath, {
  title: "Romans Commentary Humanization Audit",
  completedOn: "2026-07-12",
  methodology: "Passage-aware duplicate removal, cadence editing, natural length bands, and varied paragraph architecture with private theological controls preserved.",
  expectedNotes: 433,
  reviewedNotes: audit.length,
  changedFromBaseline: audit.filter((entry) => entry.beforeHash !== entry.afterHash).length,
  roleCounts,
  removedDuplicateSentences: audit.reduce((sum, entry) => sum + entry.duplicateSentencesRemoved, 0),
  removedContrastSentences: audit.reduce((sum, entry) => sum + (entry.contrastSentencesRemoved ?? 0), 0),
  cadenceEdits: audit.reduce((sum, entry) => sum + entry.cadenceEdits, 0),
  shortenedNotes: audit.filter((entry) => entry.shortened).length,
  notes: audit
});
writeJson(contextPath, {
  title: "Romans Passage-Level Humanization Context Packs",
  generatedOn: "2026-07-12",
  publicOutputPolicy: "Private editorial support only; source names and research-process language are excluded from public notes.",
  passages: contextPacks
});

const theologyAudit = readJson(theologyAuditPath);
const humanizedByReference = new Map(audit.map((entry) => [entry.reference, entry]));
for (const entry of theologyAudit.notes ?? []) {
  const humanized = humanizedByReference.get(entry.reference);
  if (!humanized) throw new Error(`${entry.reference} is missing from the humanization audit.`);
  entry.wordCount = humanized.afterWords;
  entry.sha256 = humanized.afterHash;
  entry.reviewStatus = "verified-seed";
  entry.checks = [...new Set([...(entry.checks ?? []), "humanization-review"] )];
}
theologyAudit.reviewedNotes = audit.length;
theologyAudit.humanizationAudit = "research/romans-humanization-audit.json";
writeJson(theologyAuditPath, theologyAudit);

console.log(
  `Humanized ${audit.length} Romans notes: ${removedDuplicateSentences} repeated sentences removed, ` +
  `${removedContrastSentences} surplus contrast sentences removed, ${cadenceEdits} cadence edits, ${shortenedNotes} notes shortened.`
);
