import { defineField, defineType } from "sanity";

export const authScreen = defineType({
  name: "authScreen",
  title: "Sign-in screen",
  type: "document",
  fields: [
    defineField({
      name: "kicker",
      title: "Kicker",
      type: "string",
      initialValue: "New board",
    }),
    defineField({
      name: "title",
      title: "Headline",
      type: "string",
      validation: (rule) => rule.required(),
      initialValue: "Keep your own cities, stocks, and teams.",
    }),
    defineField({
      name: "body",
      title: "Intro",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "points",
      title: "What a new account includes",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "signUpLabel",
      title: "Sign-up button",
      type: "string",
      initialValue: "Sign up with GitHub",
    }),
    defineField({
      name: "signInLabel",
      title: "Sign-in button",
      type: "string",
      initialValue: "Sign in",
    }),
    defineField({
      name: "browseLabel",
      title: "Shared-board link",
      type: "string",
      initialValue: "Use the shared board",
    }),
    defineField({
      name: "footnote",
      title: "Footnote",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Sign-in screen" }),
  },
});
