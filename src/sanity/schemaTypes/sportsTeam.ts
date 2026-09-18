import { defineField, defineType } from "sanity";

export const sportsTeam = defineType({
  name: "sportsTeam",
  title: "Sports team",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Team",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "abbreviation",
      title: "Abbreviation",
      type: "string",
      description: "ESPN abbreviation, such as NYK, KC, or NYY.",
      validation: (rule) => rule.required().min(2).max(5),
    }),
    defineField({
      name: "league",
      type: "string",
      options: {
        list: [
          { title: "NBA", value: "nba" },
          { title: "NFL", value: "nfl" },
          { title: "MLB", value: "mlb" },
          { title: "NHL", value: "nhl" },
        ],
        layout: "radio",
      },
      initialValue: "nba",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isDefault",
      title: "Default team",
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
      abbreviation: "abbreviation",
      league: "league",
      isDefault: "isDefault",
    },
    prepare: ({ title, abbreviation, league, isDefault }) => ({
      title,
      subtitle: [abbreviation, league, isDefault ? "default" : ""]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
