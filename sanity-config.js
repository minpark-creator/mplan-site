// ============================================================
//  MPLAN — Sanity CMS configuration
//  ------------------------------------------------------------
//  Fill in your existing Sanity project details below.
//  If Sanity is unreachable or projectId is blank, pages render
//  empty — Sanity is the single source of truth (no mock fallback).
// ============================================================

export const SANITY_CONFIG = {
  projectId: "snlhed6n",  // MPLAN Sanity project
  dataset:   "production", // or "development"
  apiVersion: "2024-01-01",
  useCdn: true,            // set false if you need fresh data in drafts
};
