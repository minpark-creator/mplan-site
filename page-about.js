// About page — overrides the static HTML with Sanity content if configured.

import { getAboutPage, SANITY_ENABLED, urlFor } from "./sanity-client.js";

// Always-on grey note under the Contributors section. Not editor-removable
// on purpose — the masthead contributors list has long been paired with
// this general invitation, and we want it to survive any CMS edit.
const CANONICAL_CONTRIB_NOTE =
  "and architects, photographers, writers, researchers, students and friends. MPLAN is open to proposals; see the Contact page for submissions.";

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

// CMS-authored grey notes, filtered to a section. Each note picks its
// placement in Studio ("afterTeam" / "afterContributors" / "afterIssues").
function renderNotes(notes, placement) {
  if (!Array.isArray(notes)) return "";
  return notes
    .filter(n => n && n.placement === placement && n.text)
    .map(n => `<p class="note">${escapeHtml(n.text).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

  // Team + contributors come from the most recent issue that has them
  // set. Older issues stay archived on their own documents in Studio.
  const team         = about.latestIssue?.team;
  const contributors = about.latestIssue?.contributors;

  grid.innerHTML = `
    <section class="col-left">
      ${portableToParagraphs(about.intro) || ""}
    </section>
    <aside class="col-right">
      ${renderSideImage(about.sideImage)}
    </aside>
    ${team ? `
      <section class="section">
        <h3>Team</h3>
        <p>${linesToBr(team)}</p>
        ${renderNotes(about.notes, "afterTeam")}
      </section>` : ""}
    ${contributors ? `
      <section class="section">
        <h3>Contributors</h3>
        <p>${linesToBr(contributors)}</p>
        <p class="note">${CANONICAL_CONTRIB_NOTE}</p>
        ${renderNotes(about.notes, "afterContributors")}
      </section>` : ""}
    ${about.issues ? `
      <section class="section">
        <h3>Issues</h3>
        <p>${linesToBr(about.issues)}</p>
        ${renderNotes(about.notes, "afterIssues")}
      </section>` : ""}
  `;
}

async function init() {
  if (!SANITY_ENABLED) return;
  const data = await getAboutPage();
  if (data) render(data);
}

document.addEventListener("DOMContentLoaded", init);
