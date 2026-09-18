import { defineField, defineType } from "sanity";

export const platformSettings = defineType({
  name: "platformSettings",
  title: "Platform settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Board title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "footerNote",
      title: "Footer note",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Platform settings" }),
  },
});
