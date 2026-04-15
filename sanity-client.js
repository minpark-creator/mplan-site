// ============================================================
//  MPLAN — Sanity browser client
//  ------------------------------------------------------------
//  Thin wrapper around @sanity/client (loaded over ESM CDN).
//  Provides query helpers + a tiny image URL builder.
// ============================================================

import { createClient } from "https://esm.sh/@sanity/client@6";
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

/* -------- Image URL builder (no extra dep) -------- */
// Accepts a Sanity image asset _ref like "image-abcdef-1200x800-jpg" and
// returns a CDN URL. Adds an optional width param for responsive sizing.
export function urlFor(ref, width) {
  if (!ref || !SANITY_ENABLED) return "";
  // ref format: image-<id>-<dims>-<format>
  const m = String(ref).match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/i);
  if (!m) return "";
  const [, id, dims, ext] = m;
  const base = `https://cdn.sanity.io/images/${SANITY_CONFIG.projectId}/${SANITY_CONFIG.dataset}/${id}-${dims}.${ext}`;
  return width ? `${base}?w=${width}&auto=format&q=80` : `${base}?auto=format`;
}

/* -------- Queries -------- */

const ARTICLE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  author,
  category,
  publishedAt,
  excerpt,
  "coverUrl": coverImage.asset->url,
  coverImage{
    "asset": asset,
    caption,
    credit,
    alt
  },
  body[]{
    ...,
    _type == "inlineImage" => {
      ...,
      "url": asset->url
    },
    _type == "image" => {
      ...,
      "url": asset->url
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
    title, "slug": slug.current, author, category
  }`;
  try {
    const list = await client.fetch(q, { slug: excludeSlug || "" });
    return list || [];
  } catch (e) { console.warn("getRelatedArticles error:", e); return null; }
}

export async function getAboutPage() {
  if (!client) return null;
  const q = `*[_type == "aboutPage"][0]{
    intro, team, contributors, issues, contactBlock
  }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getAboutPage error:", e); return null; }
}

export async function getContactPage() {
  if (!client) return null;
  const q = `*[_type == "contactPage"][0]{
    intro, emails, sections
  }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getContactPage error:", e); return null; }
}
