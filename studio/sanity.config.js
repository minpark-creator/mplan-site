import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "mplan-studio",
  title: "MPLAN Magazine",

  projectId: "snlhed6n",
  dataset: "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Singletons pinned to the top
            S.listItem()
              .title("About page")
              .id("aboutPage")
              .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
            S.listItem()
              .title("Contact page")
              .id("contactPage")
              .child(S.document().schemaType("contactPage").documentId("contactPage")),
            S.divider(),

            // Curated: browse articles grouped by the issue they appear in.
            // Clicking an issue drills down into the articles that
            // reference it.
            S.listItem()
              .title("Articles by issue")
              .child(
                S.documentTypeList("issue")
                  .title("Pick an issue")
                  .defaultOrdering([{ field: "number", direction: "desc" }])
                  .child((issueId) =>
                    S.documentList()
                      .title("Articles in this issue")
                      .schemaType("article")
                      .filter('_type == "article" && issue._ref == $issueId')
                      .params({ issueId })
                      .defaultOrdering([
                        { field: "publishedAt", direction: "desc" },
                      ])
                  )
              ),

            // Articles with no issue set — useful for drafts / orphans.
            S.listItem()
              .title("Articles — unassigned")
              .child(
                S.documentList()
                  .title("Articles with no issue")
                  .schemaType("article")
                  .filter('_type == "article" && !defined(issue)')
                  .defaultOrdering([
                    { field: "publishedAt", direction: "desc" },
                  ])
              ),

            S.divider(),

            // Flat default lists for every document type (Issues, Articles)
            ...S.documentTypeListItems().filter(
              (item) => !["aboutPage", "contactPage"].includes(item.getId())
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
