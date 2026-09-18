import { defineField, defineType } from "sanity";

export const stockTicker = defineType({
  name: "stockTicker",
  title: "Stock ticker",
  type: "document",
  fields: [
    defineField({
      name: "symbol",
      title: "Symbol",
      type: "string",
      description: "Yahoo Finance symbol, such as AAPL or MSFT.",
      validation: (rule) =>
        rule
          .required()
          .regex(/^[A-Za-z0-9.^+=-]{1,12}$/, {
            name: "ticker",
            invert: false,
          })
          .error("Use a short ticker like AAPL, MSFT, or BRK-B."),
    }),
    defineField({
      name: "name",
      title: "Company name",
      type: "string",
    }),
    defineField({
      name: "isDefault",
      title: "Default ticker",
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
    select: { title: "symbol", subtitle: "name", isDefault: "isDefault" },
    prepare: ({ title, subtitle, isDefault }) => ({
      title: String(title || "").toUpperCase(),
      subtitle: isDefault ? `${subtitle || ""} · default` : subtitle,
    }),
  },
});
