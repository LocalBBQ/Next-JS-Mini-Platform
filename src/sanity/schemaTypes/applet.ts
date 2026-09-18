import { defineField, defineType } from "sanity";

export const applet = defineType({
  name: "applet",
  title: "Applet",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon (emoji)",
      type: "string",
      initialValue: "☁️",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "kind",
      type: "string",
      options: {
        list: [
          { title: "Weather", value: "weather" },
          { title: "Stocks", value: "stocks" },
          { title: "Sports", value: "sports" },
          { title: "Placeholder", value: "placeholder" },
        ],
        layout: "radio",
      },
      initialValue: "placeholder",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "Live", value: "live" },
          { title: "Coming soon", value: "comingSoon" },
        ],
        layout: "radio",
      },
      initialValue: "comingSoon",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "title", icon: "icon", status: "status" },
    prepare: ({ title, icon, status }) => ({
      title: `${icon || "•"} ${title}`,
      subtitle: status === "live" ? "Live" : "Coming soon",
    }),
  },
});
