// Article detail — renders a single article fetched from Sanity (or a mock),
// followed by a "view more" row of 4 other articles.

import {
  getArticle,
  getArticles,
  getRelatedArticles,
  SANITY_ENABLED,
  urlFor,
} from "./sanity-client.js";

const CATEGORY_LABELS = {
  matter: "Matter",
  projects: "Projects",
  letters: "Letters",
  address: "Address a space",
  notes: "Notes",
};

/* -------- Portable Text rendering (paragraphs + inline images) -------- */

function renderSpan(child) {
  const text = (child.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const marks = child.marks || [];
  let out = text;
  if (marks.includes("em"))     out = `<em>${out}</em>`;
  if (marks.includes("strong")) out = `<strong>${out}</strong>`;
  return out;
}

function renderBlock(block, defs) {
  if (block._type !== "block") return "";
  const children = (block.children || []).map(renderSpan).join("");
  const style = block.style || "normal";
  if (style === "h2") return `<h2>${children}</h2>`;
  if (style === "h3") return `<h3>${children}</h3>`;
  if (style === "blockquote") return `<blockquote>${children}</blockquote>`;
  return `<p>${children}</p>`;
}

function renderInlineImage(img) {
  const src =
    img.url ||
    (img.asset && img.asset._ref && urlFor
      ? urlFor(img.asset._ref, 1400)
      : null);
  if (!src) return "";
  const caption = img.caption ? `<span class="cap">${img.caption}</span>` : "";
  const credit  = img.credit  ? `<span class="credit">${img.credit}</span>` : "";
  const meta = (caption || credit) ? `<figcaption>${caption}${credit}</figcaption>` : "";
  return `
    <figure class="inline-image">
      <img src="${src}" alt="${(img.alt || img.caption || "").replace(/"/g, "&quot;")}">
      ${meta}
    </figure>`;
}

function renderBody(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) {
    return `<p class="muted">This article has no body yet. Add content in the Sanity Studio.</p>`;
  }
  return blocks
    .map((b) => {
      if (b._type === "block")       return renderBlock(b);
      if (b._type === "inlineImage") return renderInlineImage(b);
      if (b._type === "image")       return renderInlineImage(b);
      return "";
    })
    .join("\n");
}

/* -------- Meta / header -------- */

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch (_) { return ""; }
}

function renderArticle(a) {
  const root = document.getElementById("article");
  if (!a) {
    root.innerHTML = `
      <div class="article-body">
        <p class="muted">Article not found.</p>
        <p><a href="index.html">Return to the index</a>.</p>
      </div>`;
    return;
  }

  document.title = `${a.title || "Article"} — MPLAN Magazine`;

  const cat  = CATEGORY_LABELS[a.category] || "";
  const date = formatDate(a.publishedAt);

  const coverSrc =
    a.coverUrl ||
    (a.coverImage && a.coverImage.asset && urlFor ? urlFor(a.coverImage.asset._ref, 1600) : null);

  const coverCaption = a.coverImage?.caption || "";
  const coverCredit  = a.coverImage?.credit  || "";
  const coverMeta = (coverCaption || coverCredit)
    ? `<figcaption>${coverCaption ? `<span class="cap">${coverCaption}</span>` : ""}${coverCredit ? `<span class="credit">${coverCredit}</span>` : ""}</figcaption>`
    : "";

  const hero = coverSrc
    ? `<figure class="hero-image">
         <img src="${coverSrc}" alt="${(a.title || "").replace(/"/g, "&quot;")}">
         ${coverMeta}
       </figure>` : "";

  root.innerHTML = `
    <header class="article-header">
      <div class="article-meta">
        ${cat ? `<span class="article-cat">${cat}</span>` : ""}
        ${date ? `<span class="article-date">${date}</span>` : ""}
      </div>
      <h1 class="article-title">${a.title || ""}</h1>
      <div class="article-by">Words by ${a.author || "—"}</div>
    </header>
    ${hero}
    <div class="article-body">
      ${renderBody(a.body)}
    </div>
  `;
}

/* -------- View more -------- */

function toneClass(i) { return "y" + (((i * 3) % 7) + 1); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderViewMore(list) {
  const wrap = document.getElementById("view-more");
  const grid = document.getElementById("view-more-grid");
  if (!grid || !list || !list.length) return;
  grid.innerHTML = "";

  const picks = shuffle(list).slice(0, 4);
  picks.forEach((a, i) => {
    const el = document.createElement("a");
    el.className = "thumb " + toneClass(i);
    if (a.coverUrl) el.classList.add("has-image");
    el.href = `article.html?slug=${encodeURIComponent(a.slug)}`;
    const tileStyle = a.coverUrl
      ? ` style="background-image:url('${a.coverUrl}?w=600&auto=format&q=75')"`
      : "";
    el.innerHTML = `
      <span class="tile"${tileStyle}></span>
      <span class="meta">
        <span class="title">${a.title || ""}</span>
        <span class="author">${a.author || ""}</span>
      </span>`;
    grid.appendChild(el);
  });
  wrap.hidden = false;
}

/* -------- Mock fallback (when CMS is unreachable / empty) -------- */

const MOCK = {
  articles: [
    { slug: "the-sidewalk-is-an-object", title: "The sidewalk is an object", author: "SeungYeon Kim", category: "matter" },
    { slug: "concrete-fade",             title: "Concrete, fade",            author: "Min Park",       category: "matter" },
    { slug: "a-square-without-a-name",   title: "A square without a name",   author: "Stefan Krysa",   category: "projects" },
    { slug: "ground-floor-again",        title: "Ground floor, again",       author: "Claire Scandella", category: "projects" },
    { slug: "letter-from-hackney",       title: "Letter from Hackney",       author: "Ellen Grubbs",   category: "letters" },
    { slug: "address-a-crossing",        title: "Address a crossing",        author: "Chuan Liu",      category: "address" },
    { slug: "notes-from-a-bus",          title: "Notes from a bus",          author: "Spencer Chin-Pok Chan", category: "notes" },
    { slug: "field-notes-april",         title: "Field notes, April",        author: "Min Park",       category: "notes" },
  ],
  articleFor(slug) {
    const base = this.articles.find((x) => x.slug === slug) || {
      slug, title: slug.replace(/-/g, " "), author: "—", category: "",
    };
    return {
      ...base,
      publishedAt: "2026-04-01",
      body: [],
    };
  },
};

/* -------- Init -------- */

async function init() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  if (!slug) { renderArticle(null); return; }

  let data = null;
  if (SANITY_ENABLED) data = await getArticle(slug);
  if (!data) data = MOCK.articleFor(slug);
  renderArticle(data);

  let related = null;
  if (SANITY_ENABLED) related = await getRelatedArticles(slug);
  if (!related || !related.length) {
    related = MOCK.articles.filter((x) => x.slug !== slug);
  }
  renderViewMore(related);
}

document.addEventListener("DOMContentLoaded", init);
