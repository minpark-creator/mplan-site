// Contact page — overrides the static HTML with Sanity content if configured.

import { getContactPage, SANITY_ENABLED } from "./sanity-client.js";

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

function renderContactInfo(info) {
  if (!info) return "";
  const rows = [];
  if (info.email)   rows.push(row("Email",   info.email));
  if (info.phone)   rows.push(row("Phone",   info.phone));
  if (info.address) rows.push(row("Address", linesToBr(info.address)));
  return rows.join("");
  function row(label, value) {
    return `<div class="item"><span class="label">${label}</span><span class="value">${value}</span></div>`;
  }
}

function renderSections(sections) {
  if (!Array.isArray(sections)) return "";
  return sections.map(s => `
    <section class="section">
      <h3>${s.heading || ""}</h3>
      ${portableToParagraphs(s.body)}
    </section>
  `).join("");
}

function render(data) {
  const grid = document.getElementById("contact-grid");
  if (!grid || !data) return;

  grid.innerHTML = `
    <section class="col-left">${portableToParagraphs(data.intro)}</section>
    <aside class="col-right">${renderContactInfo(data.contactInfo)}</aside>
    ${renderSections(data.sections)}
  `;
}

// Contact page content is owned by Sanity — there's no static HTML
// fallback, so we just fetch and render. If the fetch fails or Sanity
// isn't configured, the grid stays empty (deliberate: Sanity is the
// single source of truth).
async function init() {
  if (!SANITY_ENABLED) return;
  const data = await getContactPage();
  if (data) render(data);
}

document.addEventListener("DOMContentLoaded", init);
