# Romans Theological and Historical Pass

## Scope

This pass audits all 433 verse notes in Romans 1-16. It preserves sound existing commentary, adds focused safeguards where a passage is commonly misread, and promotes only completed notes to `verified-seed`. It does not alter KJV text, chapter summaries, outlines, reader layout, navigation, or article content.

## Interpretive Method

1. Scripture in its literary and canonical context controls each conclusion.
2. The General Conference's *Methods of Bible Study* is the private hermeneutical control.
3. Official Fundamental Beliefs are private controls for settled teaching.
4. Biblical Research Institute material is used privately for disputed exegesis, especially Romans 14.
5. Ellen G. White's *Faith and Works* is used only as a private secondary cross-check, never as a substitute for biblical exegesis.
6. Primary historical sources and official archaeological material are used selectively and with chronological caution.
7. Public prose remains independently worded, Scripture-first, citation-free, and free of source names or research-process language.

## Private Controls

- General Conference of Seventh-day Adventists, *Methods of Bible Study*.
- Seventh-day Adventist Church, *The 28 Fundamental Beliefs*.
- Ellen G. White, *Faith and Works*.
- Biblical Research Institute, *Romans 14*.
- Biblical Research Institute, *Clean and Unclean Meats*.
- Archaeological Park of Ostia Antica, *Ancient Ostia: History and Urban Development*.
- Suetonius, *Life of Claudius* 25.4.
- Gaius, *Institutes* 1.97-107.
- American School of Classical Studies at Athens, Kenchreai archaeological report.

The public app strips `sources` and `sourceAudit` from serialized chapter data. These controls remain in canonical content for editorial review and regression checking.

## Priority Reviews

- Romans 1:26-27: creation order, sexual ethics, human dignity, and compassion.
- Romans 2:6, 13: judgment according to works as evidence, never merit.
- Romans 3:25, 31 and 4:5: atonement, law and gospel, and non-meritorious faith.
- Romans 5:12, 18: mortality and the fallen condition without inherited personal guilt or automatic universal salvation.
- Romans 6:4, 23: baptism by immersion, new life, conditional immortality, and resurrection.
- Romans 7:12, 14, 24: the goodness of the law and deliverance from defeat through Christ and the Spirit.
- Romans 8:1, 9, 11, 15, 23, 29: assurance, the personal Holy Spirit, bodily resurrection, adoption, and Christ-centered predestination.
- Romans 9:18, 22: judicial hardening, divine longsuffering, and human responsibility.
- Romans 10:4: `telos` and Christ as the law's goal rather than its abolition.
- Romans 11:1, 17, 26: God's faithfulness to Israel without replacement pride or a second way of salvation.
- Romans 12:6: continuing spiritual gifts under Scripture and love.
- Romans 13:1, 6, 8: limited civil authority, historical taxation, and love as the fulfillment rather than abolition of law.
- Romans 14:1, 5, 14: disputed practices, the weekly Sabbath, and the `koinos`/`akathartos` distinction.
- Romans 16:1, 5, 7, 20: Cenchrea, house churches, Phoebe, Junia, interpretive restraint, and nonviolent victory over evil.

## Editorial Contract

- Every canonical note must contain at least 200 words of detailed commentary.
- Every completed note must have `reviewStatus: "verified-seed"` and no review flags.
- Every note must retain valid private source controls.
- Public prose must contain no URLs, citation markers, source attributions, denominational self-labeling, or research-process language.
- The audit manifest stores one reference, word count, status, priority flag, and SHA-256 hash per note.
- Future imports and chapter-curation scripts may continue to create `needs-source-review` notes; the theological pass is the explicit promotion step.

## Validation

Run:

```bash
npm run apply:romans-theology
npm run validate:romans-theology
npm run validate:content
npm run audit:copying
npm run typecheck
npm run lint
npm run build
```

The theological validator checks the 433-note count, review state, private source integrity, audit hashes, curated-source durability, public-language restrictions, and verse-specific doctrinal safeguards.
