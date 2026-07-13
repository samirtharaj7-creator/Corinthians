import { readFileSync } from "node:fs";
import { join } from "node:path";

const auditFields = [
  "exegesis",
  "historicalBackground",
  "technicalNotes",
  "theologicalInsight",
  "structuralNotes",
  "otherCommentaryInsights",
  "application"
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function verseNumber(ref) {
  const match = ref.match(/:(\d+)$/);
  if (!match) throw new Error(`Invalid verse reference: ${ref}`);
  return Number(match[1]);
}

function parseRange(range) {
  const match = range.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) throw new Error(`Invalid range: ${range}`);
  return {
    chapter: Number(match[1]),
    start: Number(match[2]),
    end: Number(match[3] ?? match[2])
  };
}

function sectionForVerse(outline, ref) {
  const number = verseNumber(ref);
  const found = outline.find((section) => {
    const range = parseRange(section.range);
    return number >= range.start && number <= range.end;
  });
  if (!found) throw new Error(`No Romans 1 outline section found for ${ref}`);
  return found;
}

function sourceRef(sourceId, locator, claimType, priority) {
  return { sourceId, locator, claimType, priority };
}

function addSource(refs, sourceIds, sourceId, locator, claimType, priority) {
  if (sourceIds.has(sourceId)) refs.push(sourceRef(sourceId, locator, claimType, priority));
}

function uniqueRefs(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    const key = `${ref.sourceId}|${ref.locator}|${ref.claimType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceRefsForVerse(verseData, section, sourceIds) {
  const ref = verseData.verse;
  const refs = [];
  addSource(refs, sourceIds, "kjv-gutenberg-30", ref, "primary-text", 1);
  addSource(refs, sourceIds, "hartland-pauline-epistles", verseData.locator, "adventist-controlling", 1);
  addSource(refs, sourceIds, "samuel-romans-1", "Romans 1", "adventist-controlling", 1);
  addSource(refs, sourceIds, "lecture-romans-background", "Historical background of Romans", "adventist-controlling", 1);
  addSource(refs, sourceIds, "gallimore-experiencing-romans", "Romans 1", "adventist-support", 2);
  addSource(refs, sourceIds, "waggoner-articles-romans", `Romans ${section.range}`, "adventist-support", 2);
  addSource(refs, sourceIds, "knight-exploring-romans", `Romans ${section.range}`, "adventist-support", 2);
  if (["Romans 1:16", "Romans 1:17"].includes(ref)) {
    addSource(refs, sourceIds, "romans-1-16-17-handout", "Romans 1:16-17", "focused-passage-support", 2);
  }
  addSource(refs, sourceIds, "davis-romans-everyday-man", "Romans 1", "adventist-support", 2);
  return uniqueRefs(refs);
}

function makeAudit(refs) {
  return Object.fromEntries(auditFields.map((field) => [field, refs]));
}

function firstParagraph(value) {
  return value.split("\n\n")[0].trim();
}

function sectionHistorical(section) {
  if (section.range === "1:1-7") {
    return "Paul opens with an unusually rich greeting because he is writing to believers he has not yet visited. His introduction gathers the themes that will govern the letter: Scripture, Christ, resurrection power, grace, obedience, and the nations.";
  }
  if (section.range === "1:8-15") {
    return "The Roman church lived in the capital of the empire and had already become known for faith. Paul writes as a missionary pastor seeking to strengthen a church that could share in wider gospel work.";
  }
  if (section.range === "1:16-17") {
    return "Romans 1:16-17 functions as the letter's thesis. Paul speaks of the gospel in the capital of worldly power and identifies God's saving power with righteousness revealed in Christ and received by faith.";
  }
  return "Romans 1:18-32 addresses the Gentile world while preparing for Paul's wider argument that all humanity needs grace. Creation, conscience, idolatry, desire, and judgment are brought together as one moral diagnosis.";
}

function structuralNote(section, ref) {
  if (section.range === "1:1-7") {
    return `${ref} belongs to the opening greeting, where Paul compresses the letter's main themes before the argument unfolds. The greeting already joins gospel promise, Christology, mission, and obedience of faith.`;
  }
  if (section.range === "1:8-15") {
    return `${ref} stands in Paul's thanksgiving and travel-prayer section. These verses bridge the greeting and the thesis by showing that Paul's doctrine is carried by pastoral longing and missionary obligation.`;
  }
  if (section.range === "1:16-17") {
    return `${ref} is part of the thesis statement of Romans. The rest of the letter explains why God's saving righteousness is needed, how it is given in Christ, and what life by faith becomes.`;
  }
  return `${ref} is part of Paul's first indictment, focused especially on the Gentile world. The section traces a downward sequence from rejected light to idolatry, disordered desire, social corruption, and accountable judgment.`;
}

function technicalNotes(entry, section) {
  const notes = entry.wordNotes
    .map((note) => `${note.term}: ${note.explanation}`)
    .join(" ");
  return `${notes} The wording should be read within Romans ${section.range}, where each phrase contributes to Paul's gospel diagnosis rather than standing as an isolated saying.`;
}

function otherInsights(entry) {
  return `${entry.theology} In this part of Romans 1, Paul keeps the gospel's balance: grace is God's initiative in Christ, faith is the receiving response, and obedience is the fruit of restored allegiance.`;
}

export function loadRomansOneCuration(root = process.cwd()) {
  return readJson(join(root, "scripts", "data", "romans-1-curated.json"));
}

export function applyRomansOneCuration(chapter, sourceIds, root = process.cwd()) {
  const curation = loadRomansOneCuration(root);
  const verseMap = new Map(curation.verses.map((entry) => [entry.verse, entry]));

  const verses = chapter.verses.map((verse) => {
    const entry = verseMap.get(verse.verse);
    if (!entry) throw new Error(`Missing curated Romans 1 entry for ${verse.verse}`);
    const section = sectionForVerse(curation.chapter.outline, verse.verse);
    const refs = sourceRefsForVerse(entry, section, sourceIds);
    const commentary = {
      detailedExplanation: entry.essay,
      exegesis: `${firstParagraph(entry.essay)} Read closely, the verse contributes to ${section.title.toLowerCase()} by showing how Paul's gospel centers on Christ, exposes human need, and calls for faith rather than self-trust.`,
      historicalBackground: sectionHistorical(section),
      technicalNotes: technicalNotes(entry, section),
      theologicalInsight: entry.theology,
      structuralNotes: structuralNote(section, verse.verse),
      otherCommentaryInsights: otherInsights(entry),
      application: entry.application,
      reviewFlags: []
    };

    return {
      ...verse,
      explanation: firstParagraph(entry.essay),
      historicalBackground: commentary.historicalBackground,
      literaryContext: structuralNote(section, verse.verse),
      theologicalInsight: entry.theology,
      structuralNotes: commentary.structuralNotes,
      relatedConnection: `Romans 1:16-17 remains the center of the chapter, so ${verse.verse} should be read in relation to God's saving power, God's revealed righteousness, and humanity's need for faith in Christ.`,
      crossReferences: entry.crossReferences,
      application: entry.application,
      sources: refs,
      commentary,
      wordNotes: entry.wordNotes,
      sourceAudit: makeAudit(refs),
      reviewStatus: "needs-source-review"
    };
  });

  const chapterSources = uniqueRefs(
    curation.verses.flatMap((entry) => sourceRefsForVerse(entry, sectionForVerse(curation.chapter.outline, entry.verse), sourceIds))
  );

  return {
    ...chapter,
    ...curation.chapter,
    verses,
    symbols: [],
    charts: [],
    images: [],
    crossReferences: curation.chapter.crossReferences,
    relatedConnections: [
      {
        sourceText: "Romans 1",
        relatedText: "Romans 1 introduces the gospel's power and then shows why humanity needs God's righteousness rather than self-trust, idolatry, or moral comparison.",
        sources: chapterSources
      }
    ],
    teachingNotes: {
      ...chapter.teachingNotes,
      openingQuestion: "Where does Romans 1 expose self-trust and call me back to Christ?",
      mainPoint: curation.chapter.summary,
      keyVerses: ["Romans 1:16", "Romans 1:17", "Romans 1:20"],
      importantTerms: curation.chapter.themes,
      discussionQuestions: [
        "How does Romans 1:16-17 define the gospel's power?",
        "Why does Paul connect idolatry with moral collapse?",
        "How can faith lead to obedience without becoming righteousness by works?"
      ],
      commonMisunderstandings: [
        "Reading faith as mere opinion rather than trusting surrender to Christ.",
        "Using grace to weaken obedience instead of receiving grace as Christ's power to save from sin.",
        "Reading Romans 1:18-32 with superiority rather than repentance."
      ],
      emphasis: "Keep Christ's righteousness, faith, obedience, creation, and judgment together.",
      closingAppeal: "Invite the reader to stop suppressing light and receive the gospel as God's power unto salvation."
    },
    evangelisticNotes: {
      ...chapter.evangelisticNotes,
      mainDoctrinalTheme: "The gospel as God's power unto salvation",
      keyBibleTexts: ["Romans 1:16-17", "Matthew 1:21", "Habakkuk 2:4", "Romans 3:21-31", "Revelation 14:6-7"],
      flow: [
        "Begin with Christ as the center of the promised gospel.",
        "Show salvation as pardon, deliverance, and final restoration.",
        "Expose the tragedy of rejected light and exchanged worship.",
        "Call for faith that receives Christ and yields obedience."
      ],
      simpleIllustrations: [
        "A message is powerful because it brings the hearer to the living Savior it announces.",
        "Creation is a window meant to lead the heart upward, not a mirror for self-worship."
      ],
      appealQuestion: "Will you receive Christ's righteousness by faith and let Him restore your worship and life?",
      cautions: [
        "Do not present Romans 1 as moral superiority over others.",
        "Do not separate gospel pardon from deliverance from sin's dominion.",
        "Do not weaken Paul's plain teaching about creation, worship, and judgment."
      ],
      sources: chapterSources
    },
    reflectionQuestions: curation.chapter.reflectionQuestions,
    sources: chapterSources
  };
}
