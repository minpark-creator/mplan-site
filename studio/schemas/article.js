// Sanity schema — Article (one per yellow tile on the landing page)

const inlineImage = {
  name: "inlineImage",
  title: "Inline image",
  type: "object",
  fields: [
    { name: "asset",   title: "Image",            type: "image", options: { hotspot: true } },
    { name: "caption", title: "Caption",          type: "string" },
    { name: "credit",  title: "Image source / credit", type: "string",
      description: "e.g. Photo by Jane Doe, Courtesy of Studio X" },
    { name: "alt",     title: "Alt text",         type: "string",
      description: "Short description for accessibility" },
  ],
  preview: {
    select: { title: "caption", subtitle: "credit", media: "asset" },
    prepare({ title, subtitle, media }) {
      return { title: title || "(untitled image)", subtitle, media };
    },
  },
};

export default {
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    { name: "title",  title: "Title",  type: "string", validation: Rule => Rule.required() },
    { name: "slug",   title: "Slug",   type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: Rule => Rule.required() },

    { name: "author",           title: "Author name",     type: "string", validation: Rule => Rule.required() },
    { name: "authorAffiliation", title: "Author affiliation",
      type: "string",
      description: "e.g. City Planning MPlan 23/25 — shown in grey under the author name." },
    { name: "authorEmail", title: "Author email (Contact link)",
      type: "string",
      description: "If set, a 'Contact' hyperlink appears on the article page that opens an email to this address. The address itself is never shown." },

    { name: "issue", title: "Issue", type: "reference",
      to: [{ type: "issue" }],
      description:
        "Which issue this article appears in. Pick an existing issue or create a new one from the sidebar. Leave empty for unassigned / draft." },

    { name: "publishedAt", title: "Published date", type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required() },

    {
      name: "category", title: "Category", type: "string",
      options: {
        list: [
          { title: "Matter",          value: "matter"   },
          { title: "Projects",        value: "projects" },
          { title: "Letters",         value: "letters"  },
          { title: "Address a space", value: "address"  },
          { title: "Notes",           value: "notes"    },
        ],
        layout: "radio",
      },
      validation: Rule => Rule.required(),
    },

    { name: "excerpt", title: "Excerpt (short summary)", type: "text", rows: 3,
      description: "Optional. One or two sentences used for meta description." },

    {
      name: "coverImage", title: "Cover image", type: "object",
      description: "Shown at the top of the article page. Leave empty to skip.",
      fields: [
        { name: "asset",   title: "Image",         type: "image", options: { hotspot: true } },
        { name: "caption", title: "Caption",       type: "string" },
        { name: "credit",  title: "Source / credit", type: "string" },
        { name: "alt",     title: "Alt text",      type: "string" },
      ],
    },

    {
      name: "body", title: "Body", type: "array",
      of: [
        {
          type: "block",
          // Limit styles to the ones we render
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2",     value: "h2" },
            { title: "H3",     value: "h3" },
            { title: "Quote",  value: "blockquote" },
          ],
          lists: [{ title: "Bullet", value: "bullet" }],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
            annotations: [
              {
                name: "link", type: "object", title: "Link",
                fields: [{ name: "href", title: "URL", type: "url" }],
              },
            ],
          },
        },
        inlineImage,
      ],
    },
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "author", media: "coverImage.asset" },
  },
};
