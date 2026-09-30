'use client'

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "home-board",
  title: "Home Board",
  basePath: "/studio",
  projectId: projectId || "unset",
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Home Board")
          .items([
            S.listItem()
              .title("Platform settings")
              .id("platformSettings")
              .child(
                S.document()
                  .schemaType("platformSettings")
                  .documentId("platformSettings"),
              ),
            S.listItem()
              .title("Sign-in screen")
              .id("authScreen")
              .child(
                S.document().schemaType("authScreen").documentId("authScreen"),
              ),
            S.divider(),
            S.documentTypeListItem("applet").title("Applets"),
            S.documentTypeListItem("weatherLocation").title(
              "Weather locations",
            ),
            S.documentTypeListItem("stockTicker").title("Stock tickers"),
            S.documentTypeListItem("sportsTeam").title("Sports teams"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: { types: schemaTypes },
});
