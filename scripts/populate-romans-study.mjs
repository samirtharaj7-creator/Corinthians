import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRomansOneCuration } from "./lib/romans-1-curation.mjs";

const root = process.cwd();
const contentRoot = join(root, "content");
const romansRoot = join(contentRoot, "romans");
const bibliographyPath = join(contentRoot, "resources", "bibliography.json");

const chapterCount = 16;
const expectedVerseCounts = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];
const sourceIds = new Set(JSON.parse(readFileSync(bibliographyPath, "utf8")).resources.map((resource) => resource.id));

const samuelByChapter = {
  1: "samuel-romans-1",
  2: "samuel-romans-2",
  3: "samuel-romans-3",
  4: "samuel-romans-4",
  5: "samuel-romans-5",
  6: "samuel-romans-6",
  7: "samuel-romans-7",
  8: "samuel-romans-8",
  9: "samuel-romans-9",
  12: "samuel-romans-12",
  13: "samuel-romans-13",
  14: "samuel-romans-14"
};

const lectureByChapter = {
  1: "lecture-romans-background",
  2: "lecture-romans-background",
  3: "lecture-romans-background",
  4: "lecture-romans-background",
  5: "lecture-romans-5-6",
  6: "lecture-romans-5-6",
  7: "lecture-romans-7-8",
  8: "lecture-romans-7-8",
  9: "lecture-romans-9-11",
  10: "lecture-romans-9-11",
  11: "lecture-romans-9-11",
  12: "lecture-romans-12-13",
  13: "lecture-romans-12-13",
  14: "lecture-romans-14-16",
  15: "lecture-romans-14-16",
  16: "lecture-romans-14-16"
};

const focusedSources = [
  { id: "romans-1-16-17-handout", chapters: [1], range: "Romans 1:16-17" },
  { id: "romans-5-3-5-handout", chapters: [5], range: "Romans 5:3-5" },
  { id: "romans-8-handout", chapters: [8], range: "Romans 8" },
  { id: "romans-10-6-13-righteousness-by-faith", chapters: [10], range: "Romans 10:6-13" },
  { id: "romans-12-1-handout", chapters: [12], range: "Romans 12:1" }
];

const chapterStudies = {
  1: {
    title: "The Gospel and the Human Need",
    summary: "God's gospel reveals why humanity needs grace.",
    historicalContext: "Paul writes to a mixed Jewish and Gentile church in the imperial capital. He has not founded this congregation, so he introduces both himself and his gospel before explaining his larger mission to Spain.",
    literaryContext: "The chapter moves from greeting to thesis to indictment. Romans 1:16-17 states the book's central theme, and Romans 1:18-32 begins the proof that all humanity needs the saving righteousness of God.",
    themes: ["The gospel", "Righteousness by faith", "Creation and accountability", "Human rebellion", "Mission to all nations"],
    crossReferences: ["Habakkuk 2:4", "Psalm 19:1-4", "John 3:16-17", "Acts 17:24-31", "Revelation 14:6-7"],
    outline: [
      section("1:1-7", "Called and Separated for the Gospel", "Paul roots his authority in God's call and in the gospel concerning Jesus Christ.", "calling and mission", "Romans begins with a gospel that is promised in Scripture and centered in the risen Son."),
      section("1:8-15", "Paul's Burden for Rome", "Paul thanks God for the Roman believers and longs to strengthen them while sharing mutual encouragement.", "pastoral mission", "True ministry joins gratitude, prayer, and a desire to bear fruit."),
      section("1:16-17", "The Gospel Reveals God's Righteousness", "The gospel is God's saving power for everyone who believes, revealing righteousness by faith.", "righteousness by faith", "Christ saves, faith receives, and obedience flows from grace."),
      section("1:18-32", "Humanity Suppresses Truth", "The Gentile world is accountable because creation and conscience witness to God, yet humanity exchanges truth for idolatry.", "human rebellion", "Sin is not merely ignorance; it is a worship disorder that only the gospel can heal.")
    ]
  },
  2: {
    title: "Impartial Judgment and the Heart",
    summary: "God judges impartially and seeks inward repentance.",
    historicalContext: "Jewish believers in Rome prized Scripture, circumcision, and covenant privilege. Paul honors those gifts but refuses to let religious identity replace repentance and faith.",
    literaryContext: "Romans 2 continues the universal indictment. Paul shows that neither moral comparison nor possession of the law can justify sinners before God.",
    themes: ["Impartial judgment", "Repentance", "Law and conscience", "True circumcision", "Inward religion"],
    crossReferences: ["Deuteronomy 10:16", "1 Samuel 16:7", "Matthew 7:1-5", "Acts 10:34-35", "James 2:10-13"],
    outline: [
      section("2:1-11", "God Judges Without Partiality", "The one who condemns others still stands under God's searching judgment.", "impartial judgment", "Works do not earn salvation, but they reveal whether grace has been received."),
      section("2:12-16", "Law, Conscience, and Accountability", "Gentiles and Jews are judged according to the light they have received.", "law and conscience", "God's judgment is fair because He weighs light, motive, and response."),
      section("2:17-24", "Religious Privilege Cannot Cover Sin", "Paul confronts those who boast in the law while dishonoring God by disobedience.", "religious hypocrisy", "Truth entrusted to God's people must become witness, not boasting."),
      section("2:25-29", "Circumcision of the Heart", "The true Jew is one inwardly, with praise from God rather than human applause.", "heart religion", "The Spirit writes covenant faithfulness within, making obedience the fruit of grace.")
    ]
  },
  3: {
    title: "All Under Sin, All Invited to Justification",
    summary: "God justifies sinners by faith in Christ.",
    historicalContext: "The debate over Jewish advantage and Gentile inclusion pressed hard on first-century churches. Paul insists that Israel's privileges are real, yet no privilege cancels the need for Christ.",
    literaryContext: "Romans 3 closes the indictment begun in 1:18 and opens the great exposition of justification by faith that continues through chapter 4.",
    themes: ["Human sinfulness", "God's faithfulness", "Justification by faith", "Christ's atonement", "Faith establishes the law"],
    crossReferences: ["Psalm 14:1-3", "Isaiah 53:5-6", "Habakkuk 2:4", "John 3:21-26", "Galatians 2:16"],
    outline: [
      section("3:1-8", "God Remains True", "Human unfaithfulness cannot make God's faithfulness void.", "God's faithfulness", "God's covenant reliability is the ground beneath the gospel."),
      section("3:9-20", "All the World Guilty Before God", "Scripture testifies that Jew and Gentile alike stand under sin.", "universal need", "The law silences boasting and drives sinners to Christ."),
      section("3:21-26", "Righteousness Through Faith in Christ", "God justifies freely through the redemption and atoning work of Jesus.", "justification", "Grace is not moral softness; it is God's righteous way of saving sinners through Christ."),
      section("3:27-31", "Faith Establishes the Law", "Boasting is excluded because justification is by faith, yet faith upholds God's law.", "faith and law", "Righteousness by faith keeps pardon and obedience together in Christ.")
    ]
  },
  4: {
    title: "Abraham, Faith, and the Promise of Grace",
    summary: "Abraham shows righteousness received by faith.",
    historicalContext: "Abraham was the great covenant ancestor for Jewish identity. Paul uses him to show that God's family is defined by promise and faith before ethnic boundary markers.",
    literaryContext: "Romans 4 illustrates Romans 3:21-31. Paul grounds justification by faith in Scripture itself, especially Genesis 15 and Psalm 32.",
    themes: ["Abraham", "Promise", "Faith", "Imputed righteousness", "Resurrection hope"],
    crossReferences: ["Genesis 15:6", "Genesis 17:1-14", "Psalm 32:1-2", "Galatians 3:6-9", "Hebrews 11:8-12"],
    outline: [
      section("4:1-8", "Righteousness Reckoned Apart From Works", "Abraham and David witness that God counts righteousness to the believer by grace.", "credited righteousness", "Forgiveness is a gift received by faith, not a wage earned by performance."),
      section("4:9-12", "Faith Before Circumcision", "Abraham was counted righteous before receiving the covenant sign.", "faith before ritual", "Sacraments and signs matter, but they point to faith rather than replacing it."),
      section("4:13-17", "Promise by Grace", "The promise comes through the righteousness of faith so it may be sure to all the seed.", "promise and grace", "Grace makes the inheritance secure because it rests on God's word."),
      section("4:18-25", "Faith in the God Who Raises the Dead", "Abraham trusted God's life-giving promise, and believers trust the God who raised Jesus.", "resurrection faith", "Saving faith looks away from human impossibility to God's creative power.")
    ]
  },
  5: {
    title: "Peace, Hope, and the Reign of Grace",
    summary: "Grace reigns through Christ with peace and hope.",
    historicalContext: "Roman believers lived under social pressure and imperial claims. Paul gives them a deeper security than status, law, or empire can provide: reconciliation with God through Christ.",
    literaryContext: "Romans 5 bridges justification and new life. It looks back to faith and forward to union with Christ and freedom from sin in chapter 6.",
    themes: ["Peace with God", "Hope in tribulation", "Reconciliation", "Adam and Christ", "Grace reigning"],
    crossReferences: ["Isaiah 53:5", "John 14:27", "2 Corinthians 5:18-21", "1 Corinthians 15:21-22", "Revelation 21:1-5"],
    outline: [
      section("5:1-5", "Justification Produces Hope", "Peace, access, and hope flow from being justified by faith.", "assurance and suffering", "Trials cannot cancel grace; the Spirit uses them to deepen hope."),
      section("5:6-11", "Christ Died for the Ungodly", "God's love is demonstrated in Christ's death for sinners and enemies.", "atoning love", "Assurance rests on what Christ has done, not on the strength of human feeling."),
      section("5:12-21", "Adam and Christ", "Adam's sin brought death, but Christ's obedience brings a greater reign of grace.", "two humanities", "Christ is not merely a repair; He begins a new creation under grace.")
    ]
  },
  6: {
    title: "Dead to Sin, Alive to God",
    summary: "Union with Christ means death to sin.",
    historicalContext: "In a world where slaves served masters, Paul uses the language of service to show that everyone belongs somewhere. Grace transfers believers from sin's tyranny to God's liberating rule.",
    literaryContext: "Romans 6 answers a possible objection to Romans 5:20. If grace abounds over sin, should believers continue in sin? Paul answers with union with Christ.",
    themes: ["Union with Christ", "Baptism", "Freedom from sin", "Obedience from the heart", "Gift of eternal life"],
    crossReferences: ["Matthew 28:19-20", "John 8:34-36", "2 Corinthians 5:17", "Galatians 2:20", "1 John 3:4-9"],
    outline: [
      section("6:1-11", "Buried and Raised With Christ", "Baptism points to death to sin and resurrection life with Christ.", "union with Christ", "Grace unites the believer to Christ so new obedience becomes possible."),
      section("6:12-14", "Sin Shall Not Have Dominion", "Believers must not let sin reign, because they live under grace.", "freedom under grace", "Grace is not permission to sin; it is power to live for God."),
      section("6:15-23", "Servants of Righteousness", "Everyone serves either sin leading to death or God leading to holiness and life.", "obedience and holiness", "Eternal life is God's gift, and the path of grace is the path of sanctification.")
    ]
  },
  7: {
    title: "The Law, Sin, and the Cry for Deliverance",
    summary: "The law exposes sin and our need for deliverance.",
    historicalContext: "Jewish and Gentile believers both needed clarity on the law. Paul distinguishes the law's goodness from sin's misuse of the commandment.",
    literaryContext: "Romans 7 follows the call to new obedience in chapter 6 and prepares for the Spirit-filled life of chapter 8.",
    themes: ["Law and sin", "Human inability", "Inner conflict", "Deliverance in Christ", "Serving in newness of Spirit"],
    crossReferences: ["Exodus 20:1-17", "Psalm 19:7-11", "Jeremiah 31:31-34", "John 15:5", "Galatians 5:16-18"],
    outline: [
      section("7:1-6", "Released to Serve in Newness of Spirit", "Believers are released from the law's condemning jurisdiction to belong to Christ.", "new covenant service", "The Spirit does not abolish God's will; He makes living service possible."),
      section("7:7-13", "The Law Exposes Sin", "The commandment is holy, but sin uses it to reveal human rebellion.", "law's diagnostic work", "The law points out sin so the sinner will seek Christ."),
      section("7:14-25", "The Struggle and the Deliverer", "Paul portrays the misery of willing the good without power to perform it.", "need for deliverance", "The cry for rescue is answered by Christ and unfolded in the Spirit's work in Romans 8.")
    ]
  },
  8: {
    title: "Life in the Spirit and Unbreakable Assurance",
    summary: "The Spirit gives life, adoption, and assurance.",
    historicalContext: "Believers in Rome faced weakness, suffering, and political uncertainty. Paul anchors them in the Spirit's present work and God's future restoration.",
    literaryContext: "Romans 8 crowns the argument of Romans 5-7. It shows the life that justification creates and the assurance that belongs to those united to Christ.",
    themes: ["No condemnation", "Spirit-filled life", "Adoption", "Creation's groaning", "Assurance in God's love"],
    crossReferences: ["Ezekiel 36:26-27", "John 14:16-18", "2 Corinthians 3:17-18", "Galatians 4:4-7", "Revelation 22:1-5"],
    outline: [
      section("8:1-11", "No Condemnation and Life by the Spirit", "The Spirit applies Christ's victory and frees believers from sin's condemning rule.", "Spirit and assurance", "The law's righteous requirement is fulfilled in those who walk by the Spirit."),
      section("8:12-17", "Children and Heirs", "The Spirit leads believers as adopted children who cry, Abba, Father.", "adoption", "Christian identity rests on God's fatherly acceptance in Christ."),
      section("8:18-25", "Suffering and Future Glory", "Present suffering is real, but creation waits for God's final restoration.", "hope", "Christian hope looks for bodily redemption and the renewal of creation."),
      section("8:26-30", "The Spirit's Help and God's Purpose", "The Spirit intercedes in weakness and God works toward the believer's final conformity to Christ.", "intercession and purpose", "God's plan is restoration into Christ's image, not fatalistic passivity."),
      section("8:31-39", "Nothing Can Separate Us", "God's love in Christ stands above accusation, danger, and death.", "assurance", "Assurance belongs to those who look to Christ's intercession and love.")
    ]
  },
  9: {
    title: "God's Mercy, Israel, and the Promise",
    summary: "God's mercy preserves His promise and remnant.",
    historicalContext: "The church's Gentile growth raised painful questions about Israel's place in God's plan. Paul answers with Scripture, grief, and confidence in God's mercy.",
    literaryContext: "Romans 9 begins a three-chapter unit on Israel, the Gentiles, and God's faithfulness to His promises.",
    themes: ["Israel", "Promise", "Election", "Mercy", "Remnant"],
    crossReferences: ["Genesis 18:18-19", "Exodus 33:19", "Hosea 2:23", "Isaiah 10:20-22", "1 Peter 2:6-10"],
    outline: [
      section("9:1-5", "Paul's Sorrow for Israel", "Paul grieves over his people and honors their covenant privileges.", "burden for the lost", "True doctrine deepens mission rather than hardening the heart."),
      section("9:6-13", "Children of the Promise", "God's promise works through His calling, not through descent alone.", "promise and calling", "Election serves God's saving purpose and cannot be reduced to human boasting."),
      section("9:14-29", "Mercy and the Remnant", "God is righteous in showing mercy and preserving a remnant according to promise.", "divine mercy", "God's sovereignty is revealed as patient mercy in the history of salvation."),
      section("9:30-33", "The Stumbling Stone", "Gentiles attain righteousness by faith while unbelief stumbles over Christ.", "faith versus works", "Christ is the test of covenant identity.")
    ]
  },
  10: {
    title: "Righteousness by Faith and the Word Preached",
    summary: "Righteousness by faith comes through the preached word.",
    historicalContext: "Paul speaks as a Jewish apostle who knows religious zeal from the inside. He does not mock zeal, but he insists that zeal must submit to God's righteousness in Christ.",
    literaryContext: "Romans 10 answers how Israel has responded to the gospel. It highlights the nearness and simplicity of faith while stressing the necessity of proclamation.",
    themes: ["Righteousness by faith", "Christ and the law", "Confession", "Preaching", "Hearing the word"],
    crossReferences: ["Deuteronomy 30:11-14", "Isaiah 52:7", "Joel 2:32", "Acts 4:12", "Revelation 14:6-12"],
    outline: [
      section("10:1-4", "Zeal Must Submit to Christ", "Israel's zeal is real but misdirected when it seeks righteousness apart from Christ.", "Christ the goal of the law", "The law points to Christ, and Christ produces the obedience the law describes."),
      section("10:5-13", "The Nearness of Faith", "The righteousness of faith receives the word near at hand and calls on the Lord.", "saving faith", "Faith is not a heroic ascent; it receives the Christ already given."),
      section("10:14-17", "Faith Comes by Hearing", "People call on Christ as the gospel is sent, preached, heard, and believed.", "mission and proclamation", "The everlasting gospel must be proclaimed clearly so faith can awaken."),
      section("10:18-21", "Israel Has Heard Yet Resisted", "Scripture shows that the message has gone out, while God continues to stretch out His hands.", "patient appeal", "God's persistence exposes unbelief and displays mercy.")
    ]
  },
  11: {
    title: "The Remnant, the Olive Tree, and Mercy",
    summary: "God's mercy humbles Israel and the nations.",
    historicalContext: "Gentile believers could be tempted to despise unbelieving Jews. Paul warns them against arrogance and reminds them that they stand by faith.",
    literaryContext: "Romans 11 completes the Israel section with warning, hope, and doxology.",
    themes: ["Remnant", "Grace", "Olive tree", "Gentile humility", "Mercy"],
    crossReferences: ["1 Kings 19:18", "Isaiah 59:20-21", "Jeremiah 11:16", "John 15:1-8", "Ephesians 2:11-22"],
    outline: [
      section("11:1-10", "A Remnant According to Grace", "God preserves a faithful remnant just as He did in Elijah's day.", "remnant grace", "The remnant exists by grace, not superiority."),
      section("11:11-24", "The Olive Tree Warning", "Gentiles are grafted in by faith and must not boast over the branches.", "humility and perseverance", "God's people stand only by continuing trust in Christ."),
      section("11:25-32", "Mercy for Jews and Gentiles", "God's dealings with Israel and the nations reveal a purpose of mercy.", "mercy to all", "History moves under God's missionary mercy, not ethnic pride."),
      section("11:33-36", "Doxology", "Paul ends the mystery with worship before God's wisdom and ways.", "worship", "The right response to hard doctrine is reverence.")
    ],
    symbols: [
      symbol("Olive tree", ["Romans 11:17-24"], ["Jeremiah 11:16", "John 15:1-8"], "The olive tree pictures God's covenant people. Branches stand by faith, not by ethnic pride, and Gentiles are grafted into the one people of God.")
    ]
  },
  12: {
    title: "Living Sacrifice and Transformed Community",
    summary: "Mercy becomes worship, service, and love.",
    historicalContext: "Roman society prized status and honor. Paul forms a different kind of community where mercy creates humility, service, and enemy-love.",
    literaryContext: "Romans 12 begins the practical section. The imperatives rest on the mercies explained in Romans 1-11.",
    themes: ["Living sacrifice", "Renewed mind", "Spiritual gifts", "Sincere love", "Overcoming evil with good"],
    crossReferences: ["1 Samuel 15:22", "Matthew 5:43-48", "1 Corinthians 12:4-27", "2 Corinthians 3:18", "1 Peter 2:5"],
    outline: [
      section("12:1-2", "A Living Sacrifice", "Mercy calls for whole-life worship and a renewed mind.", "consecration", "The gospel claims the body, habits, thoughts, and daily choices."),
      section("12:3-8", "Grace-Gifts in One Body", "Believers serve humbly according to gifts given by grace.", "body life", "No gift is for self-exaltation; each gift builds up the body."),
      section("12:9-21", "Love Without Hypocrisy", "Paul sketches practical love, hospitality, humility, peace, and non-retaliation.", "Christian love", "Grace becomes visible in patient, courageous, enemy-loving conduct.")
    ],
    symbols: [
      symbol("Living sacrifice", ["Romans 12:1"], ["Psalm 51:17", "1 Peter 2:5"], "The image turns temple language toward daily discipleship. Believers offer themselves to God because Christ has first given Himself for them."),
      symbol("Body", ["Romans 12:4-8"], ["1 Corinthians 12:12-27"], "The body pictures interdependence in the church. Different gifts serve one Lord and one mission.")
    ]
  },
  13: {
    title: "Public Faithfulness, Love, and Wakefulness",
    summary: "Love fulfills duty in public life.",
    historicalContext: "Christians in Rome lived under imperial power. Paul teaches public order without making the state ultimate, since believers still belong first to Christ.",
    literaryContext: "Romans 13 continues the ethic of transformed life from chapter 12, applying love to civic responsibility and urgent holiness.",
    themes: ["Civil authority", "Love fulfills the law", "Wakefulness", "Putting on Christ", "Public witness"],
    crossReferences: ["Daniel 3:16-18", "Acts 5:29", "Matthew 22:15-22", "1 Timothy 2:1-2", "1 Peter 2:13-17"],
    outline: [
      section("13:1-7", "Responsible Life Under Authority", "Civil authority is treated as a servant of public order, and believers are called to honest civic conduct.", "public order", "Submission is real but not absolute when human commands oppose God."),
      section("13:8-10", "Love Fulfills the Law", "Love does no harm to a neighbor and fulfills the moral intent of God's commandments.", "law and love", "Love is not a replacement for God's law; it is the law's living expression."),
      section("13:11-14", "Awake and Put on Christ", "Believers live in the dawn of Christ's return and reject the works of darkness.", "eschatological holiness", "Advent hope calls for present holiness and watchfulness.")
    ]
  },
  14: {
    title: "Liberty, Conscience, and Love",
    summary: "Christian liberty must serve love and conscience.",
    historicalContext: "Jewish and Gentile believers carried different scruples about food, calendars, and association. Paul protects conscience while placing love above self-assertion.",
    literaryContext: "Romans 14 applies the gospel to church fellowship. It continues the love ethic of chapters 12-13 in a conflicted congregation.",
    themes: ["Weak and strong", "Conscience", "Christian liberty", "Judgment seat", "Peace"],
    crossReferences: ["1 Corinthians 8:1-13", "1 Corinthians 10:23-33", "Colossians 2:16-17", "James 4:11-12", "Revelation 14:12"],
    outline: [
      section("14:1-12", "Receive One Another Before God", "Believers must not despise or condemn one another over disputable scruples.", "accountability to God", "Christ is Lord of the conscience, so fellowship requires humility."),
      section("14:13-23", "Use Liberty in Love", "Freedom must not destroy a brother or sister for whom Christ died.", "liberty governed by love", "True liberty serves another's faith rather than flaunting itself.")
    ]
  },
  15: {
    title: "Mutual Edification and Gospel Mission",
    summary: "Christ teaches the strong to bear the weak.",
    historicalContext: "The Roman church needed unity across cultural lines. Paul's travel plans also show that doctrine and mission belong together.",
    literaryContext: "Romans 15 concludes the practical exhortation and transitions into Paul's ministry report and prayer request.",
    themes: ["Bearing the weak", "Scripture and hope", "Gentile inclusion", "Mission", "Prayer partnership"],
    crossReferences: ["Psalm 69:9", "Isaiah 11:10", "Matthew 28:18-20", "Acts 13:46-48", "2 Timothy 3:16-17"],
    outline: [
      section("15:1-6", "Christlike Bearing of the Weak", "Believers please their neighbor for edification, following Christ's self-giving pattern.", "edification", "Strength is given for service, not domination."),
      section("15:7-13", "Christ Welcomes Jews and Gentiles", "Christ confirms God's promises and brings the nations into praise.", "welcoming grace", "The church displays God's faithfulness when it receives one another in Christ."),
      section("15:14-21", "Paul's Priestly Mission", "Paul describes his Gentile mission as an offering sanctified by the Spirit.", "mission", "Gospel ministry seeks obedient faith among all peoples."),
      section("15:22-33", "Travel Plans and Prayer", "Paul shares his plans for Jerusalem, Rome, and Spain while asking for prayer.", "mission partnership", "The mission of God advances through planning, sacrifice, and intercession.")
    ]
  },
  16: {
    title: "Gospel Partnership and Final Praise",
    summary: "Gospel partnership ends in praise to God.",
    historicalContext: "The many names in Romans 16 show a diverse house-church network with women and men serving in costly gospel partnership.",
    literaryContext: "The closing greetings are not an appendix. They show the embodied community produced by the doctrine of Romans.",
    themes: ["Gospel coworkers", "Church fellowship", "Discernment", "Obedience of faith", "Doxology"],
    crossReferences: ["Genesis 3:15", "Acts 18:1-3", "Philippians 4:2-3", "Jude 24-25", "Revelation 14:12"],
    outline: [
      section("16:1-16", "A Network of Gospel Workers", "Paul commends Phoebe and greets many believers who labored in Christ.", "partnership", "The gospel creates a serving family, not isolated spectators."),
      section("16:17-20", "Discernment Against Division", "Paul warns against divisive teaching and promises God's victory over Satan.", "discernment", "Grace-filled fellowship still requires doctrinal watchfulness."),
      section("16:21-24", "Companions Send Greetings", "Paul's coworkers add their greetings, showing the shared labor behind the letter.", "shared ministry", "The mission is carried by a community of servants."),
      section("16:25-27", "Doxology to the Wise God", "The letter ends in praise for the gospel now revealed to all nations.", "obedience of faith", "The final aim of doctrine is worship and obedient faith.")
    ]
  }
};

const profiles = [
  profile("gospel", /\bgospel\b|\bpreach|\bpreached|\bglad tidings\b/i, "gospel", "The gospel is God's announcement that Jesus Christ has acted to save sinners, create a new people, and restore them for faithful witness.", "In Romans, gospel language is public and covenantal. It announces what God has done before it asks what believers must do.", "Biblical proclamation keeps this gospel both saving and restoring: Christ forgives, Christ reigns, and Christ prepares a people for His return.", "Receive the gospel as good news before treating it as a task. Obedience becomes a grateful response to Christ's saving initiative.", ["Mark 1:14-15", "1 Corinthians 15:1-4", "Revelation 14:6-7"]),
  profile("righteousness", /righteous|justif|justification/i, "righteousness", "Righteousness is God's saving faithfulness revealed in Christ and received by faith, not a moral status sinners manufacture for themselves.", "Paul uses righteousness and justification to describe God's gracious verdict and covenant action in Christ.", "Romans presents Christ's righteousness as both credited to the believer and worked into the life by the Spirit.", "Rest your confidence in Christ's righteousness. Then let His grace train the habits, words, and loyalties of ordinary life.", ["Genesis 15:6", "Habakkuk 2:4", "Philippians 3:9"]),
  profile("faith", /\bfaith\b|\bbeliev|\btrust/i, "faith", "Faith is living trust in God's promise. It receives Christ instead of leaning on ancestry, achievement, ritual, or self-defense.", "Faith in Romans is not bare opinion. It is reliance on God's word that redirects allegiance and opens the life to grace.", "Righteousness by faith guards against both legalism and careless religion.", "Ask whether you are trusting Christ or managing appearances. Faith rests in Him and then follows where He leads.", ["Habakkuk 2:4", "John 3:16", "Galatians 2:20"]),
  profile("assurance", /\bno condemnation\b|\bseparate us\b|\bseparate .*love\b|\bcharge\b|\bintercession\b|\bmore than conquerors\b/i, "assurance", "Assurance is the confidence that Christ's saving work and present intercession are stronger than accusation, fear, and spiritual weakness.", "Paul grounds assurance in union with Christ, not in the believer's emotional steadiness or flawless performance.", "Assurance looks to Christ as Savior, High Priest, and coming King while still taking discipleship seriously.", "Answer accusation by looking to Christ. Confidence grows when the conscience rests in Him and the life keeps yielding to His Spirit.", ["John 5:24", "Hebrews 7:25", "1 John 2:1"]),
  profile("law", /\blaw\b|\bcommandment|\bcommandments|\bordained/i, "law", "The law reveals God's will and exposes sin, but it cannot create the righteousness that sinners lack.", "Paul distinguishes the law's holy purpose from sin's misuse of it. The problem is not God's commandment but the human heart under sin.", "The biblical reading honors God's moral law while insisting that only Christ can justify and only the Spirit can write obedience on the heart.", "Let the law drive you to Christ rather than into pride or despair. In Christ, obedience becomes fruit rather than currency.", ["Psalm 19:7", "Jeremiah 31:33", "Romans 3:31"]),
  profile("sin", /\bsin\b|\bsins\b|\bsinned\b|\biniquity\b|\boffence\b|\btransgression\b/i, "sin", "Sin is more than isolated failure. It is rebellion, mistrust, and disordered worship that leaves humanity unable to heal itself.", "Paul treats sin as both guilt and enslaving power. The gospel answers both the record of sin and the rule of sin.", "The larger biblical conflict between good and evil shows sin as rebellion against God's character, law, and government.", "Do not minimize sin, but do not make it stronger than Christ. Confession opens the life to cleansing and restoration.", ["Psalm 51:4", "John 1:29", "1 John 3:4"]),
  profile("judgment", /\bjudg|\bwrath\b|\bcondemn|\bvengeance\b|\btribulation and anguish\b/i, "judgment", "God's judgment is impartial and truthful. It exposes hidden motives and shows that moral comparison cannot save.", "Judgment language in Romans is not arbitrary anger. It is God's settled opposition to evil and His commitment to set things right.", "Faith takes judgment seriously while grounding assurance in Christ's intercession and righteousness.", "Live transparently before God. The Judge who exposes sin is also the Savior who offers mercy in Christ.", ["Ecclesiastes 12:14", "John 5:24", "Revelation 14:7"]),
  profile("grace", /\bgrace\b|\bgift\b|\bfree gift\b|\bfreely\b/i, "grace", "Grace is God's undeserved favor and active power, given in Christ to pardon sinners and form a new life.", "Paul never sets grace against holiness. He sets grace against earning, boasting, and slavery to sin.", "In righteousness by faith, grace is both forgiving and transforming because Christ saves the whole person.", "Stop bargaining with God. Receive grace as gift, and let gratitude make obedience joyful and honest.", ["Ephesians 2:8-10", "Titus 2:11-14", "Romans 6:14"]),
  profile("peace", /\bpeace\b|\breconciled\b|\breconciliation\b/i, "peace", "Peace with God is the settled relationship Christ creates for those justified by faith.", "Peace in Romans is not mere calmness. It is covenant reconciliation after enmity has been overcome by Christ.", "Assurance rests on Christ's completed work, not on fluctuating emotion or spiritual performance.", "When conscience is troubled, look first to Christ's reconciling work and then walk in the peace He gives.", ["Isaiah 53:5", "John 14:27", "2 Corinthians 5:18-19"]),
  profile("hope", /\bhope\b|\bglory\b|\bpatience\b|\bexperience\b|\btribulation\b|\bsuffer/i, "hope", "Hope is confidence in God's promised future, strong enough to endure suffering without denying its pain.", "Paul places suffering inside the larger story of God's restoring purpose. Trials do not justify us, but God can use them to form endurance.", "Christian hope looks for Christ's return, bodily redemption, and the renewal of creation.", "Let suffering make you prayerful rather than cynical. Hope looks beyond the present pressure to God's finished restoration.", ["Psalm 42:11", "2 Corinthians 4:17", "Revelation 21:4"]),
  profile("death", /\bdeath\b|\bdied\b|\bdead\b|\bdie\b|\bgrave\b/i, "death", "Death is the wages of sin and the enemy Christ enters in order to bring believers into resurrection life.", "Paul uses death both literally and spiritually: Adam brings death, Christ dies for sinners, and believers die to sin in union with Him.", "The biblical view of death treats it as an enemy, not a secret doorway to glory, and places hope in resurrection.", "Bring both fear and grief to Christ. He has met death at its root and promises resurrection life.", ["Genesis 2:17", "1 Corinthians 15:21-26", "Revelation 20:14"]),
  profile("resurrection", /\braised\b|\bresurrection\b|\brisen\b|\bquickened\b|\bliveth\b/i, "resurrection", "Resurrection is God's decisive answer to sin and death, confirming Jesus as Lord and opening new life for believers.", "Paul grounds Christian life in the historical raising of Jesus, not in moral inspiration alone.", "The same power that raised Christ is the ground of justification, sanctification, and final bodily hope.", "Practice resurrection faith by trusting God's power where your strength is exhausted.", ["John 11:25", "1 Corinthians 15:17-20", "1 Peter 1:3"]),
  profile("creation", /\bcreat(?:ed|ion|ure|or)\b|\binvisible things\b|\bknown of God\b|\bmanifest in them\b/i, "creation witness", "Creation is God's first witness, showing enough of His power and Godhead to make human indifference morally serious.", "Paul treats creation as testimony, not as a substitute for the gospel. The created world leaves humanity without an excuse, but only Christ saves the sinner who has misread the witness.", "The Creator still speaks through what He has made, calling worship away from idols and back to Himself.", "Let creation awaken reverence rather than self-sufficiency. The world is not ultimate; it points beyond itself to the God who made and sustains it.", ["Psalm 19:1-4", "Acts 14:15-17", "Revelation 14:7"]),
  profile("spirit", /\bSpirit\b|\bspirit\b|\bAbba\b/i, "Spirit", "The Spirit applies Christ's victory by giving life, assurance, adoption, and power for obedience.", "Romans contrasts life in the Spirit with life under the flesh. The contrast is about governing power and allegiance.", "Scripture shows the Spirit writing God's law on the heart and forming Christlike character before Christ's return.", "Ask daily for the Spirit's leading. Christian obedience is impossible as self-improvement but possible as yielded life.", ["Ezekiel 36:26-27", "John 14:16-17", "Galatians 5:22-25"]),
  profile("flesh", /\bflesh\b|\bcarnal\b|\bmembers\b|\bbody of sin\b/i, "flesh", "The flesh names fallen human life organized apart from God, unable to produce the righteousness God requires.", "For Paul, flesh is not the body as evil matter. It is humanity under sin's control, even when it looks religious.", "The gospel does not despise the body; it reclaims the body as an instrument of righteousness and worship.", "Do not trust unaided willpower. Present the whole self to God and walk by the Spirit.", ["John 3:6", "Galatians 5:16-17", "Romans 12:1"]),
  profile("israel", /\bIsrael\b|\bJew\b|\bJews\b|\bGentile|\bGreek\b|\bcircumcision\b|\buncircumcision\b/i, "Jew and Gentile", "Paul insists that covenant privilege matters, but it cannot replace faith, repentance, and union with Christ.", "The Jew-Gentile argument in Romans protects both God's faithfulness to Israel and the full inclusion of the nations.", "Remnant and mission themes should produce humility, not superiority, because all stand by grace.", "Honor the light God has given you, but never boast in it. Privilege is a call to witness and service.", ["Genesis 12:3", "Acts 10:34-35", "Ephesians 2:11-22"]),
  profile("works", /\bworks\b|\bdeeds\b|\bboast|\bwages\b|\breward\b/i, "works", "Works cannot earn justification, yet they reveal the direction of the heart and the reality of faith.", "Paul opposes works as a basis of boasting, not Spirit-formed obedience as the fruit of grace.", "Romans protects a balanced message: we are saved by grace through faith, and genuine faith does not remain barren.", "Serve faithfully without turning service into a claim on God. The believer works from acceptance, not for acceptance.", ["Ephesians 2:8-10", "James 2:17-18", "Titus 3:5-8"]),
  profile("abraham", /\bAbraham\b|\bDavid\b|\bSarah\b/i, "Abraham and David", "Paul uses Israel's own Scriptures to show that God's people have always lived by promise, faith, and forgiveness.", "Abraham's faith before circumcision proves that grace is prior to covenant signs and wider than ethnic boundaries.", "Scripture lets Paul interpret covenant identity from the Bible rather than from later pride or custom.", "Read biblical examples as invitations to trust God now. The same God still calls life out of impossibility.", ["Genesis 15:6", "Psalm 32:1-2", "Galatians 3:6-9"]),
  profile("adam", /\bAdam\b|\bone man\b|\bmany were made\b/i, "Adam and Christ", "Adam represents the old humanity marked by sin and death; Christ represents the new humanity marked by grace and life.", "Paul's contrast is representative and historical. The ruin is real, but the gift in Christ is greater than the trespass.", "Scripture presents Christ as the true Head of restored humanity and the center of God's victory over evil.", "Do not define yourself only by inherited brokenness. In Christ, grace has opened a new belonging.", ["Genesis 3:17-19", "1 Corinthians 15:21-22", "2 Corinthians 5:17"]),
  profile("baptism", /\bbaptiz|\bburied with him\b/i, "baptism", "Baptism marks union with Christ in His death and resurrection, picturing a decisive break with sin's old dominion.", "The imagery assumes immersion into Christ's story: buried with Him and raised to walk in newness of life.", "Baptism joins public confession, repentance, and entrance into a life of discipleship.", "Remember your baptism as a pledge of belonging. Sin is no longer your rightful master.", ["Matthew 28:19-20", "Colossians 2:12", "1 Peter 3:21"]),
  profile("service", /\bservant|\bserve|\bservants|\bslaves|\bobedience\b|\bobey\b/i, "obedient service", "Paul treats obedience as the fruit of belonging to God, not as a ladder by which sinners climb into acceptance.", "Service language asks who rules the life. The gospel transfers believers from sin's mastery to God's gracious lordship.", "Grace expects practical obedience because Christ restores allegiance to God.", "Name the master you are serving in ordinary decisions. Grace makes joyful obedience possible.", ["Joshua 24:15", "John 14:15", "Romans 6:17"]),
  profile("worship", /\bliving sacrifice\b|\bpresent your bodies\b|\breasonable service\b|\brenewing of your mind\b|\btransformed\b|\bconformed\b/i, "whole-life worship", "Whole-life worship is the response of a person who has received mercy and now offers body, mind, habits, and service back to God.", "Romans 12 turns temple language toward daily discipleship. The body is not discarded; it is presented to God as the arena of faithful worship.", "Consecration joins justification by faith with practical holiness, healthful stewardship, renewed thinking, and mission.", "Offer God the ordinary places where discipleship is tested: appetite, speech, work, relationships, media, money, and time.", ["1 Corinthians 6:19-20", "2 Corinthians 3:18", "1 Peter 2:5"]),
  profile("love", /\blove\b|\bcharity\b|\bkindly affectioned\b|\bmercy\b|\bcompassion\b/i, "love and mercy", "Love is God's character made visible in Christ and reproduced in His people by grace.", "Paul does not reduce love to sentiment. Love acts for the neighbor's good, refuses retaliation, and fulfills the moral intent of the law.", "The last-day people of God must hold commandments and Christlike love together, since loveless orthodoxy misrepresents God.", "Choose the neighbor's good over self-display. Love is the most practical evidence that mercy has taken root.", ["Leviticus 19:18", "John 13:34-35", "1 John 4:7-12"]),
  profile("government", /\bpowers\b|\brulers\b|\btribute\b|\bcustom\b|\bmagistrate\b/i, "civil authority", "Civil authority is recognized as a servant of public order, but it is never treated as ultimate over God.", "Romans 13 calls for responsible public conduct in ordinary circumstances while the rest of Scripture limits obedience when rulers command sin.", "Biblical prophecy teaches respect for lawful order while preserving conscience before God.", "Be a peaceable and honest citizen, yet keep worship and conscience surrendered to God above every human power.", ["Daniel 3:16-18", "Acts 5:29", "1 Peter 2:13-17"]),
  profile("liberty", /\bweak\b|\bmeat\b|\beateth\b|\bdrink\b|\besteemeth\b|\bstumble\b|\boffend\b|\bconscience\b/i, "liberty and conscience", "Christian liberty is real, but it is governed by love for the conscience and faith of another believer.", "Paul distinguishes disputable matters from the core gospel. Freedom must not become contempt or spiritual harm.", "Christian ethics should be principled and tender, guarding conscience without turning personal scruples into a test of salvation.", "Use freedom to build others up. The question is not only what you may do, but whether love is strengthened.", ["1 Corinthians 8:9-13", "1 Corinthians 10:31-33", "James 4:11-12"]),
  profile("mission", /\bapostle\b|\bcalled\b|\bsent\b|\bminister\b|\bministry\b|\bSpain\b|\bJerusalem\b|\bRome\b/i, "mission", "Mission flows from the gospel because Christ claims all nations for the obedience of faith.", "Paul's travel plans and apostolic calling show that theology aims at proclamation, discipleship, and worship among the nations.", "The church's mission stands in this stream as a worldwide witness to Christ, His gospel, and His coming kingdom.", "Let doctrine deepen your burden for people. Truth is entrusted so it can be shared with humility and courage.", ["Matthew 28:18-20", "Acts 1:8", "Revelation 14:6"]),
  profile("prayer", /\bpray|\bprayer|\brequest|\bintercession|\bmaketh intercession\b/i, "prayer", "Prayer is dependent participation in God's work, bringing weakness, mission, and fellowship before Him.", "Paul's prayers are theological. He asks God to accomplish what human planning cannot guarantee.", "The Spirit's intercession and the church's prayers belong together in God's mission.", "Bring both burden and plan to God. Prayer does not replace obedience; it keeps obedience dependent.", ["Luke 18:1", "Ephesians 6:18", "Hebrews 7:25"]),
  profile("mystery", /\bmystery\b|\brevelation\b|\bscriptures of the prophets\b/i, "revealed mystery", "The mystery is God's once-hidden plan now revealed in Christ and made known to all nations through the gospel.", "Paul ends Romans by showing that the gospel is both ancient in promise and newly disclosed in Christ.", "The prophetic Scriptures and the apostolic gospel belong together as one witness to Christ.", "Let fulfilled revelation move you to worship and witness. God has made His saving purpose known.", ["Daniel 2:28", "Ephesians 3:4-6", "Revelation 10:7"])
];

const defaultProfile = profile("default", /.*/i, "the passage", "Paul is carrying the argument forward one step at a time, showing how God's saving righteousness answers the human need and forms a faithful people.", "The verse should be read in its immediate paragraph, not as an isolated slogan. Its force comes from Paul's unfolding logic.", "Romans keeps Christ at the center while showing how grace restores faith, obedience, worship, and mission.", "Read the verse as an invitation to trust God more deeply and to let the gospel reshape the next concrete choice.", ["Romans 1:16-17", "Romans 3:21-26"]);

function section(range, title, summary, focus, adventistAngle) {
  return {
    range,
    title,
    summary,
    focus,
    adventistAngle,
    crossReferences: []
  };
}

function symbol(symbolName, references, scriptureReferences, meaning) {
  return {
    symbol: symbolName,
    references,
    scriptureReferences,
    meaning,
    sources: []
  };
}

function profile(key, pattern, term, explanation, exegesis, theology, application, refs) {
  return { key, pattern, term, explanation, exegesis, theology, application, refs };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function readChapter(chapterNumber) {
  return JSON.parse(readFileSync(join(romansRoot, `chapter-${pad(chapterNumber)}.json`), "utf8"));
}

function writeChapter(chapter) {
  writeFileSync(join(romansRoot, `chapter-${pad(chapter.chapterNumber)}.json`), `${JSON.stringify(chapter, null, 2)}\n`);
}

function parseRange(range) {
  const match = range.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) throw new Error(`Bad section range: ${range}`);
  return {
    chapter: Number(match[1]),
    start: Number(match[2]),
    end: Number(match[3] ?? match[2])
  };
}

function verseNumber(ref) {
  const match = ref.match(/:(\d+)$/);
  if (!match) throw new Error(`Bad verse reference: ${ref}`);
  return Number(match[1]);
}

function sectionForVerse(chapterStudy, verseNum) {
  const found = chapterStudy.outline.find((candidate) => {
    const parsed = parseRange(candidate.range);
    return verseNum >= parsed.start && verseNum <= parsed.end;
  });
  return found ?? chapterStudy.outline[0];
}

function matchingProfiles(text) {
  const matches = profiles.filter((candidate) => candidate.pattern.test(text));
  return matches.length
    ? matches
      .sort((left, right) => profileScore(left, text) - profileScore(right, text))
      .slice(0, 3)
    : [defaultProfile];
}

function profileScore(candidate, text) {
  const base = profiles.indexOf(candidate) * 10;
  let boost = 0;
  if (candidate.key === "assurance" && /\bno condemnation\b|\bseparate us\b|\bseparate .*love\b|\bcharge\b|\bintercession\b/i.test(text)) boost -= 90;
  if (candidate.key === "worship" && /\bliving sacrifice\b|\bpresent your bodies\b|\breasonable service\b|\brenewing of your mind\b|\btransformed\b|\bconformed\b/i.test(text)) boost -= 120;
  if (candidate.key === "spirit" && /\bSpirit\b/.test(text)) boost -= 170;
  if (candidate.key === "righteousness" && /righteous|justif/i.test(text)) boost -= 55;
  if (candidate.key === "faith" && /\bfaith\b|\bbeliev/i.test(text)) boost -= 50;
  if (candidate.key === "gospel" && /\bgospel\b/i.test(text)) boost -= 45;
  if (candidate.key === "law" && /\blaw\b|\bcommandment/i.test(text)) boost -= 35;
  if (candidate.key === "sin" && /\bsin\b|\bsins\b|\bsinned\b/i.test(text)) boost -= 30;
  return base + boost;
}

function sourceRef(sourceId, locator, claimType, priority) {
  return { sourceId, locator, claimType, priority };
}

function existingSourceRef(sourceId, locator, claimType, priority) {
  if (!sourceIds.has(sourceId)) return null;
  return sourceRef(sourceId, locator, claimType, priority);
}

function uniqueRefs(refs) {
  const seen = new Set();
  return refs.filter(Boolean).filter((ref) => {
    const key = `${ref.sourceId}|${ref.locator}|${ref.claimType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceRefsFor(chapterNumber, sectionRange, verseRef) {
  const refs = [
    existingSourceRef("kjv-gutenberg-30", verseRef, "primary-text", 1),
    existingSourceRef(samuelByChapter[chapterNumber], `Romans ${chapterNumber}`, "adventist-controlling", 1),
    existingSourceRef(lectureByChapter[chapterNumber], `Romans ${chapterNumber}`, "adventist-controlling", 1),
    existingSourceRef("waggoner-articles-romans", `Romans ${sectionRange}`, "adventist-support", 2),
    existingSourceRef("knight-exploring-romans", `Romans ${chapterNumber}`, "adventist-support", 2),
    existingSourceRef("gallimore-experiencing-romans", `Romans ${chapterNumber}`, "adventist-support", 2),
    existingSourceRef("davis-romans-everyday-man", `Romans ${chapterNumber}`, "adventist-support", 2),
    existingSourceRef(chapterNumber <= 8 ? "keller-romans-1-7" : "keller-romans-8-16", `Romans ${chapterNumber}`, "conservative-comparison", 3),
    existingSourceRef("moo-encountering-romans", `Romans ${chapterNumber}`, "conservative-support", 3),
    existingSourceRef("stott-message-romans", `Romans ${chapterNumber}`, "conservative-support", 3),
    existingSourceRef("bruce-letter-romans", `Romans ${chapterNumber}`, "historical-support", 3)
  ];

  for (const focused of focusedSources) {
    if (focused.chapters.includes(chapterNumber)) {
      refs.push(existingSourceRef(focused.id, focused.range, "focused-passage-support", 2));
    }
  }

  return uniqueRefs(refs).slice(0, 8);
}

function makeAudit(refs) {
  const primary = refs.slice(0, 5);
  const support = refs.slice(0, 7);
  return {
    exegesis: support,
    historicalBackground: support,
    technicalNotes: support,
    theologicalInsight: support,
    structuralNotes: primary,
    otherCommentaryInsights: support,
    application: support
  };
}

function cleanSentence(value) {
  return value.replace(/\s+/g, " ").trim();
}

function excerpt(text) {
  const cleaned = cleanSentence(text);
  const words = cleaned.split(" ").slice(0, 14).join(" ");
  return words.length < cleaned.length ? `${words}...` : words;
}

function sectionLabel(section) {
  return `${section.range}, ${section.title}`;
}

function shortRef(ref) {
  return ref.replace(/^Romans\s+/, "");
}

function publicizeTheology(value) {
  return value
    .replace(/A conservative Adventist reading sees/g, "Romans presents")
    .replace(/In a conservative Adventist reading,/g, "Read in the flow of Romans,")
    .replace(/conservative Adventist reading/g, "biblical reading")
    .replace(/Adventist proclamation keeps/g, "Biblical proclamation keeps")
    .replace(/Adventist proclamation begins here:/g, "The gospel begins here:")
    .replace(/Conservative Adventist faith expects/g, "Grace expects")
    .replace(/Adventist interpretation honors/g, "The biblical reading honors")
    .replace(/The Adventist great controversy lens recognizes/g, "The larger biblical conflict between good and evil shows")
    .replace(/Adventist faith takes/g, "Faith takes")
    .replace(/In Adventist righteousness by faith,/g, "In righteousness by faith,")
    .replace(/Adventist hope looks/g, "Christian hope looks")
    .replace(/Adventist anthropology treats/g, "The biblical view of death treats")
    .replace(/Adventist theology sees/g, "Scripture shows")
    .replace(/The Adventist stress on Scripture lets/g, "Scripture lets")
    .replace(/Adventist baptismal theology joins/g, "Baptism joins")
    .replace(/Adventist consecration joins/g, "Consecration joins")
    .replace(/Adventist history and prophecy teach/g, "Biblical prophecy teaches")
    .replace(/Adventist ethics should/g, "Christian ethics should")
    .replace(/Adventist mission stands/g, "The church's mission stands")
    .replace(/Adventist readings of remnant and mission should/g, "Remnant and mission themes should")
    .replace(/Adventist righteousness by faith keeps/g, "Righteousness by faith keeps")
    .replace(/within the Adventist balance of/g, "within the biblical balance of")
    .replace(/in Adventist proclamation/g, "as a witness to Christ")
    .replace(/Adventist preaching/g, "biblical preaching")
    .replace(/Adventist message/g, "biblical message")
    .replace(/Adventist faith/g, "faith")
    .replace(/Adventist theology/g, "Scripture")
    .replace(/Adventist mission/g, "the church's mission");
}

function verseOpening(ref, verseText, chapterStudy, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const openings = {
    gospel: `${ref} begins with good news before it asks anything of the reader. Paul is not offering Rome another philosophy, another moral improvement plan, or another badge of religious identity; he is announcing what God has done in Jesus Christ.`,
    righteousness: `${ref} brings us to one of Paul's deepest burdens: righteousness must come from God before it can appear in us. The human instinct is to measure, compare, and defend itself, but Romans keeps pressing the reader toward a righteousness received by faith.`,
    faith: `${ref} lets faith stand where human control would rather stand. Paul is teaching the church that God's promise is not grasped by ancestry, achievement, or religious confidence, but by trusting the God who speaks and saves.`,
    assurance: `${ref} sounds like a door opening after a long night of accusation. Paul has not forgotten sin, weakness, suffering, or judgment; he is showing that none of them is stronger than Christ for the one who is in Him.`,
    law: `${ref} places the law in the light of the gospel. Paul does not treat God's commandments as the enemy, but neither does he let the law carry a burden only Christ can bear.`,
    sin: `${ref} refuses to make sin small. Paul is not describing a surface problem that can be solved by education, status, or effort; he is naming a deeper disorder that only grace can reach.`,
    judgment: `${ref} brings the reader under the searching seriousness of God's judgment. Paul does not let moral comparison become a hiding place, because the God who judges sees truthfully and without flattery.`,
    grace: `${ref} lets grace have the first and final word. Paul is not describing divine leniency that leaves sin untouched, but God's active mercy in Christ, forgiving and restoring those who could not save themselves.`,
    peace: `${ref} speaks to the ache beneath human striving: the need to be reconciled to God. Peace here is not a passing mood; it is the settled gift Christ creates for those justified by faith.`,
    hope: `${ref} looks at suffering without letting suffering become the whole story. Paul gives the church a hope large enough to face pain honestly and still wait for God's promised restoration.`,
    death: `${ref} takes death seriously as the shadow cast by sin. Paul does not romanticize it or treat it as harmless; he sets it against the stronger work of Christ, who enters death to bring life.`,
    resurrection: `${ref} turns the reader toward the God who raises the dead. The gospel is not merely advice for better living; it rests on God's power to bring life where human possibility has ended.`,
    "creation witness": `${ref} brings the reader to creation's witness. Paul is not saying the Gentile world possessed saving light apart from Christ; he is saying that God's world has never been silent about its Maker.`,
    Spirit: `${ref} moves the argument from command to power. Paul is showing that the Christian life is not self-improvement under religious pressure, but life opened to the Spirit who applies Christ's victory.`,
    flesh: `${ref} exposes the poverty of life organized apart from God. The flesh is not simply the body; it is the old human way of trusting itself while remaining unable to produce what God requires.`,
    "Jew and Gentile": `${ref} sets privilege and outsider status under the same gospel. Paul honors the history of God's people, but he will not allow heritage or distance from heritage to replace faith in Christ.`,
    works: `${ref} quietly removes boasting from the room. Paul is not attacking obedience; he is attacking the old desire to turn obedience, identity, or effort into a claim on God.`,
    "Abraham and David": `${ref} sends the reader back into Israel's own story. Paul is showing that grace is not a late correction to Scripture, but the heartbeat of God's dealings with His people from the beginning.`,
    "Adam and Christ": `${ref} widens the view from individual failure to two humanities. Adam's story explains the ruin we inherit and repeat; Christ's story announces the greater grace that creates a new belonging.`,
    baptism: `${ref} treats baptism as a burial and a beginning. Paul is not describing a bare ceremony, but a visible confession that the believer's old master has lost its claim.`,
    "obedient service": `${ref} asks a simple but searching question: who now owns the life? Paul knows that freedom from sin is not aimlessness; grace transfers the believer into the glad service of God.`,
    "whole-life worship": `${ref} turns worship into a whole-life offering. Paul does not leave mercy in the realm of ideas; he brings it into the body, the mind, the habits, and the ordinary choices of the believer.`,
    "love and mercy": `${ref} lets love become the shape of doctrine. Paul will not allow truth to remain abstract when mercy has made brothers and sisters responsible for one another.`,
    "civil authority": `${ref} brings faith into public life. Paul neither worships the state nor treats public order as meaningless; he teaches believers to live responsibly while belonging first to Christ.`,
    "liberty and conscience": `${ref} brings Christian liberty under the discipline of love. Paul protects conscience and freedom, but he refuses to let either become an excuse for contempt.`,
    mission: `${ref} keeps doctrine moving outward. Paul never treats the gospel as private property; the truth that saves also sends, because Christ claims all nations for the obedience of faith.`,
    prayer: `${ref} reminds the reader that mission and weakness must both be carried to God. Paul plans, labors, and reasons, but he does not pretend that human effort can secure God's work.`,
    "revealed mystery": `${ref} ends the argument with wonder. The gospel was promised long before Paul preached it, yet now it stands unveiled in Christ for all nations to hear.`
  };

  return openings[primary.term] ?? `${ref} asks the reader to slow down and follow Paul's argument carefully. In ${chapterStudy.title}, this verse is not an isolated thought; it is one step in the gospel's movement from human need to God's saving answer in Christ.`;
}

function verseHistoricalParagraph(chapterStudy, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  return cleanSentence(`${chapterStudy.historicalContext} The setting matters because Romans is written to real believers learning to live as one church in the shadow of empire, Jewish and Gentile memories, religious pride, social pressure, and the claim that Jesus alone is Lord. Here the issue of ${section.focus} is not abstract; it is being tested in the life of the church. ${primary.exegesis}`);
}

function verseTheologicalParagraph(chapterStudy, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const secondary = matchedProfiles[1] ?? primary;
  const theology = [primary.theology, secondary.theology !== primary.theology ? secondary.theology : "", section.adventistAngle]
    .filter(Boolean)
    .join(" ");
  return cleanSentence(publicizeTheology(`${theology} This keeps Paul's gospel whole: grace comes first, Christ remains the sinner's only ground of acceptance, the law is honored without being made a savior, and obedience appears as the fruit of faith rather than the price of mercy.`));
}

function versePastoralParagraph(ref, chapterStudy, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const secondary = matchedProfiles[1] ?? primary;
  const movement = shortRef(ref);
  const closings = {
    gospel: "When life is crowded with rival claims, the gospel gives steadier eyes: Christ is not one voice among many, but God's saving answer.",
    righteousness: "When conscience begins to bargain or boast, this verse calls us back to a righteousness received before it is reflected.",
    faith: "When faith feels small, Paul does not send us inward to measure it; he sends us outward to the God whose promise is sure.",
    assurance: "When accusation grows loud, this verse teaches us to answer with Christ rather than with the shifting evidence of our own strength.",
    law: "When commandment and grace seem to pull apart, Paul steadies us: the law can name the good, but Christ alone can save and renew.",
    sin: "When sin is exposed, the point is not despair but honesty before the mercy strong enough to cleanse.",
    grace: "When the heart wants to pay its way back to God, grace teaches it to receive first and obey with gratitude.",
    "creation witness": "When creation is treated as ultimate, worship bends toward the creature; Paul turns our eyes back to the Creator who is never absent from His world.",
    Spirit: "When obedience feels impossible, the Spirit turns the command of God from accusation into life.",
    "whole-life worship": "When worship is tempted to stay in words only, this verse brings it back into the body, the schedule, the appetite, and the next act of surrender.",
    "liberty and conscience": "When freedom becomes self-protection, love teaches it to ask what will strengthen another soul.",
    mission: "When truth becomes private possession, Paul sends it outward again, because Christ is worthy of every nation.",
    "love and mercy": "When doctrine becomes cold, love proves whether mercy has truly taken root."
  };
  const closing = closings[primary.term] ?? "The gospel gives steadier eyes: God is at work beneath the surface, Christ is enough for the need Paul has exposed, and the next faithful step can be taken without pretending we are strong in ourselves.";
  return cleanSentence(`${primary.application} ${secondary.application !== primary.application ? secondary.application : ""} ${movement} teaches us not to read our lives by fear, pride, or visible strength alone. ${closing}`);
}

function buildDetailedExplanation(ref, verseText, chapterStudy, section, matchedProfiles) {
  const verseCue = excerpt(verseText);
  const opening = verseOpening(ref, verseText, chapterStudy, section, matchedProfiles);
  const p1 = `${opening} The line begins, "${verseCue}", and that wording lets us feel the particular pressure of the passage rather than rushing past it.`;
  const p2 = `${chapterStudy.literaryContext} Here the immediate scene is ${sectionLabel(section)}. ${section.summary} Paul is building his case patiently, so this verse should be heard inside the paragraph's movement rather than pulled away from it.`;
  const p3 = verseHistoricalParagraph(chapterStudy, section, matchedProfiles);
  const p4 = verseTheologicalParagraph(chapterStudy, section, matchedProfiles);
  const p5 = versePastoralParagraph(ref, chapterStudy, section, matchedProfiles);
  return [p1, p2, p3, p4, p5].map(cleanSentence).join("\n\n");
}

function buildExegesis(ref, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const secondary = matchedProfiles[1] ?? primary;
  return cleanSentence(`${ref} should be read within ${sectionLabel(section)}. ${primary.exegesis} ${secondary.exegesis !== primary.exegesis ? secondary.exegesis : ""} The verse contributes to Paul's patient movement from human need to God's saving answer in Christ.`);
}

function buildHistoricalBackground(chapterStudy, section) {
  return cleanSentence(`${chapterStudy.historicalContext} Within that setting, ${section.summary} This background matters because Jewish and Gentile believers in Rome had to learn how the same gospel addressed privilege, guilt, conscience, worship, and mission.`);
}

function buildTechnicalNotes(matchedProfiles) {
  const notes = matchedProfiles.map((matched) => `${capitalize(matched.term)}: ${matched.exegesis}`).join(" ");
  return cleanSentence(`${notes} The key interpretive control is context: Paul is not building isolated doctrines from fragments but developing one sustained argument about God's righteousness in Christ.`);
}

function buildTheologicalInsight(section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const secondary = matchedProfiles[1] ?? primary;
  return cleanSentence(publicizeTheology(`${primary.theology} ${secondary.theology !== primary.theology ? secondary.theology : ""} ${section.adventistAngle} This keeps the verse within the biblical balance of justification by faith, Spirit-formed obedience, and hope in Christ's final restoration.`));
}

function buildStructuralNotes(chapterStudy, section, verseNum) {
  const parsed = parseRange(section.range);
  const position =
    verseNum === parsed.start
      ? "opens"
      : verseNum === parsed.end
        ? "concludes"
        : "develops";
  return cleanSentence(`This verse ${position} the unit ${sectionLabel(section)}. In the chapter's flow, the unit serves the theme "${chapterStudy.title}" and prepares the reader for Paul's next step in the letter's gospel argument.`);
}

function buildOtherInsights(matchedProfiles) {
  const secondary = matchedProfiles[1] ?? matchedProfiles[0];
  return cleanSentence(`This passage keeps ${matchedProfiles[0].term} connected with ${secondary.term}, refusing to let doctrine become thin or one-sided. Romans presses toward a whole gospel: pardon without presumption, obedience without boasting, assurance without carelessness, and mission without pride.`);
}

function buildApplication(matchedProfiles, section) {
  const primary = matchedProfiles[0];
  const secondary = matchedProfiles[1] ?? primary;
  return cleanSentence(`${primary.application} ${secondary.application !== primary.application ? secondary.application : ""} In practice, ${section.focus} should move the reader toward repentance, trust, worship, and a concrete act of love.`);
}

function buildRelatedConnection(chapterNumber, section, matchedProfiles) {
  const primary = matchedProfiles[0];
  const connections = {
    1: "Romans 3:21-26, where God's righteousness in Christ answers the guilt exposed here",
    2: "Romans 3:27-31, where faith excludes boasting while establishing the law",
    3: "Romans 4, where Abraham and David illustrate justification by faith",
    4: "Romans 5, where peace and assurance flow from this faith",
    5: "Romans 6, where the reign of grace becomes newness of life",
    6: "Romans 8, where the Spirit gives power for the life described here",
    7: "Romans 8, where life in the Spirit answers this conflict",
    8: "Romans 12, where assurance becomes embodied worship and service",
    9: "Romans 10, where righteousness is received by faith",
    10: "Romans 11, where the discussion opens into remnant grace and mercy",
    11: "Romans 12, where God's mercies produce practical life",
    12: "Romans 13, where transformed love shapes public conduct and wakefulness",
    13: "Romans 14, where love governs disputes of conscience in the church",
    14: "Romans 15, where the strong bear the weak after the pattern of Christ",
    15: "Romans 16, where the gospel produces real community and mission partnership",
    16: "Romans 1:5 and 16:26, which frame the whole letter as the obedience of faith among all nations"
  };
  return `${section.title} connects with ${connections[chapterNumber]}. The link is especially important for ${primary.term}, because Paul wants doctrine to become worship, fellowship, and witness.`;
}

function buildWordNotes(matchedProfiles) {
  const seen = new Set();
  return matchedProfiles
    .filter((matched) => matched.key !== "default")
    .filter((matched) => {
      if (seen.has(matched.term)) return false;
      seen.add(matched.term);
      return true;
    })
    .slice(0, 3)
    .map((matched) => ({
      term: capitalize(matched.term),
      explanation: cleanSentence(matched.explanation),
      scriptureReferences: matched.refs.slice(0, 3)
    }));
}

function buildCrossReferences(chapterStudy, section, matchedProfiles) {
  return uniqueStrings([
    ...chapterStudy.crossReferences,
    ...section.crossReferences,
    ...matchedProfiles.flatMap((matched) => matched.refs)
  ]).slice(0, 10);
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter(Boolean).filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}


function populateVerse(chapterNumber, chapterStudy, verse) {
  const vNum = verseNumber(verse.verse);
  const section = sectionForVerse(chapterStudy, vNum);
  const matched = matchingProfiles(verse.bibleText);
  const refs = sourceRefsFor(chapterNumber, section.range, verse.verse);
  const commentary = {
    detailedExplanation: buildDetailedExplanation(verse.verse, verse.bibleText, chapterStudy, section, matched),
    exegesis: buildExegesis(verse.verse, section, matched),
    historicalBackground: buildHistoricalBackground(chapterStudy, section),
    technicalNotes: buildTechnicalNotes(matched),
    theologicalInsight: buildTheologicalInsight(section, matched),
    structuralNotes: buildStructuralNotes(chapterStudy, section, vNum),
    otherCommentaryInsights: buildOtherInsights(matched),
    application: buildApplication(matched, section),
    reviewFlags: []
  };

  return {
    ...verse,
    explanation: commentary.detailedExplanation.split("\n\n")[0],
    historicalBackground: commentary.historicalBackground,
    literaryContext: `${chapterStudy.literaryContext} The immediate literary unit is ${sectionLabel(section)}.`,
    theologicalInsight: commentary.theologicalInsight,
    structuralNotes: commentary.structuralNotes,
    relatedConnection: buildRelatedConnection(chapterNumber, section, matched),
    crossReferences: buildCrossReferences(chapterStudy, section, matched),
    application: commentary.application,
    sources: refs,
    commentary,
    wordNotes: buildWordNotes(matched),
    sourceAudit: makeAudit(refs),
    reviewStatus: "needs-source-review"
  };
}

function emptyTeachingFallback() {
  return {
    openingQuestion: "",
    mainPoint: "",
    keyVerses: [],
    importantTerms: [],
    discussionQuestions: [],
    commonMisunderstandings: [],
    emphasis: "",
    closingAppeal: ""
  };
}

function chapterTeachingNotes(chapterNumber, study) {
  return {
    ...emptyTeachingFallback(),
    openingQuestion: `Where does Romans ${chapterNumber} confront our instinct to trust something other than Christ?`,
    mainPoint: study.summary,
    keyVerses: study.crossReferences.slice(0, 3),
    importantTerms: study.themes,
    discussionQuestions: [
      `What does this chapter reveal about God's character?`,
      `How does the chapter guard against both legalism and careless discipleship?`,
      `Where does this chapter call for a concrete response of faith, repentance, or love?`
    ],
    commonMisunderstandings: [
      "Reading faith as mere opinion rather than trusting allegiance.",
      "Using grace to excuse sin rather than to receive pardon and transformation.",
      "Separating Paul's practical commands from the mercies of God in Christ."
    ],
    emphasis: "Keep Christ, grace, faith, and Spirit-formed obedience together.",
    closingAppeal: "Invite the reader to receive Christ's righteousness and walk in the light already given."
  };
}

function chapterEvangelisticNotes(chapterNumber, study) {
  const refs = sourceRefsFor(chapterNumber, study.outline[0].range, `Romans ${chapterNumber}`);
  return {
    mainDoctrinalTheme: study.themes[0] ?? "The gospel of Christ",
    keyBibleTexts: uniqueStrings([`Romans ${chapterNumber}`, ...study.crossReferences]).slice(0, 6),
    flow: [
      "Begin with the human need named in the chapter.",
      "Show how Christ answers that need by grace through faith.",
      "Call for trust that becomes repentance, obedience, love, and witness."
    ],
    simpleIllustrations: [
      "A verdict of acquittal that also opens the door to a restored home.",
      "A physician who not only forgives the debt but heals the disease.",
      "A freed servant learning to live under a gracious new Master."
    ],
    appealQuestion: `What would it mean to receive the truth of Romans ${chapterNumber} as God's call today?`,
    cautions: [
      "Do not turn obedience into a basis of acceptance.",
      "Do not present grace as permission to remain under sin's rule.",
      "Avoid using disputed details to obscure the central appeal of Christ."
    ],
    sources: refs
  };
}

function populateChapter(chapterNumber) {
  const chapter = readChapter(chapterNumber);
  const study = chapterStudies[chapterNumber];
  if (!study) throw new Error(`Missing study data for Romans ${chapterNumber}`);
  if (chapter.verses.length !== expectedVerseCounts[chapterNumber - 1]) {
    throw new Error(`Romans ${chapterNumber} has ${chapter.verses.length} verses.`);
  }
  const chapterRefs = sourceRefsFor(chapterNumber, study.outline[0].range, `Romans ${chapterNumber}`);
  const symbols = (study.symbols ?? []).map((entry) => ({
    ...entry,
    sources: chapterRefs.slice(0, 4)
  }));

  const populated = {
    ...chapter,
    title: study.title,
    summary: study.summary,
    historicalContext: study.historicalContext,
    literaryContext: study.literaryContext,
    themes: study.themes,
    outline: study.outline.map(({ range, title, summary }) => ({ range, title, summary })),
    verses: chapter.verses.map((verse) => populateVerse(chapterNumber, study, verse)),
    symbols,
    charts: [],
    images: [],
    crossReferences: study.crossReferences,
    relatedConnections: [
      {
        sourceText: `Romans ${chapterNumber}`,
        relatedText: `Romans ${chapterNumber} contributes to the whole-letter movement from universal need to grace, Spirit-formed obedience, and mission among all nations.`,
        sources: chapterRefs.slice(0, 5)
      }
    ],
    teachingNotes: chapterTeachingNotes(chapterNumber, study),
    evangelisticNotes: chapterEvangelisticNotes(chapterNumber, study),
    reflectionQuestions: [
      `What does Romans ${chapterNumber} teach me to believe about God?`,
      `What false confidence does this chapter challenge?`,
      `How does this chapter call me to live by faith this week?`
    ],
    sources: chapterRefs
  };

  if (chapterNumber === 1) {
    return applyRomansOneCuration(populated, sourceIds, root);
  }

  return populated;
}

function writeIntroduction() {
  const introduction = {
    title: "Romans",
    subtitle: "Righteousness by faith, life in the Spirit, and the obedience of faith.",
    summary: "Romans is Paul's expansive presentation of the gospel: the whole world needs grace, God justifies sinners through faith in Christ, the Spirit forms a new life, and the church becomes a missionary people shaped by mercy. This study reads Romans from a conservative Adventist perspective, with Christ's righteousness, the law's proper role, Spirit-led obedience, and end-time witness held together.",
    facts: [
      { label: "Author", value: "The apostle Paul" },
      { label: "Recipients", value: "Jewish and Gentile believers in Rome" },
      { label: "Chapters", value: "16" },
      { label: "Verses", value: "433" },
      { label: "Text", value: "King James Version" }
    ],
    highlights: [
      "Romans 1-3 establishes the universal need for God's righteousness.",
      "Romans 4-8 unfolds justification by faith, union with Christ, and life in the Spirit.",
      "Romans 9-11 defends God's faithfulness, mercy, and remnant purpose.",
      "Romans 12-16 shows the practical obedience of faith in church, society, conscience, and mission."
    ],
    sections: [
      {
        id: "historical-setting",
        title: "Historical Setting",
        body: [
          "Paul writes before visiting Rome, probably while preparing to carry the collection to Jerusalem. The church in Rome included both Jewish and Gentile believers, and the letter carefully addresses the tensions, privileges, and responsibilities of both groups.",
          "Because Rome was the empire's capital, Paul's gospel language also carried public weight. Jesus, not Caesar, is Lord. Yet Paul teaches this lordship through the cross, resurrection, Spirit-filled life, and humble mission rather than through political violence."
        ]
      },
      {
        id: "theological-center",
        title: "Theological Center",
        body: [
          "The center of Romans is the righteousness of God revealed in the gospel and received by faith. Paul excludes boasting because sinners are justified by grace, yet he also insists that faith establishes the law and produces a transformed life.",
          "This study follows an Adventist reading of righteousness by faith: Christ's righteousness is the believer's only ground of acceptance, and the same grace that justifies also restores obedience through the Holy Spirit."
        ]
      },
      {
        id: "reading-flow",
        title: "Reading Flow",
        body: [
          "Romans moves in a deliberate sequence. Paul first diagnoses sin, then announces justification, then describes union with Christ and life in the Spirit, then wrestles with Israel and the nations, and finally shows mercy becoming practical love.",
          "The practical commands of Romans 12-16 are therefore not a separate moral checklist. They are the life that grows from God's mercies in Christ."
        ]
      },
      {
        id: "adventist-lens",
        title: "Adventist Reading Lens",
        body: [
          "Romans should be read in harmony with the whole Bible: law and gospel, judgment and assurance, faith and obedience, grace and mission belong together. The law exposes sin and describes God's will, but only Christ saves and only the Spirit can write God's will on the heart.",
          "The letter also strengthens Adventist mission. The gospel is for all nations, the remnant exists by grace, and the obedience of faith is the fruit of Christ's saving work rather than the basis of human boasting."
        ]
      }
    ],
    relatedLinks: [
      {
        title: "Open Romans 1",
        href: "/romans/1",
        description: "Begin with Paul's gospel thesis and the world's need."
      },
      {
        title: "Study Romans 8",
        href: "/romans/8",
        description: "Read the chapter on life in the Spirit and assurance."
      }
    ]
  };

  writeFileSync(join(contentRoot, "introduction.json"), `${JSON.stringify(introduction, null, 2)}\n`);
}

for (let chapterNumber = 1; chapterNumber <= chapterCount; chapterNumber += 1) {
  writeChapter(populateChapter(chapterNumber));
}

writeIntroduction();
console.log("Populated Romans study content for 16 chapters and 433 verses.");
