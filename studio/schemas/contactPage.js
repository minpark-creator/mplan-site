// Sanity schema — Contact page (singleton)
//
// Left column is the invitation / body copy (plus the heading sections
// below). Right column is a compact contact card: email, phone, address.
// Any of the three can be left blank — blanks are hidden on the site.
export default {
  name: "contactPage",
  title: "Contact page",
  type: "document",
  fields: [
    {
      name: "intro", title: "Intro paragraphs (left column)", type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "contactInfo", title: "Contact info (right column)", type: "object",
      description: "Shown beside the intro on desktop. On mobile it slots between the intro and the sections below.",
      fields: [
        { name: "email",   title: "Email address", type: "string" },
        { name: "phone",   title: "Phone number",  type: "string" },
        { name: "address", title: "Address (one line per row)", type: "text", rows: 4 },
      ],
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
