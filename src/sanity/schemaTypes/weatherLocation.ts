import { defineField, defineType } from "sanity";

export const weatherLocation = defineType({
  name: "weatherLocation",
  title: "Weather location",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "City",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "state",
      title: "State / region",
      type: "string",
      description: "US state or region, such as FL, IL, or England.",
    }),
    defineField({
      name: "country",
      type: "string",
    }),
    defineField({
      name: "latitude",
      type: "number",
      validation: (rule) => rule.required().min(-90).max(90),
    }),
    defineField({
      name: "longitude",
      type: "number",
      validation: (rule) => rule.required().min(-180).max(180),
    }),
    defineField({
      name: "isDefault",
      title: "Default city",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "name",
      state: "state",
      country: "country",
      isDefault: "isDefault",
    },
    prepare: ({ title, state, country, isDefault }) => ({
      title,
      subtitle: [state, country, isDefault ? "default" : ""]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
