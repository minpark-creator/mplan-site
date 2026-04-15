// Sanity schema — Contact page (singleton)
export default {
  name: "contactPage",
  title: "Contact page",
  type: "document",
  fields: [
    {
      name: "intro", title: "Intro paragraphs", type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "emails", title: "Email labels (right column)", type: "array",
      of: [{
        type: "object",
        fields: [
          { name: "label", title: "Label", type: "string", description: 'e.g. "General", "Submissions", "Press"' },
          { name: "email", title: "Email address (shown only on the first row)", type: "string" },
        ],
        preview: { select: { title: "label", subtitle: "email" } },
      }],
    },
    {
      name: "sections", title: "Sections under the intro", type: "array",
      of: [{
        type: "object",
        fields: [
          { name: "heading", title: "Heading", type: "string" },
          { name: "body",    title: "Body",    type: "array", of: [{ type: "block" }] },
        ],
        preview: { select: { title: "heading" } },
      }],
    },
  ],
  preview: { prepare: () => ({ title: "Contact page" }) },
};
