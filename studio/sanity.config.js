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
            // Everything else (articles)
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
