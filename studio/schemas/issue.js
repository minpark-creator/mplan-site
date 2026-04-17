// Sanity schema — Issue (Issue 01, 02, 03 …)
//
// Each issue is its own document. Articles point at an issue via a
// reference field, so the Studio can group them in the sidebar and
// future features (issue landing pages, archive views) can query by
// issue without hard-coding strings.
export default {
  name: "issue",
  title: "Issue",
  type: "document",
  fields: [
    {
      name: "number",
      title: "Issue number",
      type: "number",
      description:
        "1, 2, 3 … Used to sort issues and to display as 'Issue 01', 'Issue 02'.",
      validation: (Rule) => Rule.required().integer().positive(),
    },
    {
      name: "title",
      title: "Issue title / theme",
      type: "string",
      description: "Optional. e.g. 'Spring 2026' or 'Ground Floor'.",
    },
    {
      name: "publishedAt",
      title: "Release date",
      type: "date",
    },
    {
      name: "description",
      title: "Short description",
      type: "text",
      rows: 3,
      description: "Optional intro paragraph for the issue.",
    },
  ],
  orderings: [
    {
      title: "Newest issue first",
      name: "numberDesc",
      by: [{ field: "number", direction: "desc" }],
    },
    {
      title: "Oldest first",
      name: "numberAsc",
      by: [{ field: "number", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      number: "number",
      title: "title",
      publishedAt: "publishedAt",
    },
    prepare({ number, title, publishedAt }) {
      const label = `Issue ${number != null ? String(number).padStart(2, "0") : "—"}`;
      const year = publishedAt ? new Date(publishedAt).getFullYear() : "";
      const sub = [title, year].filter(Boolean).join(" · ");
      return { title: label, subtitle: sub };
    },
  },
};
