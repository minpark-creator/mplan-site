# MPLAN Magazine — Claude Code Project Guide

Read this first. It's the canonical onboarding doc for any new Claude
session working on this repo. It tells you what the project is, how
it's wired together, what's been decided and why, and what to watch
out for. When you make significant architectural decisions, update
this file so the next session inherits them.

---

## What this is

**MPLAN Magazine** — independent magazine on urbanism, architecture
and city life, emerging from the Bartlett School of Planning.

- **Public site**: https://mplanmag.com (+ `www.mplanmag.com`)
- **CMS**: https://mplanmag.sanity.studio (Sanity Studio v3, hosted)
- **Repo root**: `/Users/bagmin/Documents/2026/MPLAN mag/website making 2/`

The site is a small, hand-rolled static site (no framework). All
editorial content lives in Sanity; the site fetches it client-side at
load time using `@sanity/client` from an ESM CDN.

---

## Stack

- **Frontend**: plain HTML + ES modules + CSS. No bundler, no build
  step for the public site. Files are served as-is by Vercel.
- **CMS**: Sanity Studio v3 in `studio/` (separate npm project,
  separate deploy).
- **Hosting**:
  - Website → Vercel (auto-deploys on `git push`).
  - Studio  → Sanity hosted (`mplanmag.sanity.studio`), redeployed
    manually with `npm run deploy` from `studio/`.
- **Sanity project**: `projectId: snlhed6n`, `dataset: production`
  (public).

---

## File layout

```
website making 2/
├── CLAUDE.md                  ← you are here
├── index.html                 ← home (article grid)
├── about.html                 ← About — body is empty, JS fills it
├── contact.html               ← Contact — body is empty, JS fills it
├── article.html               ← article detail
├── script.js                  ← home grid + category filter
├── page-about.js              ← renders About from Sanity
├── page-contact.js            ← renders Contact from Sanity
├── article.js                 ← renders article + "view more"
├── sanity-client.js           ← shared: queries, urlFor, thumbUrl,
│                                cmsImageHtml helper
├── sanity-config.js           ← projectId / dataset / apiVersion
├── styles.css
├── vercel.json                ← deploy config + ignoreCommand
└── studio/                    ← Sanity Studio (separate project)
    ├── sanity.config.js       ← sidebar structure + templates
    ├── sanity.cli.js          ← studioHost: "mplanmag"
    ├── package.json
    ├── schemas/
    │   ├── index.js
    │   ├── aboutPage.js       ← singleton
    │   ├── contactPage.js     ← singleton
    │   ├── article.js
    │   └── issue.js
    └── migrations/
        └── assignAllArticlesToIssue01.js   ← one-shot data migration
```

---

## Studio sidebar (current structure)

```
Issues               ← Issue 01, 02, 03 … Each issue holds team + contributors.
Articles             ← All article documents. Each has an `issue` reference.
─────────────────
About page           ← singleton
Contact page         ← singleton
```

This is a deliberately flat structure. We tried nested folders
("Issues" / "Articles by issue" sub-panes) and they made the "+
Create new" intent router collapse all parent panes, which was
confusing. Flat is simpler.

Each article's `issue` field is a Sanity **reference**. To reassign
an article from Issue 01 → Issue 02 in Studio: click the `⋯` menu on
the reference card → "Remove" → the search box reappears → pick a
different issue. (Sanity's reference UX doesn't natively show a "pick
from list" toggle when a value is already set. A custom input
component could fix this if it becomes annoying enough.)

---

## Sanity schemas — essential fields

### `aboutPage` (singleton, `_id: "aboutPage"`)
- `intro` (portable text)
- `sideImage` (object: `asset` (image), `caption`, `credit`, `alt`)
- `team`, `contributors` (text, newline-separated names) — if empty,
  About page falls back to most recent issue's roster.
- `issues` (text)
- `notes[]` (grey footnote blocks with `placement`: afterTeam /
  afterContributors / afterIssues)

### `contactPage` (singleton, `_id: "contactPage"`)
- `intro`, `sections[]`, `contactInfo { email, phone, address }`

### `article`
- `title`, `slug`, `author`, `authorAffiliation`, `authorEmail`
- **`issue`** (reference → `issue`) — which issue this belongs to
- `publishedAt`, `category` (`matter` | `projects` | `letters` |
  `address` | `notes`)
- `excerpt`
- `coverImage` (used ONLY for home grid + "view more" thumbnails —
  intentionally NOT shown on the article detail page)
- `body` (portable text + `inlineImage` blocks)

### `issue`
- `number` (integer; primary sort key)
- `title`, `publishedAt`, `description`
- `team`, `contributors` (per-issue masthead — archived on the issue
  itself; About page surfaces the latest one)

---

## Image rendering — the central pattern

**Every CMS image goes through `cmsImageHtml()`** in `sanity-client.js`.
It returns an HTML string with the full progressive-loading treatment:

- **LQIP blur-up** (tiny base64 placeholder from
  `asset.metadata.lqip`) as the wrapper's background.
- **`aspect-ratio`** from `asset.metadata.dimensions.aspectRatio`
  reserves layout space before the full image decodes (no jump).
- **`loading="lazy"` + `decoding="async"`** on the `<img>`.
- **Fade-in** via `.loaded` class added on `onload`.

GROQ projections use a shared `IMAGE_META` fragment that pulls
`lqip` + `aspectRatio` for every image field. Add new image fields by
including `${IMAGE_META}` in the projection — the rendering is then
automatic.

**Home grid + view-more thumbnails** use their own tile-based DOM
construction (in `script.js` and `article.js`) but follow the same
LQIP + lazy + fade-in pattern.

---

## How public-page rendering works

`about.html` and `contact.html` ship with **empty grid containers**
(just `<div id="about-grid" data-cms="about"></div>`). No static
fallback content. Sanity is the single source of truth.

- On page load, `page-about.js` / `page-contact.js` fetches from
  Sanity and fills the grid.
- If Sanity is unreachable or unconfigured (`SANITY_ENABLED`
  false), the grid stays empty. We accepted this trade-off
  deliberately — having stale static fallback caused a
  flash-of-stale-content problem and required workarounds.

The home page (`index.html`) and article page (`article.html`) work
the same way: empty containers, JS fills them. They each have mock
fallback data in their JS for offline development.

The `data-cms` attribute on About/Contact grids is a semantic marker
only — no CSS/JS depends on it anymore (legacy from a previous FOUC
gate we removed).

---

## Deployment

### Website (Vercel)
- `git push` to main → Vercel auto-builds and deploys.
- `vercel.json` has `ignoreCommand` that skips the deploy if only
  files under `studio/` changed. (See memory note on the gotcha.)
- Custom domains: `mplanmag.com` + `www.mplanmag.com` (HTTPS via
  Vercel-provisioned certs).

### Sanity Studio
```bash
cd studio
npm run deploy
```
Pushes the built Studio bundle to `https://mplanmag.sanity.studio`.
**You must redeploy any time `sanity.config.js` or `schemas/` changes
— the hosted Studio serves a stale bundle until you do.** Hard-reload
(`Shift+Cmd+R`) after deploying.

### Local Studio dev
```bash
cd studio
npm run dev    # opens http://localhost:3333
```

---

## Migrations / one-shot scripts

`studio/migrations/assignAllArticlesToIssue01.js` — assigns every
existing article to Issue 01 (idempotent; safe to re-run). Run with:

```bash
cd studio
npx sanity exec ./migrations/assignAllArticlesToIssue01.js --with-user-token
```

This is the template for any future bulk-data migration: a script
under `studio/migrations/` that imports `getCliClient` from
`sanity/cli`, fetches with GROQ, patches via `client.transaction()`,
and is idempotent by design.

---

## Known gotchas

- **Sanity reference fields** (e.g. `article.issue`) hide the
  search/picker once a value is set. Switching requires `⋯ → Remove`
  first. The field description explains this; don't rip it out.
- **Image schema antipattern** (still present): the image-bearing
  fields (`coverImage`, `sideImage`, `inlineImage`) are defined as
  `type: "object"` with a sub-field literally named `asset` of
  `type: "image"`. This creates double-`asset` paths like
  `sideImage.asset.asset._ref`. The rendering code (`cmsImageHtml`,
  GROQ projections) handles both shapes, but the cleaner fix is to
  make the field itself `type: "image"` and put caption/credit/alt
  as image sub-fields. Migrating would require moving existing data,
  so it's deferred.
- **Studio fallback sidebar**: if the custom structure crashes at
  load, Sanity falls back to listing all document types at the top
  level (you'll see bare `Article` / `Issue` entries). That means
  the config errored — check the browser console.
- **Vercel `ignoreCommand`**: see memory note
  `vercel_ignorecommand_pitfall.md`. Top commit being studio-only
  was skipping web deploys. Now keyed on
  `$VERCEL_GIT_PREVIOUS_SHA`.
- **GROQ template-literal pitfall**: see memory note
  `sanity_client_groq_template_pitfall.md`. Never put backticks
  inside the GROQ template strings in `sanity-client.js`.

---

## Operational notes for the next session

- Project is on Sanity **Free plan** (downgraded from Growth trial).
  `production` dataset is public. Free plan covers everything the
  site uses (public dataset reads + asset uploads + 3 user seats).
- 2 admins on the Sanity project: `0707369@gmail.com` (owner) and
  `mplan.mag@gmail.com` (editorial).
- If `mplan.mag@gmail.com` reports issues uploading images: it's
  almost always (1) HEIC files from iPhone (convert to JPEG first),
  (2) Safari ITP blocking session cookies (use Chrome), or
  (3) a stale session (sign out + back in).

---

## When you make a change

- Touch only what's needed; keep the bundle small.
- Stay vanilla — no framework, no bundler.
- New image rendering? Use `cmsImageHtml()`. New GROQ image field?
  Use `${IMAGE_META}`.
- New Studio structure or schema? Redeploy Studio.
- Update **this file** if you change architecture, file layout, or
  conventions. The point is for the next Claude to land softly.
