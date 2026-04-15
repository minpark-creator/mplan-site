// ============================================================
//  MPLAN — Sanity CMS configuration
//  ------------------------------------------------------------
//  Fill in your existing Sanity project details below.
//  The site will fall back to the local mock content (in
//  script.js / about.html / contact.html) whenever Sanity is
//  not reachable or `projectId` is left blank.
// ============================================================

export const SANITY_CONFIG = {
  projectId: "snlhed6n",  // MPLAN Sanity project
  dataset:   "production", // or "development"
  apiVersion: "2024-01-01",
  useCdn: true,            // set false if you need fresh data in drafts
};
