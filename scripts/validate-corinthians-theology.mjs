import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const books = ["1-corinthians", "2-corinthians"];
const errors = [];
const verses = new Map();
const privateManifestPath = join(root, ".research", "corinthians-source-manifest.json");

const prohibitedPublicPatterns = [
  { label: "URL", pattern: /https?:\/\/|\bwww\./iu },
  { label: "file citation marker", pattern: /\bfilecite\b|\bturn\d+(?:file|search|view)\d+\b|[]/iu },
  { label: "research-process language", pattern: /\b(?:uploaded|research corpus|source audit|source trail|bibliograph(?:y|ic)|footnotes?|endnotes?)\b/iu },
  { label: "editorial-process language", pattern: /\b(?:humanization|public prose|sounds? human|machine[- ]generated|formulaic|editorial (?:pass|note|language)|drafting process|rewrite (?:this |the |these )?(?:commentary|notes?|prose))\b/iu },
  { label: "source attribution", pattern: /\baccording to (?:the )?(?:commentator|scholar|author|researcher)\b/iu }
];

const privateSourcePhrases = new Set();

function normalizeForIdentityScan(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function addPrivateSourcePhrase(value) {
  const normalized = normalizeForIdentityScan(value);
  if (normalized.length >= 6 && normalized !== "various") privateSourcePhrases.add(normalized);
}

if (existsSync(privateManifestPath)) {
  const manifest = JSON.parse(readFileSync(privateManifestPath, "utf8"));
  const genericTitles = new Set([
    "1 corinthians",
    "2 corinthians",
    "first corinthians",
    "second corinthians",
    "commentary on 1 2 corinthians"
  ]);
  for (const resource of manifest.resources ?? []) {
    const author = String(resource.author ?? "").trim();
    const title = String(resource.title ?? "").trim();
    for (const individualAuthor of author.split(/\s*;\s*/gu)) addPrivateSourcePhrase(individualAuthor);
    const normalizedTitle = title.toLocaleLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
    if (title.length >= 12 && !genericTitles.has(normalizedTitle)) addPrivateSourcePhrase(title);
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function requirePatterns(reference, requirements) {
  const text = verses.get(reference) ?? "";
  for (const { label, pattern } of requirements) {
    assert(pattern.test(text), `${reference} is missing the required ${label} safeguard.`);
  }
}

function auditPublicText(label, value) {
  const publicText = String(value ?? "");
  for (const { label: patternLabel, pattern } of prohibitedPublicPatterns) {
    assert(!pattern.test(publicText), `${label} contains prohibited ${patternLabel}.`);
  }
  const foldedPublicText = ` ${normalizeForIdentityScan(publicText)} `;
  for (const phrase of privateSourcePhrases) {
    assert(!foldedPublicText.includes(` ${phrase} `), `${label} exposes a private source name or title.`);
  }
}

function auditPublicValue(label, value) {
  if (typeof value === "string") {
    auditPublicText(label, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => auditPublicValue(`${label}[${index}]`, entry));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "sources" || key === "sourceAudit") continue;
    auditPublicValue(`${label}.${key}`, entry);
  }
}

for (const book of books) {
  const bookRoot = join(root, "content", book);
  for (const file of readdirSync(bookRoot).filter((entry) => entry.endsWith(".json")).sort()) {
    const chapter = JSON.parse(readFileSync(join(bookRoot, file), "utf8"));
    auditPublicValue(`${book} ${chapter.chapterNumber}`, chapter);
    for (const verse of chapter.verses ?? []) {
      const text = verse.commentary?.detailedExplanation ?? "";
      verses.set(verse.verse, text);
      assert(text.trim().length > 0, `${verse.verse} is missing detailed commentary.`);
      assert(verse.reviewStatus === "verified-seed", `${verse.verse} has not completed the theological review.`);
      assert(Array.isArray(verse.sources) && verse.sources.length === 0, `${verse.verse} must not expose sources.`);
      for (const [field, entries] of Object.entries(verse.sourceAudit ?? {})) {
        assert(Array.isArray(entries) && entries.length === 0, `${verse.verse}.sourceAudit.${field} must remain empty.`);
      }
    }
  }
}

assert(verses.size === 694, `Expected 694 reviewed verses; found ${verses.size}.`);

requirePatterns("1 Corinthians 16:2", [
  { label: "collection context", pattern: /\b(?:collection|relief|Jerusalem)\b/iu },
  { label: "private setting", pattern: /\b(?:par['’]?\s*heaut[oō]|by himself|at home|personally set)\b/iu },
  { label: "absence of a worship service", pattern: /\b(?:no|not|does not|doesn['’]t)\b[^.]{0,100}\b(?:assembly|worship service|congregational gathering)\b/iu },
  { label: "Sabbath safeguard", pattern: /\bSabbath\b/iu },
  { label: "no sacred-day transfer", pattern: /\b(?:no|not|does not|doesn['’]t)\b[^.]{0,120}\b(?:transfer|replace|abolish|sacred|holy)\b/iu },
  { label: "planned proportional giving", pattern: /\b(?:planned|regular|proportionate|proportional)\b/iu }
]);

for (const reference of ["1 Corinthians 8:8", "1 Corinthians 10:25", "1 Corinthians 10:27"]) {
  requirePatterns(reference, [
    { label: "idol-food context", pattern: /\bidol/iu },
    { label: "clean-and-unclean distinction", pattern: /\bclean\b[^.]{0,100}\bunclean\b|\bunclean\b[^.]{0,100}\bclean\b/iu },
    { label: "non-abolition of the food distinction", pattern: /\b(?:does not|cannot|is not)\b[^.]{0,180}\b(?:abolish|make\b[^.]{0,60}\b(?:unclean|clean)|indistinguishable)\b/iu }
  ]);
}

for (const reference of ["1 Corinthians 14:2", "1 Corinthians 14:13", "1 Corinthians 14:27"]) {
  requirePatterns(reference, [
    { label: "human-language interpretation", pattern: /\b(?:human|foreign|real) languages?\b|\bmeaningful language\b/iu },
    { label: "interpretation or translation", pattern: /\b(?:interpret|translation|translate)/iu }
  ]);
  const text = verses.get(reference) ?? "";
  assert(!/\b(?:ecstatic speech|private prayer language|prayer beyond .*ordinary speech)\b/iu.test(text), `${reference} retains private ecstatic-language ambiguity.`);
}

requirePatterns("1 Corinthians 3:15", [
  { label: "anti-purgatory clarification", pattern: /\bpurgatory\b|\bnot\b[^.]{0,100}\b(?:purif(?:y|ies)|postmortem)\b/iu }
]);

requirePatterns("1 Corinthians 15:29", [
  { label: "no proxy-baptism authorization", pattern: /\b(?:proxy|vicarious|on behalf of the dead)\b/iu },
  { label: "no authorization", pattern: /\b(?:does not|doesn['’]t|not|neither)\b[^.]{0,100}\b(?:command|approve|authorize|establish)\b/iu }
]);

for (const reference of ["1 Corinthians 15:51", "2 Corinthians 5:3", "2 Corinthians 5:8"]) {
  requirePatterns(reference, [
    { label: "unconscious death-sleep", pattern: /\b(?:unconscious|sleep|sleeping)\b/iu },
    { label: "resurrection hope", pattern: /\bresurrection\b|\bChrist['’]?s (?:return|coming)\b/iu },
    { label: "rejection of conscious disembodied survival", pattern: /\b(?:does not|not)\b[^.]{0,160}\b(?:conscious soul|immortal soul|disembodied (?:existence|interval))\b|\b(?:conscious soul|immortal soul|disembodied (?:existence|interval))\b[^.]{0,160}\b(?:does not|not)\b/iu }
  ]);
}

requirePatterns("2 Corinthians 3:6", [
  { label: "continuing moral law", pattern: /\b(?:not|does not|doesn['’]t)\b[^.]{0,120}\b(?:commandments?|law|moral claim)\b|\b(?:commandments?|law)\b[^.]{0,120}\b(?:not|never)\b/iu },
  { label: "Spirit-enabled obedience", pattern: /\bSpirit\b[^.]{0,160}\b(?:obedience|heart|life)\b/iu }
]);

for (const reference of ["2 Corinthians 9:6", "2 Corinthians 9:7"]) {
  requirePatterns(reference, [
    { label: "anti-prosperity safeguard", pattern: /\b(?:not|does not|doesn['’]t|never)\b[^.]{0,140}\b(?:wealth|income|financial|prosperity|material rewards?|personal enrichment)\b/iu }
  ]);
}

if (errors.length) {
  console.error(`Corinthians theological validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Corinthians theological validation passed: 694 reviewed notes and all targeted doctrinal safeguards are present.");
