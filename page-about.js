// About page — overrides the static HTML with Sanity content if configured.

import { getAboutPage, SANITY_ENABLED, urlFor } from "./sanity-client.js";

function portableToParagraphs(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks.map(b => {
    if (b._type === "block" && Array.isArray(b.children)) {
      return `<p>${b.children.map(c => c.text || "").join("")}</p>`;
    }
    return "";
  }).join("");
}

function linesToBr(lines) {
  if (Array.isArray(lines)) return lines.filter(Boolean).join("<br>");
  return (lines || "").toString().split(/\r?\n/).filter(Boolean).join("<br>");
}

function renderSideImage(img) {
  if (!img) return "";
  const target = img.asset && img.asset.asset ? img.asset : img;
  const src = urlFor(target, 1200);
  if (!src) return "";
  const alt = (img.alt || img.caption || "").replace(/"/g, "&quot;");
  const cap = img.caption ? `<span class="cap">${img.caption}</span>` : "";
  const cred = img.credit  ? `<span class="credit">${img.credit}</span>` : "";
  const meta = (cap || cred) ? `<figcaption>${cap}${cred}</figcaption>` : "";
  return `
    <figure class="side-image">
      <img src="${src}" alt="${alt}">
      ${meta}
    </figure>`;
}

function render(about) {
  const grid = document.getElementById("about-grid");
  if (!grid || !about) return;

  grid.innerHTML = `
    <section class="col-left">
      ${portableToParagraphs(about.intro) || ""}
    </section>
    <aside class="col-right">
      ${renderSideImage(about.sideImage)}
    </aside>
    ${about.team ? `
      <section class="section">
        <h3>Team</h3>
        <p>${linesToBr(about.team)}</p>
      </section>` : ""}
    ${about.contributors ? `
      <section class="section">
        <h3>Contributors (Issue 01)</h3>
        <p>${linesToBr(about.contributors)}</p>
      </section>` : ""}
    ${about.issues ? `
      <section class="section">
        <h3>Issues</h3>
        <p>${linesToBr(about.issues)}</p>
      </section>` : ""}
  `;
}

async function init() {
  if (!SANITY_ENABLED) return;
  const data = await getAboutPage();
  if (data) render(data);
}

document.addEventListener("DOMContentLoaded", init);
