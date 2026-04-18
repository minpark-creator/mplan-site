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

// Pull out LQIP + aspectRatio from any shape we project in GROQ. Every
// image field goes through one of three shapes:
//   1. { asset: { ..., lqip, aspectRatio } }            — top-level image fields
//      (coverImage, sideImage).
//   2. { asset: { asset: {...}, ..., lqip, aspectRatio } } — body `inlineImage`
//      wrapper whose inner `asset` carries the real asset ref + metadata.
//   3. { asset, hotspot, crop, lqip, aspectRatio }      — bare portable-text
//      image blocks.
// This helper normalizes to { lqip, aspectRatio } so callers don't care.
function extractImageMeta(image) {
  if (!image) return { lqip: "", aspectRatio: null };
  const nested = image.asset && image.asset.asset ? image.asset : null;
  const lqip =
    (nested && nested.lqip) ||
    (image.asset && image.asset.lqip) ||
    image.lqip ||
    "";
  const aspectRatio =
    (nested && nested.aspectRatio) ||
    (image.asset && image.asset.aspectRatio) ||
    image.aspectRatio ||
    null;
  return { lqip, aspectRatio };
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Render any CMS image as an HTML string with LQIP blur-up + native
// lazy loading. Use this for every image on the public site so each
// one gets the same progressive loading treatment for free.
//
//   cmsImageHtml(img, 1400, { alt: "Fallback alt", className: "side-image" })
//
// Accepts any of the image-shaped objects returned by our queries.
// Wrapper carries the LQIP as background + an explicit aspect-ratio so
// layout is reserved before the full image decodes, killing the
// placeholder → high-res "jump". The full <img> is `loading="lazy"`
// and fades in via the `loaded` class added on decode.
export function cmsImageHtml(image, width = 1200, opts = {}) {
  if (!image) return "";
  const target = image.asset && image.asset.asset ? image.asset : image;
  const src = urlFor(target, width);
  if (!src) return "";
  const { lqip, aspectRatio } = extractImageMeta(image);
  const alt = escapeAttr(image.alt || image.caption || opts.alt || "");
  const cls = opts.className ? ` ${opts.className}` : "";
  const style = [
    aspectRatio ? `aspect-ratio:${aspectRatio}` : "",
    lqip        ? `background-image:url('${lqip}')` : "",
  ].filter(Boolean).join(";");
  return `<span class="cms-img${cls}"${style ? ` style="${style}"` : ""}>` +
    `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"` +
    ` onload="this.classList.add('loaded')">` +
    `</span>`;
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

// Reusable projection for any image field. Pulls:
//   • the asset ref + hotspot/crop so @sanity/image-url respects the
//     editor's framing,
//   • the auto-generated LQIP blob (tiny base64 placeholder used as a
//     blurred background while the full image loads), and
//   • the asset's aspectRatio so the image wrapper can reserve layout
//     space and display the LQIP at the correct shape (no reflow when
//     the full image decodes).
const IMAGE_META = `
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio
`;

// Cover image projection used across grid + view-more + article detail.
const COVER_IMAGE_PROJECTION = `coverImage{
  caption, credit, alt,
  asset{
    ...,
    hotspot, crop,
    ${IMAGE_META}
  }
}`;

const ARTICLE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  author,
  authorAffiliation,
  authorEmail,
  category,
  publishedAt,
  excerpt,
  ${COVER_IMAGE_PROJECTION},
  body[]{
    ...,
    // Inline images carry their own image field under `.asset`, which in
    // turn has the real Sanity asset reference under `.asset.asset`.
    _type == "inlineImage" => {
      ...,
      asset{
        ...,
        hotspot, crop,
        ${IMAGE_META}
      }
    },
    // Bare image blocks: the asset ref is directly on the block itself.
    _type == "image" => {
      ...,
      hotspot, crop,
      ${IMAGE_META}
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
    ${COVER_IMAGE_PROJECTION}
  }`;
  try {
    const list = await client.fetch(q, { slug: excludeSlug || "" });
    return list || [];
  } catch (e) { console.warn("getRelatedArticles error:", e); return null; }
}

export async function getAboutPage() {
  if (!client) return null;
  // team + contributors are pulled from the most recent issue that has
  // those fields populated — this way the About page always reflects
  // the current masthead, and past issues stay archived on their own
  // issue documents in Studio. `pastIssues` surfaces every older issue
  // that has a roster so the About page can expose them as collapsible
  // "view roster" panels at the bottom of the page.
  const q = `*[_type == "aboutPage"][0]{
    intro, issues,
    team, contributors,
    notes[]{ text, placement },
    sideImage{
      caption, credit, alt,
      asset{
        ...,
        hotspot, crop,
        ${IMAGE_META}
      }
    },
    "issuesWithRoster": *[_type == "issue" && (defined(team) || defined(contributors))]
      | order(number desc){
        _id, number, title, publishedAt, team, contributors
      }
  }`;
  try {
    const data = await client.fetch(q);
    if (data && Array.isArray(data.issuesWithRoster)) {
      data.latestIssue = data.issuesWithRoster[0] || null;
      data.pastIssues  = data.issuesWithRoster.slice(1);
    }
    return data;
  } catch (e) { console.warn("getAboutPage error:", e); return null; }
}

export async function getContactPage() {
  if (!client) return null;
  const q = `*[_type == "contactPage"][0]{
    intro, sections,
    contactInfo{ email, phone, address }
  }`;
  try { return await client.fetch(q); } catch (e) { console.warn("getContactPage error:", e); return null; }
}
