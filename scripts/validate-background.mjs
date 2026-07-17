import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const backgroundPath = join(root, "content", "background.json");
const legacyPaths = [
  join(root, "content", "background.md"),
  join(root, "scripts", "import-background.mjs")
];
const expectedSectionIds = [
  "pauline-authorship",
  "date-and-place-of-writing",
  "corinth-and-its-world",
  "the-founding-and-makeup-of-the-church",
  "pauls-relationship-with-corinth",
  "why-paul-wrote-1-corinthians",
  "why-paul-wrote-2-corinthians",
  "how-the-letters-fit-together"
];
const errors = [];

const prohibitedPatterns = [
  { label: "source terminology", pattern: /\bsources?\b/iu },
  { label: "resource terminology", pattern: /\bresources?\b/iu },
  { label: "uploaded-material wording", pattern: /\buploaded\b/iu },
  { label: "supplied-material wording", pattern: /\bsupplied\b/iu },
  { label: "research-process wording", pattern: /\bresearch(?:ed|ers?)?\b/iu },
  { label: "method wording", pattern: /\bmethod(?:ology)?\b/iu },
  { label: "bibliography wording", pattern: /\bbibliograph(?:y|ies|ic|ical)\b/iu },
  { label: "citation wording", pattern: /\bcitations?\b/iu },
  { label: "footnote wording", pattern: /\bfootnotes?\b/iu },
  { label: "endnote wording", pattern: /\bendnotes?\b/iu },
  { label: "attribution wording", pattern: /\baccording\s+to\b/iu },
  { label: "commentator wording", pattern: /\bcommentators?\b/iu },
  { label: "commentary-source wording", pattern: /\bcommentaries\b/iu },
  { label: "report-process wording", pattern: /\bthis\s+report\b/iu },
  { label: "corpus wording", pattern: /\bcorpus\b/iu },
  { label: "file citation marker", pattern: /\bfilecite\b|\bturn\d+file\d+\b|[]/iu },
  { label: "page locator", pattern: /\bpp?\.\s*\d+(?:\s*[–-]\s*\d+)?/iu },
  { label: "numbered footnote marker", pattern: /\[\^?\d+\]/u },
  { label: "author-year citation", pattern: /\([\p{Lu}][\p{L}'’.-]+(?:\s+(?:&|and)\s+[\p{Lu}][\p{L}'’.-]+)?,?\s+\d{4}[a-z]?(?:,\s*(?:pp?\.\s*)?\d+)?\)/u },
  { label: "bibliographic identifier or URL", pattern: /\b(?:doi|isbn)\b|https?:\/\/|\bwww\./iu },
  { label: "et al. citation", pattern: /\bet\s+al\.?\b/iu },
  { label: "direct quotation marks", pattern: /["“”„‟«»]/u },
  { label: "Richard B. Hays", pattern: /\bhays(?:['’]s)?\b/iu },
  { label: "Ben Witherington III", pattern: /\bwitherington(?:\s+iii)?(?:['’]s)?\b/iu },
  { label: "Diego Silva", pattern: /\bsilva(?:['’]s)?\b/iu },
  { label: "Charles Savelle", pattern: /\bsavelle(?:['’]s)?\b/iu },
  { label: "Ernest Best", pattern: /\bErnest\s+Best\b|\bBest\b/u },
  { label: "Tom Wright", pattern: /\bwright(?:['’]s)?\b/iu },
  { label: "D. A. Carson", pattern: /\bcarson(?:['’]s)?\b/iu },
  { label: "James A. Davis", pattern: /\bdavis(?:['’]s)?\b/iu },
  { label: "Paul Stevens", pattern: /\bstevens(?:['’]s)?\b/iu },
  { label: "Robert Dutch", pattern: /\bdutch(?:['’]s)?\b/iu },
  { label: "Conflict and Community in Corinth", pattern: /\bconflict\s+and\s+community\s+in\s+corinth\b/iu },
  { label: "God's People in Corinth", pattern: /\bgod['’]?s\s+people\s+in\s+corinth\b/iu },
  { label: "Paul for Everyone", pattern: /\bpaul\s+for\s+everyone\b/iu },
  { label: "Finding Strength in Weakness", pattern: /\bfinding\s+strength\s+in\s+weakness\b/iu },
  { label: "A Model of Christian Maturity", pattern: /\ba\s+model\s+of\s+christian\s+maturity\b/iu },
  { label: "1 Corinthians Notes", pattern: /\b1\s+corinthians\s+notes\b/iu },
  { label: "Getting the Most Out of 2 Corinthians", pattern: /\bgetting\s+the\s+most\s+out\s+of\s+2\s+corinthians\b/iu }
];

const distinctivePhrases = [
  "an apostle of Christ Jesus by the will of God",
  "prosperous commercial crossroads",
  "strategic juncture for commerce and travel",
  "public boasting and self promotion had become an art form",
  "the first to come all the way",
  "born in hurt",
  "something terrible had happened",
  "deeper into sorrow and hurt",
  "ruthlessly competitive spirit",
  "lively joyful excited and full of questions",
  "daily death to self interest and grace perfected in weakness",
  "resocialization into the gospel",
  "conversion was real but incomplete",
  "fragile movement toward reconciliation",
  "broadly coherent historical crisis",
  "strained love rather than detached controversy",
  "religiously crowded Roman city",
  "strategically placed economically vigorous socially stratified"
];

const commonOverlapTokens = new Set([
  "a", "an", "and", "are", "around", "as", "at", "be", "because", "been", "before", "being", "between", "both", "but", "by",
  "did", "do", "does", "during", "for", "from", "had", "has", "have", "he", "her", "his", "if", "in", "into", "is", "it", "its",
  "no", "not", "of", "on", "one", "or", "our", "over", "she", "than", "that", "the", "their", "them", "then", "these", "they",
  "this", "those", "through", "to", "two", "under", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whose",
  "with", "without", "first", "second",
  "ad", "bc", "acts", "achaia", "acrocorinth", "aphrodite", "apollos", "aquila", "athens", "caesar", "cenchreae", "chloe", "christ",
  "christian", "christians", "church", "churches", "claudius", "corinth", "corinthian", "corinthians", "crispus", "ephesus", "gallio", "god",
  "gospel", "greece", "greek", "isthmian", "jerusalem", "jesus", "justus", "lechaeum", "letter", "letters", "macedonia", "ministry", "paul",
  "peloponnese", "priscilla", "roman", "rome", "silas", "sosthenes", "timothy", "titius", "titus"
]);

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value) {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/([\p{L}\p{N}]+)['’]s\b/gu, "$1")
    .replace(/['’]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
}

function countWords(value) {
  return value.normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function collectStrings(value, path = "background", entries = []) {
  if (typeof value === "string") {
    entries.push({ path, value });
    return entries;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, entries));
    return entries;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectStrings(item, `${path}.${key}`, entries));
  }

  return entries;
}

function validatePublicText(entries) {
  for (const entry of entries) {
    for (const { label, pattern } of prohibitedPatterns) {
      if (pattern.test(entry.value)) {
        errors.push(`${entry.path} contains prohibited ${label}.`);
      }
    }

    const normalized = normalizeText(entry.value);
    for (const phrase of distinctivePhrases) {
      if (normalized.includes(normalizeText(phrase))) {
        errors.push(`${entry.path} repeats the distinctive manuscript phrase "${phrase}".`);
      }
    }
  }
}

function narrativeEntries(background) {
  const entries = [];
  (background.sections ?? []).forEach((section, sectionIndex) => {
    (section?.blocks ?? []).forEach((block, blockIndex) => {
      if (block?.type === "paragraph" && typeof block.text === "string") {
        entries.push({ path: `background.sections[${sectionIndex}].blocks[${blockIndex}].text`, value: block.text });
      }
    });
  });
  return entries;
}

function isSuspiciousShingle(tokens) {
  const normalizedLength = tokens.join(" ").length;
  const substantive = tokens.filter((token) => !commonOverlapTokens.has(token) && !/^\d+$/.test(token));
  return normalizedLength >= 70 && substantive.length >= 6 && new Set(substantive).size >= 5;
}

function validateManuscriptOverlap(publicEntries, manuscriptPath) {
  const sourceTokens = tokenize(readFileSync(manuscriptPath, "utf8"));
  const sourceShingles = new Map();
  const size = 12;

  for (let index = 0; index <= sourceTokens.length - size; index += 1) {
    const shingleTokens = sourceTokens.slice(index, index + size);
    if (!isSuspiciousShingle(shingleTokens)) continue;
    const shingle = shingleTokens.join(" ");
    if (!sourceShingles.has(shingle)) sourceShingles.set(shingle, index);
  }

  const reported = new Set();
  for (const entry of publicEntries) {
    const tokens = tokenize(entry.value);
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const shingleTokens = tokens.slice(index, index + size);
      if (!isSuspiciousShingle(shingleTokens)) continue;
      const shingle = shingleTokens.join(" ");
      if (!sourceShingles.has(shingle) || reported.has(`${entry.path}:${shingle}`)) continue;
      reported.add(`${entry.path}:${shingle}`);
      errors.push(`${entry.path} has a suspicious 12-word exact overlap with the manuscript: "${shingle}".`);
      break;
    }
  }
}

for (const legacyPath of legacyPaths) {
  assert(!existsSync(legacyPath), `Legacy background pipeline file must be removed: ${legacyPath.slice(root.length + 1)}.`);
}

if (!existsSync(backgroundPath)) {
  errors.push("content/background.json is missing.");
} else {
  let background;
  try {
    background = JSON.parse(readFileSync(backgroundPath, "utf8"));
  } catch (error) {
    errors.push(`content/background.json is not valid JSON: ${error.message}`);
  }

  if (background) {
    assert(isNonEmptyString(background.title), "background.title must be a non-empty string.");
    assert(isNonEmptyString(background.subtitle), "background.subtitle must be a non-empty string.");

    assert(Array.isArray(background.sections), "background.sections must be an array.");
    const actualSectionIds = (background.sections ?? []).map((section) => section?.id);
    assert(
      actualSectionIds.length === expectedSectionIds.length && actualSectionIds.every((id, index) => id === expectedSectionIds[index]),
      `Expected exactly these eight ordered section ids: ${expectedSectionIds.join(", ")}; found: ${actualSectionIds.join(", ") || "none"}.`
    );

    const blocks = [];
    (background.sections ?? []).forEach((section, sectionIndex) => {
      assert(isNonEmptyString(section?.title), `background.sections[${sectionIndex}].title must be a non-empty string.`);
      assert(Array.isArray(section?.blocks) && section.blocks.length > 0, `background.sections[${sectionIndex}].blocks must not be empty.`);
      (section?.blocks ?? []).forEach((block, blockIndex) => {
        blocks.push({ block, path: `background.sections[${sectionIndex}].blocks[${blockIndex}]` });
        assert(["paragraph", "timeline", "glance", "comparison"].includes(block?.type), `${blocks.at(-1).path} has unsupported type ${String(block?.type)}.`);
        if (block?.type === "paragraph") {
          assert(isNonEmptyString(block.text), `${blocks.at(-1).path}.text must be a non-empty string.`);
        }
      });
    });

    const timelines = blocks.filter(({ block }) => block?.type === "timeline");
    assert(timelines.length === 1, `Expected exactly 1 timeline; found ${timelines.length}.`);
    if (timelines.length === 1) {
      const { block, path } = timelines[0];
      assert(isNonEmptyString(block.title), `${path}.title must be a non-empty string.`);
      assert(isNonEmptyString(block.note), `${path}.note must be a non-empty string.`);
      assert(Array.isArray(block.events) && block.events.length === 7, `${path}.events must contain exactly 7 events; found ${block.events?.length ?? 0}.`);
      (block.events ?? []).forEach((event, index) => {
        assert(isNonEmptyString(event?.date), `${path}.events[${index}].date must be a non-empty string.`);
        assert(isNonEmptyString(event?.title), `${path}.events[${index}].title must be a non-empty string.`);
        assert(isNonEmptyString(event?.description), `${path}.events[${index}].description must be a non-empty string.`);
      });
    }

    const comparisons = blocks.filter(({ block }) => block?.type === "comparison");
    assert(comparisons.length === 1, `Expected exactly 1 comparison table; found ${comparisons.length}.`);
    if (comparisons.length === 1) {
      const { block, path } = comparisons[0];
      assert(isNonEmptyString(block.title), `${path}.title must be a non-empty string.`);
      assert(Array.isArray(block.headers) && block.headers.length === 3, `${path}.headers must contain exactly 3 columns.`);
      (block.headers ?? []).forEach((header, index) => assert(isNonEmptyString(header), `${path}.headers[${index}] must be a non-empty string.`));
      assert(Array.isArray(block.rows) && block.rows.length >= 1 && block.rows.length <= 5, `${path}.rows must contain 1–5 rows to remain compact.`);
      (block.rows ?? []).forEach((row, rowIndex) => {
        assert(Array.isArray(row) && row.length === 3, `${path}.rows[${rowIndex}] must contain exactly 3 cells.`);
        (row ?? []).forEach((cell, cellIndex) => assert(isNonEmptyString(cell), `${path}.rows[${rowIndex}][${cellIndex}] must be a non-empty string.`));
      });
    }

    const glances = blocks.filter(({ block }) => block?.type === "glance");
    assert(glances.length === 1, `Expected exactly 1 Book at a Glance table; found ${glances.length}.`);
    if (glances.length === 1) {
      const { block, path } = glances[0];
      assert(block.title === "Book at a Glance", `${path}.title must be Book at a Glance.`);
      assert(Array.isArray(block.headers) && block.headers.length === 2, `${path}.headers must contain exactly 2 columns.`);
      assert(block.headers?.[0] === "Detail" && block.headers?.[1] === "Information", `${path}.headers must be Detail and Information.`);
      assert(Array.isArray(block.rows) && block.rows.length >= 6 && block.rows.length <= 10, `${path}.rows must contain 6–10 rows.`);
      (block.rows ?? []).forEach((row, rowIndex) => {
        assert(Array.isArray(row) && row.length === 2, `${path}.rows[${rowIndex}] must contain exactly 2 cells.`);
        (row ?? []).forEach((cell, cellIndex) => assert(isNonEmptyString(cell), `${path}.rows[${rowIndex}][${cellIndex}] must be a non-empty string.`));
      });
      assert(
        background.sections.at(-1)?.blocks?.some((candidate) => candidate === block),
        "The Book at a Glance table must appear in the final section."
      );
    }

    const allPublicEntries = collectStrings(background);
    validatePublicText(allPublicEntries);

    const narrative = narrativeEntries(background);
    const narrativeWordCount = narrative.reduce((total, entry) => total + countWords(entry.value), 0);
    assert(
      narrativeWordCount >= 1600 && narrativeWordCount <= 2000,
      `Background narrative must contain 1600–2000 words; found ${narrativeWordCount}. The count includes main paragraph blocks only.`
    );

    const manuscriptArgument = process.argv[2];
    if (manuscriptArgument) {
      const manuscriptPath = resolve(root, manuscriptArgument);
      if (!existsSync(manuscriptPath)) {
        errors.push(`Manuscript overlap file does not exist: ${manuscriptPath}.`);
      } else {
        validateManuscriptOverlap(allPublicEntries, manuscriptPath);
      }
    }

    if (!errors.length) {
      const overlapSummary = process.argv[2] ? " Optional 12-word manuscript-overlap audit passed." : " Manuscript-overlap audit skipped (no path supplied).";
      console.log(
        `Background content validated: ${expectedSectionIds.length} ordered sections, 1 seven-event timeline, ` +
        `1 two-column Book at a Glance table, 1 three-column comparison table, and ${narrativeWordCount} narrative words. ` +
        `Word count includes main paragraph blocks only.${overlapSummary}`
      );
    }
  }
}

if (errors.length) {
  console.error(`Background validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
