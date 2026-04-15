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

function renderEmails(emails) {
  if (!Array.isArray(emails) || !emails.length) return "";
  return emails.map((e, i) => `
    <div class="item">
      <span class="label">${e.label || ""}</span>
      <span class="value">${i === 0 ? (e.email || "") : ""}</span>
    </div>
  `).join("");
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
    <aside class="col-right">${renderEmails(data.emails)}</aside>
    ${renderSections(data.sections)}
  `;
}

async function init() {
  if (!SANITY_ENABLED) return;
  const data = await getContactPage();
  if (data) render(data);
}

document.addEventListener("DOMContentLoaded", init);
