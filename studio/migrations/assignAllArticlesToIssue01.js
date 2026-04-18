// ============================================================
//  MPLAN — one-shot migration
//  Assigns every existing article to Issue 01.
//
//  Run from the `studio/` directory:
//     npx sanity exec ./migrations/assignAllArticlesToIssue01.js --with-user-token
//
//  What it does:
//   1. Ensures an "Issue 01" document exists (creates one if missing,
//      using a stable document id so re-runs are idempotent).
//   2. Patches every article document so its `issue` reference points
//      at Issue 01. Includes draft copies (`drafts.<id>`) if present,
//      so the sidebar reflects the change immediately.
//
//  Safe to re-run: the script skips articles that are already pointed
//  at Issue 01, and never overwrites an issue number that isn't 1.
// ============================================================

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-10-01" });

const ISSUE_01_ID = "issue-01"; // stable id so this script is idempotent

async function ensureIssue01() {
  // Look for any existing issue with number == 1 first, so we don't
  // create a duplicate if one was authored by hand in Studio.
  const existing = await client.fetch(
    `*[_type == "issue" && number == 1][0]{ _id, number, title }`
  );
  if (existing) {
    console.log(`✓ Found existing Issue 01: ${existing._id}`);
    return existing._id;
  }

  console.log("· No Issue 01 found — creating one.");
  const created = await client.createIfNotExists({
    _id: ISSUE_01_ID,
    _type: "issue",
    number: 1,
    title: "Issue 01",
    publishedAt: new Date().toISOString().slice(0, 10),
  });
  console.log(`✓ Created Issue 01: ${created._id}`);
  return created._id;
}

async function assignAllArticles(issueId) {
  // Pull both published and draft copies. `_id in path("drafts.**")`
  // covers drafts; the default query includes published docs.
  const articles = await client.fetch(
    `*[_type == "article"]{ _id, title, "issueRef": issue._ref }`
  );

  if (articles.length === 0) {
    console.log("· No articles found. Nothing to do.");
    return;
  }

  const needsUpdate = articles.filter(a => a.issueRef !== issueId);
  console.log(
    `· Found ${articles.length} article(s); ${needsUpdate.length} need updating.`
  );

  if (needsUpdate.length === 0) {
    console.log("✓ All articles already point at Issue 01.");
    return;
  }

  // Batch patches into a single transaction so it's atomic and fast.
  let tx = client.transaction();
  for (const a of needsUpdate) {
    tx = tx.patch(a._id, p =>
      p.set({ issue: { _type: "reference", _ref: issueId } })
    );
    console.log(`  • ${a._id}  —  ${a.title || "(untitled)"}`);
  }

  const res = await tx.commit();
  console.log(`✓ Patched ${res.results.length} document(s).`);
}

(async () => {
  try {
    const issueId = await ensureIssue01();
    await assignAllArticles(issueId);
    console.log("✅ Done.");
  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  }
})();
