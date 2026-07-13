import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const romansRoot = join(root, "content", "romans");
const bibliographyPath = join(root, "content", "resources", "bibliography.json");
const auditPath = join(root, "research", "romans-theological-audit.json");
const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
const requiredControlIds = ["gc-methods-bible-study", "adventist-fundamental-beliefs", "egw-faith-and-works"];
const errors = [];
const verses = new Map();
const verseRecords = new Map();

const prohibitedPublicPatterns = [
  { label: "denominational label", pattern: /\bAdventist\b/iu },
  { label: "URL", pattern: /https?:\/\/|\bwww\./iu },
  { label: "file citation marker", pattern: /\bfilecite\b|\bturn\d+(?:file|search|view)\d+\b|[]/iu },
  { label: "research-process language", pattern: /\b(?:uploaded|research corpus|source audit|source trail|bibliograph(?:y|ic)|footnotes?|endnotes?)\b/iu },
  { label: "modern-source attribution", pattern: /\baccording to (?:the )?(?:commentator|scholar|author|researcher|Biblical Research Institute)\b/iu }
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function wordCount(value) {
  return value.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function collectPublicStrings(value, path = "root", output = []) {
  if (typeof value === "string") {
    output.push({ path, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectPublicStrings(entry, `${path}[${index}]`, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "sources" || key === "sourceAudit") continue;
    collectPublicStrings(entry, `${path}.${key}`, output);
  }
  return output;
}

function hasSource(refs, sourceId) {
  return Array.isArray(refs) && refs.some((ref) => ref?.sourceId === sourceId);
}

function requirePatterns(reference, requirements) {
  const text = verses.get(reference) ?? "";
  for (const { label, pattern } of requirements) {
    assert(pattern.test(text), `${reference} is missing the required ${label} safeguard.`);
  }
}

const bibliography = readJson(bibliographyPath);
const sourceIds = new Set((bibliography.resources ?? []).map((resource) => resource.id));
for (const sourceId of requiredControlIds) {
  assert(sourceIds.has(sourceId), `Bibliography is missing required private control ${sourceId}.`);
}

const privateAuthorNames = [...new Set((bibliography.resources ?? [])
  .map((resource) => String(resource.author ?? "").trim())
  .filter((author) => author.length >= 6 && author.toLocaleLowerCase() !== "various" && author !== "Project Gutenberg"))];

let total = 0;
for (let chapterNumber = 1; chapterNumber <= 16; chapterNumber += 1) {
  const file = `chapter-${String(chapterNumber).padStart(2, "0")}.json`;
  const chapter = readJson(join(romansRoot, file));
  const expectedCount = expectedVerseCounts[chapterNumber - 1];
  assert(chapter.chapterNumber === chapterNumber, `${file} has the wrong chapter number.`);
  assert(chapter.verses?.length === expectedCount, `${file} should contain ${expectedCount} verses.`);
  for (const sourceId of requiredControlIds) {
    assert(hasSource(chapter.sources, sourceId), `${file} is missing chapter control ${sourceId}.`);
  }

  for (let index = 0; index < (chapter.verses ?? []).length; index += 1) {
    const verse = chapter.verses[index];
    const reference = `Romans ${chapterNumber}:${index + 1}`;
    const text = String(verse.commentary?.detailedExplanation ?? "").trim();
    total += 1;
    verses.set(reference, text);
    verseRecords.set(reference, verse);
    assert(verse.verse === reference, `${file} verse ${index + 1} should be labeled ${reference}.`);
    assert(text.length > 0, `${reference} is missing detailed commentary.`);
    assert(wordCount(text) >= 150, `${reference} has fewer than 150 words of reviewed commentary.`);
    assert(verse.reviewStatus === "verified-seed", `${reference} has not completed the theological review.`);
    assert(Array.isArray(verse.commentary?.reviewFlags) && verse.commentary.reviewFlags.length === 0, `${reference} still has review flags.`);

    for (const sourceId of requiredControlIds) {
      assert(hasSource(verse.sources, sourceId), `${reference} is missing private control ${sourceId}.`);
    }
    assert(hasSource(verse.sourceAudit?.exegesis, "gc-methods-bible-study"), `${reference} lacks its private hermeneutical audit control.`);
    assert(hasSource(verse.sourceAudit?.theologicalInsight, "adventist-fundamental-beliefs"), `${reference} lacks its private doctrinal audit control.`);
    assert(hasSource(verse.sourceAudit?.theologicalInsight, "egw-faith-and-works"), `${reference} lacks its private secondary theological cross-check.`);

    for (const [field, refs] of Object.entries(verse.sourceAudit ?? {})) {
      assert(Array.isArray(refs), `${reference}.sourceAudit.${field} must be an array.`);
      for (const ref of refs ?? []) assert(sourceIds.has(ref?.sourceId), `${reference}.sourceAudit.${field} references unknown source ${ref?.sourceId}.`);
    }
    for (const ref of verse.sources ?? []) assert(sourceIds.has(ref?.sourceId), `${reference} references unknown source ${ref?.sourceId}.`);

    const publicStrings = collectPublicStrings(verse, reference);
    const publicText = publicStrings.map((entry) => entry.value).join("\n");
    for (const { label, pattern } of prohibitedPublicPatterns) {
      assert(!pattern.test(publicText), `${reference} contains prohibited public ${label}.`);
    }
    const foldedPublicText = publicText.toLocaleLowerCase();
    for (const author of privateAuthorNames) {
      assert(!foldedPublicText.includes(author.toLocaleLowerCase()), `${reference} exposes private source author ${author}.`);
    }
  }

  const chapterPublicText = collectPublicStrings({ ...chapter, verses: [] }, `Romans ${chapterNumber}`)
    .map((entry) => entry.value)
    .join("\n");
  for (const { label, pattern } of prohibitedPublicPatterns) {
    assert(!pattern.test(chapterPublicText), `Romans ${chapterNumber} chapter copy contains prohibited public ${label}.`);
  }
}

assert(total === 433, `Expected 433 reviewed Romans notes; found ${total}.`);
assert(verses.size === 433, `Expected 433 unique Romans references; found ${verses.size}.`);

requirePatterns("Romans 1:26", [
  { label: "created-order reading", pattern: /\bcreated order\b|\bCreator\b[^.]{0,140}\b(?:design|order|natural)\b/iu },
  { label: "pastoral compassion", pattern: /\b(?:compassion|humility|not cruelty|not mockery|not scorn|tears, not scorn)\b/iu }
]);
requirePatterns("Romans 1:27", [
  { label: "biblical sexual ethic", pattern: /\b(?:created pattern|God['’]s design|moral boundaries)\b/iu },
  { label: "dignity without contempt", pattern: /\b(?:compassion|not despise|refusal to despise|mercy)\b/iu }
]);
for (const reference of ["Romans 2:6", "Romans 2:13"]) {
  requirePatterns(reference, [
    { label: "works as evidence", pattern: /\bworks?\b[\s\S]{0,300}\b(?:evidence|reveal|manifestation|fruit)\b|\b(?:evidence|reveal|manifestation|fruit)\b[\s\S]{0,300}\bworks?\b/iu },
    { label: "Christ rather than merit as the basis", pattern: /\b(?:not|never)\b[^.]{0,120}\b(?:ground|earn|merit|self-salvation|salvation by works)\b|\bChrist alone\b/iu }
  ]);
}
requirePatterns("Romans 3:25", [
  { label: "divine justice and mercy", pattern: /\b(?:justice|righteous)\b[^.]{0,160}\b(?:love|mercy|self-giving)\b|\b(?:love|mercy|self-giving)\b[^.]{0,160}\b(?:justice|righteous)\b/iu },
  { label: "Father and Son united at the cross", pattern: /\bFather\b[^.]{0,160}\bSon\b|\bGod is in Christ\b/iu }
]);
requirePatterns("Romans 3:31", [
  { label: "faith does not abolish the law", pattern: /\bfaith\b[^.]{0,160}\b(?:does not|not|never)\b[^.]{0,100}\b(?:abolish|nullify|cancel|make void)\b|\b(?:does not|not|never)\b[^.]{0,100}\b(?:abolish|nullify|cancel|make void)\b[^.]{0,160}\blaw\b/iu }
]);
requirePatterns("Romans 4:5", [
  { label: "faith is not meritorious", pattern: /\bfaith\b[^.]{0,140}\bnot\b[^.]{0,100}\bmeritorious\b|\bnot because faith is a meritorious\b/iu }
]);
requirePatterns("Romans 5:12", [
  { label: "inherited mortality and fallen condition", pattern: /\bfallen condition\b[^.]{0,120}\bmortality\b|\bmortality\b[^.]{0,120}\bfallen condition\b/iu },
  { label: "no inherited personal guilt", pattern: /\bnot\b[^.]{0,120}\bpersonally guilty\b|\bnot inherited personal guilt\b/iu }
]);
requirePatterns("Romans 5:18", [
  { label: "no automatic universal salvation", pattern: /\bnot automatic universal salvation\b|\bdoes not\b[^.]{0,120}\buniversal salvation\b/iu }
]);
requirePatterns("Romans 6:4", [
  { label: "baptism by immersion", pattern: /\bbaptism by immersion\b|\bimmersion\b[^.]{0,140}\b(?:burial|raised|water)\b/iu },
  { label: "newness of life", pattern: /\bnewness of life\b/iu }
]);
requirePatterns("Romans 6:23", [
  { label: "eternal life as gift", pattern: /\beternal life\b[^.]{0,100}\bgift\b|\bgift\b[^.]{0,100}\beternal life\b/iu },
  { label: "no natural immortality", pattern: /\bnot\b[^.]{0,100}\bnaturally immortal\b|\bGod alone possesses immortality\b/iu },
  { label: "resurrection hope", pattern: /\bresurrection\b/iu }
]);
requirePatterns("Romans 7:12", [
  { label: "holy and good law", pattern: /\blaw\b[^.]{0,120}\bholy\b[^.]{0,80}\bgood\b|\bcommandment\b[^.]{0,120}\bholy\b[^.]{0,80}\bgood\b/iu }
]);
for (const reference of ["Romans 7:14", "Romans 7:24"]) {
  requirePatterns(reference, [
    { label: "defeat is not the Christian ideal", pattern: /\bnot\b[^.]{0,140}\b(?:Christian ideal|final identity)\b/iu },
    { label: "deliverance through Christ and the Spirit", pattern: /\bdeliverance\b[^.]{0,180}\b(?:Christ|Jesus)\b[^.]{0,180}\bSpirit\b|\bSpirit\b[^.]{0,180}\bdeliverance\b/iu }
  ]);
}
requirePatterns("Romans 8:1", [
  { label: "assurance without presumption", pattern: /\bassurance\b[^.]{0,120}\bnot presumption\b|\bnot presumption\b/iu },
  { label: "Spirit-directed life", pattern: /\bSpirit-directed life\b|\blife in the Spirit\b/iu }
]);
requirePatterns("Romans 8:9", [
  { label: "personal Holy Spirit", pattern: /\bnot an impersonal\b[^.]{0,120}\bSpirit\b|\bSpirit\b[^.]{0,120}\bpersonal\b/iu }
]);
requirePatterns("Romans 8:11", [
  { label: "bodily resurrection", pattern: /\bbodily resurrection\b|\bgive life to mortal bodies\b/iu },
  { label: "no naturally immortal soul", pattern: /\bnot\b[^.]{0,120}\bnaturally immortal soul\b/iu }
]);
requirePatterns("Romans 8:23", [
  { label: "redemption of the body", pattern: /\bredemption of the body\b/iu },
  { label: "resurrection hope", pattern: /\bresurrection\b/iu }
]);
requirePatterns("Romans 8:29", [
  { label: "predestination to Christlike conformity", pattern: /\bpredestination\b[^.]{0,160}\bconformity\b|\bconformity\b[^.]{0,160}\bpredestination\b/iu },
  { label: "no unavoidable predestined damnation", pattern: /\bnot\b[^.]{0,140}\b(?:unavoidable damnation|decree that creates some people)\b/iu }
]);
assert(hasSource(verseRecords.get("Romans 8:15")?.sources, "gaius-institutes-adoption"), "Romans 8:15 is missing its Roman adoption primary-source control.");
requirePatterns("Romans 9:18", [
  { label: "judicial hardening", pattern: /\bHardening\b[^.]{0,100}\bjudicial\b|\bjudicial\b[^.]{0,100}\bhardening\b/iu },
  { label: "human responsibility", pattern: /\b(?:responsible|responsibility|resisted light|resists)\b/iu }
]);
requirePatterns("Romans 9:22", [
  { label: "divine longsuffering", pattern: /\blongsuffering\b|\bpatient endurance\b/iu },
  { label: "no creation solely for ruin", pattern: /\bnot\b[^.]{0,140}\bcreates? people solely for ruin\b|\bnot\b[^.]{0,140}\bsolely for ruin\b/iu }
]);
requirePatterns("Romans 10:4", [
  { label: "telos as goal or culmination", pattern: /\btelos\b[^.]{0,120}\b(?:goal|culmination)\b/iu },
  { label: "Christ does not abolish the moral law", pattern: /\bdoes not abolish\b[^.]{0,100}\b(?:moral will|law)\b/iu }
]);
requirePatterns("Romans 11:1", [
  { label: "no replacement pride", pattern: /\b(?:replacement pride|anti-Jewish replacement pride)\b/iu },
  { label: "one Redeemer", pattern: /\bone Redeemer\b|\bno separate covenant path around Christ\b/iu }
]);
requirePatterns("Romans 11:17", [
  { label: "no Gentile replacement or boasting", pattern: /\bdo not replace\b|\bnot replace\b|\bpermission to boast\b|\bnot boast\b/iu }
]);
requirePatterns("Romans 11:26", [
  { label: "no automatic ethnic salvation", pattern: /\bneither automatic salvation by ethnicity\b|\bnot automatic\b[^.]{0,100}\bethnicity\b/iu },
  { label: "salvation only through Christ", pattern: /\bno second way of salvation apart from Christ\b|\bmeans of salvation remains the Deliverer\b/iu }
]);
requirePatterns("Romans 12:6", [
  { label: "continuing spiritual gifts", pattern: /\bNothing\b[^.]{0,120}\brestricts?\b[^.]{0,100}\bapostolic generation\b|\bGifts continue\b/iu }
]);
requirePatterns("Romans 13:1", [
  { label: "limited civil authority", pattern: /\bCivil authority\b[^.]{0,100}\blimited\b|\bnever absolute\b/iu },
  { label: "obedience to God over the state", pattern: /\bobey God\b/iu }
]);
requirePatterns("Romans 13:8", [
  { label: "love does not replace the commandments", pattern: /\blove\b[^.]{0,100}\bnot\b[^.]{0,80}\breplaces?\b[^.]{0,80}\b(?:law|commandments)\b|\bnot be read as though love replaces the commandments\b/iu }
]);
requirePatterns("Romans 14:5", [
  { label: "weekly Sabbath not named", pattern: /\bweekly Sabbath is not named\b|\bSabbath is not named\b/iu },
  { label: "disputed days rather than the fourth commandment", pattern: /\b(?:doubtful matters|disputed observances)\b[^.]{0,180}\b(?:fourth commandment|weekly Sabbath)\b|\b(?:fourth commandment|weekly Sabbath)\b[^.]{0,180}\b(?:doubtful matters|disputed observances)\b/iu }
]);
requirePatterns("Romans 14:14", [
  { label: "koinos and akathartos distinction", pattern: /\bkoinos\b[^.]{0,180}\bakathartos\b/iu },
  { label: "clean-and-unclean distinction retained", pattern: /\bclean-and-unclean distinction\b|\bclean\b[^.]{0,80}\bunclean\b/iu }
]);
requirePatterns("Romans 16:1", [
  { label: "Cenchrea port setting", pattern: /\bCenchrea\b[^.]{0,120}\bport\b|\bport\b[^.]{0,120}\bCenchrea\b/iu },
  { label: "ordination caution", pattern: /\b(?:not|neither)\b[^.]{0,180}\bsettle modern ordination debates\b/iu }
]);
requirePatterns("Romans 16:7", [
  { label: "Junia as a woman's name", pattern: /\bJunia\b[^.]{0,120}\bwoman['’]s name\b/iu },
  { label: "office or ordination caution", pattern: /\bwithout by itself settling\b[^.]{0,120}\b(?:office|ordination)\b/iu }
]);
requirePatterns("Romans 16:20", [
  { label: "no authorization of human violence", pattern: /\bneither human violence\b|\bauthorizes neither human violence\b|\bnot human violence\b/iu }
]);

assert(existsSync(auditPath), "Romans theological audit manifest is missing.");
if (existsSync(auditPath)) {
  const audit = readJson(auditPath);
  assert(audit.expectedNotes === 433, "Audit manifest has the wrong expected-note count.");
  assert(audit.reviewedNotes === 433, "Audit manifest does not record 433 reviewed notes.");
  assert(Array.isArray(audit.notes) && audit.notes.length === 433, "Audit manifest should contain 433 note records.");
  const auditByReference = new Map((audit.notes ?? []).map((entry) => [entry.reference, entry]));
  for (const [reference, verse] of verseRecords) {
    const entry = auditByReference.get(reference);
    const text = String(verse.commentary?.detailedExplanation ?? "").trim();
    assert(Boolean(entry), `${reference} is missing from the audit manifest.`);
    assert(entry?.reviewStatus === "verified-seed", `${reference} has the wrong audit status.`);
    assert(entry?.wordCount === wordCount(text), `${reference} has a stale audit word count.`);
    assert(entry?.sha256 === sha256(text), `${reference} has a stale audit hash.`);
  }
}

const curatedFiles = readdirSync(join(root, "scripts", "data"))
  .filter((file) => /^romans-\d+-curated\.json$/.test(file));
assert(curatedFiles.length === 16, `Expected 16 Romans curated files; found ${curatedFiles.length}.`);
let curatedTotal = 0;
for (const file of curatedFiles) {
  const curation = readJson(join(root, "scripts", "data", file));
  for (const entry of curation.verses ?? []) {
    curatedTotal += 1;
    const text = String(entry.essay ?? "");
    for (const { label, pattern } of prohibitedPublicPatterns) {
      assert(!pattern.test(text), `${file} ${entry.verse} contains prohibited ${label}.`);
    }
  }
}
assert(curatedTotal === 433, `Expected 433 curated Romans essays; found ${curatedTotal}.`);

if (errors.length) {
  console.error(`Romans theological validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Romans theological validation passed: 433 reviewed notes, private source controls, and all targeted safeguards are present.");
