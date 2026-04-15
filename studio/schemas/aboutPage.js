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
    { name: "team",          title: "Team (one name per line)",              type: "text", rows: 8 },
    { name: "contributors",  title: "Contributors — Issue 01 (one per line)", type: "text", rows: 20 },
    { name: "issues",        title: "Issues (one per line)",                  type: "text", rows: 6 },
  ],
  preview: { prepare: () => ({ title: "About page" }) },
};
