// About page — overrides the static HTML with Sanity content if configured.

import { getAboutPage, SANITY_ENABLED, cmsImageHtml } from "./sanity-client.js";

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

// Zero-padded issue number ("1" -> "01"). Keeps the archive label in sync
// with the Studio preview ("Issue 01", "Issue 02" …).
function issueLabel(iss) {
  if (!iss) return "";
  const num = iss.number != null ? String(iss.number).padStart(2, "0") : "—";
  const year = iss.publishedAt ? new Date(iss.publishedAt).getFullYear() : "";
  const bits = [`Issue ${num}`];
  if (iss.title) bits.push(iss.title);
  if (year)      bits.push(String(year));
  return bits.join(" · ");
}

// Past-issue archive. Each entry is a <details> so the About page stays
// short by default but every issue's full roster is one click away.
function renderPastIssues(pastIssues) {
  if (!Array.isArray(pastIssues) || pastIssues.length === 0) return "";
  const items = pastIssues.map(iss => {
    if (!iss) return "";
    const hasTeam = !!iss.team;
    const hasCon  = !!iss.contributors;
    if (!hasTeam && !hasCon) return "";
    const label = escapeHtml(issueLabel(iss));
    const teamBlock = hasTeam ? `
          <div class="past-issue-block">
            <h4>Team</h4>
            <p>${linesToBr(iss.team)}</p>
          </div>` : "";
    const conBlock = hasCon ? `
          <div class="past-issue-block">
            <h4>Contributors</h4>
            <p>${linesToBr(iss.contributors)}</p>
          </div>` : "";
    return `
      <details class="past-issue">
        <summary>${label}</summary>
        <div class="past-issue-body">
          ${teamBlock}
          ${conBlock}
        </div>
      </details>`;
  }).join("");
  if (!items.trim()) return "";
  return `
    <section class="section past-issues">
      <h3>Past issues</h3>
      <p class="note">Click an issue to view its team and contributors.</p>
      ${items}
    </section>`;
}

function renderSideImage(img) {
  if (!img) return "";
  const media = cmsImageHtml(img, 1200);
  if (!media) return "";
  const cap  = img.caption ? `<span class="cap">${img.caption}</span>` : "";
  const cred = img.credit  ? `<span class="credit">${img.credit}</span>` : "";
  const meta = (cap || cred) ? `<figcaption>${cap}${cred}</figcaption>` : "";
  return `
    <figure class="side-image">
      ${media}
      ${meta}
    </figure>`;
}

function render(about) {
  const grid = document.getElementById("about-grid");
  if (!grid || !about) return;

  // Current masthead: prefer the About page's own team / contributors
  // fields. If an editor leaves those empty, fall back to the most
  // recent Issue document that has a roster set. Older issues always
  // stay archived on their own documents and surface in the
  // "Past issues" drop-down at the bottom of the page.
  const team         = about.team         || about.latestIssue?.team;
  const contributors = about.contributors || about.latestIssue?.contributors;

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
    ${renderPastIssues(about.pastIssues)}
  `;
}

// About page content is owned by Sanity — there's no static HTML
// fallback, so we just fetch and render. If the fetch fails or Sanity
// isn't configured, the grid stays empty (deliberate: Sanity is the
// single source of truth).
async function init() {
  if (!SANITY_ENABLED) return;
  const data = await getAboutPage();
  if (data) render(data);
}

document.addEventListener("DOMContentLoaded", init);
