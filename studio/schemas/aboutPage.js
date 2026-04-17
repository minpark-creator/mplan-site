// Sanity schema — About page (singleton)
//
// Layout idea: left column is the intro / bio paragraphs, right column is
// a single image with optional caption + credit. On narrow screens the
// image slots between the intro and the "Team / Contributors / Issues"
// sections automatically.
export default {
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    {
      name: "intro", title: "Intro paragraphs (left column)", type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "sideImage", title: "Right column image", type: "object",
      description: "Shown to the right of the intro on desktop. On mobile it appears between the intro and the sections below.",
      fields: [
        { name: "asset",   title: "Image",           type: "image", options: { hotspot: true } },
        { name: "caption", title: "Caption",         type: "string" },
        { name: "credit",  title: "Source / credit", type: "string" },
        { name: "alt",     title: "Alt text",        type: "string" },
      ],
    },
    // NOTE: team + contributors used to live here. They now live on each
    // Issue document (see schemas/issue.js), so every new issue keeps
    // its own archived roster and the About page pulls from the latest
    // issue automatically.

    { name: "issues",        title: "Issues (one per line)",            type: "text", rows: 6 },

    {
      name: "notes",
      title: "Additional notes (grey small text)",
      description:
        "Extra grey footnote-style paragraphs. Each one picks which section it appears under. The canonical note under Contributors (\"and architects, photographers, writers…\") is always shown automatically — don't re-add it here.",
      type: "array",
      of: [
        {
          type: "object",
          name: "note",
          title: "Note",
          fields: [
            {
              name: "text",
              title: "Text",
              type: "text",
              rows: 3,
              validation: Rule => Rule.required(),
            },
            {
              name: "placement",
              title: "Place under which section",
              type: "string",
              options: {
                list: [
                  { title: "After Team",         value: "afterTeam" },
                  { title: "After Contributors", value: "afterContributors" },
                  { title: "After Issues",       value: "afterIssues" },
                ],
                layout: "radio",
              },
              initialValue: "afterContributors",
              validation: Rule => Rule.required(),
            },
          ],
          preview: {
            select: { text: "text", placement: "placement" },
            prepare: ({ text, placement }) => ({
              title: text ? text.slice(0, 60) : "(empty note)",
              subtitle: placement || "",
            }),
          },
        },
      ],
    },
  ],
  preview: { prepare: () => ({ title: "About page" }) },
};
