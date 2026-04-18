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
            // Issues — flat list of Issue documents (Issue 01, 02, 03 …).
            // "+" creates a new issue. Each issue carries its own team
            // and contributors fields; the public About page renders the
            // most recent issue's roster automatically.
            S.listItem()
              .title("Issues")
              .id("issuesList")
              .child(
                S.documentTypeList("issue")
                  .title("Issues")
                  .defaultOrdering([
                    { field: "number", direction: "desc" },
                  ])
              ),

            // Articles — flat list. "+" creates a new article and opens
            // its editor in the next pane. Each article has an "Issue"
            // reference field in its form (see schemas/article.js) that
            // the editor uses to assign the article to an issue.
            S.listItem()
              .title("Articles")
              .id("articlesList")
              .child(
                S.documentTypeList("article")
                  .title("Articles")
                  .defaultOrdering([
                    { field: "publishedAt", direction: "desc" },
                  ])
              ),

            S.divider(),

            // About page — plain singleton. All the editable fields
            // (intro, side image, grey notes, issues blurb) live directly
            // on this document. Team + contributors are NOT edited here:
            // they live on each Issue document, and the public About
            // page renders the most recent issue's roster automatically.
            S.listItem()
              .title("About page")
              .id("aboutPage")
              .child(S.document().schemaType("aboutPage").documentId("aboutPage")),

            S.listItem()
              .title("Contact page")
              .id("contactPage")
              .child(S.document().schemaType("contactPage").documentId("contactPage")),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
