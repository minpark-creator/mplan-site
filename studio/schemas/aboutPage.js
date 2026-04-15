// Sanity schema — About page (singleton)
export default {
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    {
      name: "intro", title: "Intro paragraphs", type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "contactBlock", title: "Contact block (right column)", type: "object",
      fields: [
        { name: "mail",    title: "Mail",    type: "string" },
        { name: "address", title: "Address (one line per row)", type: "text", rows: 4 },
        { name: "ig",      title: "Instagram", type: "string" },
      ],
    },
    { name: "team",          title: "Team (one name per line)",              type: "text", rows: 8 },
    { name: "contributors",  title: "Contributors — Issue 01 (one per line)", type: "text", rows: 20 },
    { name: "issues",        title: "Issues (one per line)",                  type: "text", rows: 6 },
  ],
  preview: { prepare: () => ({ title: "About page" }) },
};
