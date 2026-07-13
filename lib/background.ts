import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

const paragraphBlockSchema = z
  .object({
    type: z.literal("paragraph"),
    text: nonEmptyText
  })
  .strict();

const timelineBlockSchema = z
  .object({
    type: z.literal("timeline"),
    title: nonEmptyText,
    note: nonEmptyText,
    events: z
      .array(
        z
          .object({
            date: nonEmptyText,
            title: nonEmptyText,
            description: nonEmptyText
          })
          .strict()
      )
      .length(7)
  })
  .strict();

const comparisonRowSchema = z.tuple([nonEmptyText, nonEmptyText, nonEmptyText]);

const comparisonBlockSchema = z
  .object({
    type: z.literal("comparison"),
    title: nonEmptyText,
    headers: comparisonRowSchema,
    rows: z.array(comparisonRowSchema).min(3).max(6)
  })
  .strict();

const backgroundBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  timelineBlockSchema,
  comparisonBlockSchema
]);

const backgroundSectionSchema = z
  .object({
    id: nonEmptyText,
    scope: z.enum(["Both Letters", "1 Corinthians", "2 Corinthians"]),
    title: nonEmptyText,
    blocks: z.array(backgroundBlockSchema).min(3)
  })
  .strict();

const backgroundFactSchema = z
  .object({
    icon: z.enum(["location", "period", "letters", "mission"]),
    label: nonEmptyText,
    value: nonEmptyText
  })
  .strict();

const sectionIds = [
  "pauline-authorship",
  "date-and-place-of-writing",
  "corinth-and-its-world",
  "the-founding-and-makeup-of-the-church",
  "pauls-relationship-with-corinth",
  "why-paul-wrote-1-corinthians",
  "why-paul-wrote-2-corinthians",
  "how-the-letters-fit-together"
] as const;

const backgroundContentSchema = z
  .object({
    title: nonEmptyText,
    subtitle: nonEmptyText,
    readingLens: z.array(nonEmptyText).min(1).max(2),
    facts: z.array(backgroundFactSchema).length(4),
    sections: z.array(backgroundSectionSchema).length(8)
  })
  .strict()
  .superRefine((content, context) => {
    content.sections.forEach((section, index) => {
      if (section.id !== sectionIds[index]) {
        context.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: `Expected section id ${sectionIds[index]}.`
        });
      }
    });

    const timelineBlocks = content.sections.flatMap((section) =>
      section.blocks.filter((block) => block.type === "timeline")
    );
    const comparisonBlocks = content.sections.flatMap((section) =>
      section.blocks.filter((block) => block.type === "comparison")
    );

    const relationshipSection = content.sections.find((section) => section.id === "pauls-relationship-with-corinth");
    const finalSection = content.sections.find((section) => section.id === "how-the-letters-fit-together");

    if (timelineBlocks.length !== 1 || !relationshipSection?.blocks.some((block) => block.type === "timeline")) {
      context.addIssue({
        code: "custom",
        path: ["sections"],
        message: "The Paul relationship section must contain the only timeline."
      });
    }

    if (
      comparisonBlocks.length !== 1 ||
      !finalSection?.blocks.some((block) => block.type === "comparison")
    ) {
      context.addIssue({
        code: "custom",
        path: ["sections"],
        message: "The final section must contain the only comparison table."
      });
    }
  });

export type BackgroundBlock = z.infer<typeof backgroundBlockSchema>;
export type BackgroundFact = z.infer<typeof backgroundFactSchema>;
export type BackgroundSection = z.infer<typeof backgroundSectionSchema>;
export type BackgroundContent = z.infer<typeof backgroundContentSchema>;

export function getBackgroundContent(): BackgroundContent {
  const path = join(process.cwd(), "content/background.json");
  const rawContent: unknown = JSON.parse(readFileSync(path, "utf8"));
  return backgroundContentSchema.parse(rawContent);
}
