// About page — overrides the static HTML with Sanity content if configured.

import { getAboutPage, SANITY_ENABLED } from "./sanity-client.js";

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

function renderContact(block) {
  if (!block) return "";
  const items = [];
  if (block.mail)    items.push(row("Mail", block.mail));
  if (block.address) items.push(row("Address", linesToBr(block.address)));
  if (block.ig)      items.push(row("IG", block.ig));
  return items.join("");
  function row(label, value) {
    return `<div class="item"><span class="label">${label}</span><span class="value">${value}</span></div>`;
  }
}

function render(about) {
  const grid = document.getElementById("about-grid");
  if (!grid || !about) return;

  grid.innerHTML = `
    <section class="col-left">
      ${portableToParagraphs(about.intro) || ""}
    </section>
    <aside class="col-right">
      ${renderContact(about.contactBlock)}
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
