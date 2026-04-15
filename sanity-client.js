// ============================================================
//  MPLAN — Sanity browser client
//  ------------------------------------------------------------
//  Thin wrapper around @sanity/client (loaded over ESM CDN).
//  Provides query helpers + a tiny image URL builder.
// ============================================================

import { createClient } from "https://esm.sh/@sanity/client@6";
import imageUrlBuilder from "https://esm.sh/@sanity/image-url@1";
import { SANITY_CONFIG } from "./sanity-config.js";

export const SANITY_ENABLED =
  !!SANITY_CONFIG.projectId && SANITY_CONFIG.projectId.length > 0;

export const client = SANITY_ENABLED
  ? createClient({
      projectId: SANITY_CONFIG.projectId,
      dataset: SANITY_CONFIG.dataset,
      apiVersion: SANITY_CONFIG.apiVersion,
      useCdn: SANITY_CONFIG.useCdn,
    })
  : null;

/* -------- Image URL builder --------
   Uses the official @sanity/image-url builder so hotspot + crop set in the
   Studio are respected. Accepts a Sanity image object (with asset ref and
   optionally hotspot/crop), not just a bare _ref string. */
const builder = SANITY_ENABLED ? imageUrlBuilder(client) : null;

// Responsive image. Preserves aspect ratio. Width only.
export function urlFor(image, width) {
  if (!builder || !image) return "";
  try {
    let b = builder.image(image).auto("format");
    if (width) b = b.width(width);
    return b.url();
  } catch (_) { return ""; }
}

// Hotspot-aware square thumbnail for home grid + "view more" tiles.
export function thumbUrl(image, size = 600) {
  if (!builder || !image) return "";
  try {
    return builder
      .image(image)
      .width(size)
      .height(size)
      .fit("crop")      // honours hotspot + crop from the Studio
      .auto("format")
      .quality(75)
      .url();
  } catch (_) { return ""; }
}

/* -------- Queries -------- */

// Returns the full cover image (asset ref + hotspot + crop) so the
// browser-side image-url builder can apply the author's crop. Same for
// inline body images.
const ARTICLE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  author,
  category,
  publishedAt,
  excerpt,
  coverImage{
    caption,
    credit,
    alt,
    asset{ ..., hotspot, crop }
  },
  body[]{
    ...,
    _type == "inlineImage" => {
      ...,
      asset{ ..., hotspot, crop }
    },
    _type == "image" => {
      ...,
      hotspot,
      crop
    }
  }
`;

export async function getArticles() {
  if (!client) return null;
  const q = `*[_type == "article"] | order(publishedAt desc){ ${ARTICLE_FIELDS} }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getArticles error:", e); return null; }
}

export async function getArticle(slug) {
  if (!client) return null;
  const q = `*[_type == "article" && slug.current == $slug][0]{ ${ARTICLE_FIELDS} }`;
  try { return await client.fetch(q, { slug }); } catch (e) { console.warn("getArticle error:", e); return null; }
}

export async function getRelatedArticles(excludeSlug, limit = 4) {
  if (!client) return null;
  const q = `*[_type == "article" && slug.current != $slug] | order(publishedAt desc)[0...20]{
    title, "slug": slug.current, author, category,
    coverImage{ asset{ ..., hotspot, crop } }
  }`;
  try {
    const list = await client.fetch(q, { slug: excludeSlug || "" });
    return list || [];
  } catch (e) { console.warn("getRelatedArticles error:", e); return null; }
}

export async function getAboutPage() {
  if (!client) return null;
  const q = `*[_type == "aboutPage"][0]{
    intro, team, contributors, issues,
    notes[]{ text, placement },
    sideImage{
      caption, credit, alt,
      asset{ ..., hotspot, crop }
    }
  }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getAboutPage error:", e); return null; }
}

export async function getContactPage() {
  if (!client) return null;
  const q = `*[_type == "contactPage"][0]{
    intro, sections,
    contactInfo{ email, phone, address }
  }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getContactPage error:", e); return null; }
}
