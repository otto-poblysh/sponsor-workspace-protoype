# Spec: Pan-African Organization Demo (Site + Video, EN/FR/ES)

**Status:** Draft for review
**Date:** 2026-08-20
**Scope:** A 13-page prototype site in three locales, plus a 60-second tutorial video in three locales, for pan-African membership organizations.

---

## Problem Statement

The existing prototype sells a **national labour ministry** story: government oversight of private-sector employment in Equatorial Guinea. Pan-African membership organizations — chambers of commerce, business councils, industry federations, development bodies — are a different buyer with a different motive. They are not regulators. They want to **create jobs in their community**, and the lever is giving member companies free recruitment software in exchange for the aggregate employment data that lets the organization plan training, partnerships and programmes.

Demoing the ministry prototype to that buyer forces them to translate every screen in their head — "Ministry Users" is not their team, "Registered Employers" is not their membership, and Equatorial Guinea is not their region. The pitch lands as a government tool being retrofitted, which is exactly the objection this demo exists to pre-empt.

Cost of not solving it: every pan-African conversation spends its first ten minutes on framing instead of value, and the two capabilities that actually differentiate the offer for this buyer — the recruiter surface and the job-seeker surface — are not shown at all.

---

## Goals

1. **A pan-African organization sees its own operating model on screen**, not a translated ministry one: member companies, community job seekers, cross-border reach, programme decisions.
2. **The full value loop is demonstrable in one 60-second video** — free software to member companies → jobs posted → talent applies → data flows back → the organization acts on skill-gap evidence.
3. **The two revenue-relevant surfaces are shown for the first time**: what a recruiter at a member company gets, and what a job seeker in the community gets.
4. **Three locales at parity**, with no untranslated string reaching a demo — enforced by the existing build gate, not by eye.
5. **Zero regression to the ministry demo.** It keeps its URLs, its videos and its build, untouched.

---

## Non-Goals

| Not doing | Why |
|---|---|
| **Restructuring the ministry site into `sites/ministry/`** | Symmetry is tidier but breaks working URLs and touches a shipped deploy for no benefit today. Revisit as a standalone move if a third site appears. |
| **Sharing one English source across both sites** | See *Architecture*. The two sites diverge in geography, data and narrative, not just vocabulary. Coupling them saves little and creates cross-site bugs. |
| **A working application** | Static prototype only. No backend, no auth, no real job data. Same constraint as the ministry demo. |
| **Reproducing the live demo pixel-for-pixel** | We rebuild the two new pages locally so we control vocabulary and demo data. Fidelity target is "recognisably the same product", not a clone. |
| **Portuguese, Arabic or Swahili** | Deliberately deferred. PT arguably covers more of the continent than ES, but ES reuses the ministry glossary and is the confirmed ask. The locale list is a config array — adding one later is a catalog, not a code change. |
| **A second video format (shorts, social cuts)** | One 60s cut per locale, matching the ministry deliverable. Re-cutting is cheap once the beats exist. |

---

## Architecture

### The central decision: fork the source, share the tooling

The tempting alternative is to treat *audience* as a second axis — ministry English as the base, an `org-vocabulary` catalog layered on top, then locales on top of that. The existing substitution engine would do this today, unmodified.

**Rejected, for four reasons:**

1. **The data change is semantic, not lexical.** Equatorial Guinea → Ethiopia changes cities, regions, sectors, currency, company names, person names, and the row values those imply — together, coherently. A find-and-replace catalog cannot keep a dataset internally consistent.
2. **Two pages have no base to derive from.** The seeker and recruiter surfaces do not exist in the ministry set.
3. **The narrative differs.** "National compliance oversight" and "we give our members free software and get data back" are different arguments, so page copy differs meaningfully rather than mechanically.
4. **Chained generation compounds failure.** base → org-en → org-fr means a missing org key silently leaves *ministry* wording inside a French page, and the coverage gate would have to run per stage to catch it.

**Decision:** `pan-african-org/en/` is its own source of truth. Everything expensive is shared: the generator, the coverage gate, the catalog validator, the video pipeline, the subtitle pass, the poster tool, and the charset fix.

### Seed once, then cut the cord

To avoid hand-editing 11 pages from scratch, use the substitution engine **as a one-time seeding tool**:

1. Write a throwaway `i18n/org-seed.json` mapping ministry terms to organization terms.
2. Run the existing generator over the ministry pages with that catalog to produce a first draft of `pan-african-org/en/`.
3. **Commit the output as a real source and delete the seed.**

Fast start, no permanent coupling. The seed is scaffolding, not infrastructure — the spec treats any later use of it as a defect.

### Directory layout

Both sites end up structurally identical; the organization site is simply nested.

```
/  /fr  /es              ministry site            (UNCHANGED)
tutorial-video{,-fr,-es} ministry videos          (UNCHANGED)
tools/                   shared build tooling     (parameterised)

pan-african-org/
  en/                    13 pages — SOURCE OF TRUTH
  fr/  es/               GENERATED — do not hand-edit
  i18n/                  own catalogs, glossary.md, do-not-translate.json
  video-en/              video source of truth
  video-fr/ video-es/    GENERATED
```

### Tooling changes required

`buildAll()` already takes `srcDir`, `outDir`, `i18nDir`, `locales`, `pages` — only the CLI entry hardcodes the repo root. Two small changes:

- **`--site <dir>` on the CLI entries** of `build-i18n.js`, `check-i18n.js`, `validate-catalogs.js`, `extract-i18n.js`, defaulting to the repo root so ministry behaviour is unchanged.
- **Explicit-`en/` support in `rewriteToggleLinks`.** It currently assumes English sits at the site root (`../${page}` from a locale dir). With an explicit `en/`, all three locales are siblings and every cross-link is `../<locale>/<page>`. Add an `englishDir` option defaulting to `null` (current behaviour).

Everything else — `translateHtml`, `translateSubtitles`, `withGeneratedHeader`, `attachPoster` — is reused as-is.

> **Carry the charset fix forward.** The generated-file banner must sit *after* `<!DOCTYPE html>`. Placing it first makes the HyperFrames loader treat the file as a fragment, drop `<meta charset="UTF-8">` and decode as Latin-1, corrupting every accented character in the FR/ES videos. This is already fixed in `withGeneratedHeader`; the new site must not reintroduce it.

---

## Page Inventory

All 11 ministry pages map cleanly. One improves: *Regional Coverage* means considerably more for a body with cross-border membership than for a single ministry.

| # | File | Ministry name | Organization name |
|---|---|---|---|
| 1 | `index.html` | Dashboard | **Network Dashboard** |
| 2 | `entities.html` | Registered Employers | **Member Companies** |
| 3 | `jobs-applications.html` | Jobs and Applications | Jobs and Applications |
| 4 | `users-management.html` | Ministry Users | **Organization Team** |
| 5 | `skill-gap.html` | Skill Gap Report | Skill Gap Report |
| 6 | `general-report.html` | Labour Market Reports | **Community Impact Reports** |
| 7 | `activity-logs.html` | Activity Logs | Activity Logs |
| 8 | `tenant-branding.html` | Portal Branding | Portal Branding |
| 9 | `supported-countries.html` | Regional Coverage | **Member Countries** |
| 10 | `report-recipients.html` | Report Recipients | Report Recipients |
| 11 | `notification-preferences.html` | Notification Preferences | Notification Preferences |
| 12 | `seeker-home.html` | — | **Job Seeker Home** (new) |
| 13 | `recruiter-jobs.html` | — | **Recruiter Job List** (new) |

### Core vocabulary map

| Ministry | Organization |
|---|---|
| Ministry of Labour | *(organization name — see Open Question 1)* |
| Labour Market Portal | Community Talent Portal |
| Ministry Administrator | Programme Administrator |
| National overview of… | Network-wide overview of… |
| Registered employers | Member companies |
| Employer status | Membership status |
| Verified / Pending review | Verified / Pending review *(unchanged)* |

The organization name lives in **one** catalog entry plus the do-not-translate list, so swapping it is a two-line change.

---

## The Two New Pages

Both were observed logged in on the live demo on 2026-08-20. They use a **different shell** from the admin console and need their own chrome.

### `seeker-home.html` — Job Seeker Home

Modelled on `org-demo.icubefarm.com/en/home`.

- **Left nav:** Home, Inbox *(badge)*, My Career, Jobs, Entities · footer: WhatsApp Support, Notifications *(badge)*, Settings, user identity
- **Top bar:** brand, inbox, notifications, avatar, **language selector** — the toggle has a natural home here
- **Centre:** job feed of cards — title, `CLOSES IN 8 Days`, work mode + location, employer, Business Unit / Department chips, **Apply** / **Share**, `JOB` tag
- **Right rail:** *Professional Quick Actions* (My Career Profile, PDF Resume Builder, Web Resume Builder, My Job Applications) · *Entity Quick Actions* (Post Job, Manage Users, Entity Dashboard)

### `recruiter-jobs.html` — Recruiter Job List

Modelled on the entity-admin job-list overview.

- **Left nav:** entity name + "Entity Admin" · Home, Inbox, Manage Entity, Users & Roles, Jobs
- **Header:** "Overview" + **Post a Job**
- **Status tabs with counts:** Overview, Active, Draft, Closed, Expired, Trash, All
- **Four KPI tiles:** Active Jobs · Applicants Awaiting Review · Upcoming Pre-Screening Calls · Interview Responses Awaiting Review
- **Two charts:** Job Applications (24H/7D/30D/90D/365D) · Applicants by Recruitment Stage (Applied/Interview/Offer/Rejected)
- **Jobs table:** Title, Posted By, Posted On, Expires On, Sponsored Status, Applicants, Actions

**Two live-demo defects to fix, not replicate:**
- The table header reads **"SPONORED STATUS"** — misspelling of "Sponsored".
- The seeker right rail leaks raw i18n keys: `MYCAREER.RECENTCONVERSATIONS` and `myCareer.recentConversationsEmpty`.

> Worth reporting upstream — both are visible on the live demo today, independent of this work.

---

## Demo Data Plan

**Ethiopia-anchored, multi-country.** Ethiopia carries the majority of rows and the organization's HQ (Addis Ababa); a minority of records sit in other African markets so *Member Countries* and the pan-African framing have something real behind them.

| Dimension | Values |
|---|---|
| Anchor cities | Addis Ababa, Dire Dawa, Hawassa, Bahir Dar, Mekelle, Adama |
| Anchor regions | Oromia, Amhara, Tigray, Sidama, Somali, Afar |
| Secondary markets | Kenya (Nairobi), Ghana (Accra), Rwanda (Kigali), Nigeria (Lagos) |
| Currency | ETB (Birr) for Ethiopian rows; keep figures unit-free where possible |
| Sectors | Manufacturing & textiles, Agriculture & agro-processing, Construction, ICT & business services, Logistics & transport, Tourism & hospitality, Leather & footwear |
| People | Ethiopian given/family name pairs for the anchor set, with a few names from the secondary markets |
| Companies | Invented names, plausible per market, checked against real trading names |

**Ratio target:** roughly 70% Ethiopia / 30% secondary markets, so the anchor is unmistakable while the cross-border story is visible on `supported-countries.html` and in the dashboard's location filter.

**Consistency rule:** the dataset must be internally coherent — a company in Kigali cannot appear under an Ethiopian region, and totals across pages must agree. This is the single largest source of "demo feels fake" defects.

All proper nouns go in `pan-african-org/i18n/do-not-translate.json`, which is **a separate file from the ministry list** (that one is entirely Equatorial Guinea-specific and must not be reused).

---

## Video

Same 60-second shape as the ministry cut — intro (5s), five screencast beats (10s each), outro (5s) — so all three deliverables stay consistent in pacing and the host composition is reused unchanged.

| Beat | Page | Story |
|---|---|---|
| 00 Intro | cover artwork | Organization identity + "for Job Creation" positioning |
| 01 | `index.html` | Real-time employment data across the whole member network |
| 02 | `entities.html` | The member companies under the organization's patronage |
| 03 | **`recruiter-jobs.html`** | A member company posts and manages jobs — free software |
| 04 | **`seeker-home.html`** | Community talent finds and applies across member companies |
| 05 | `skill-gap.html` | Evidence for training, partnership and programme decisions |
| 06 Outro | contact artwork | Contact / customise |

Reports and Activity Logs are deliberately dropped relative to the ministry cut: the recruiter and seeker surfaces *are* the differentiator for this buyer, and adding beats would push past 60s.

---

## User Stories

**Organization executive (demo audience)**
- As a programme director at a pan-African business council, I want to see employment data across my whole membership so that I can judge whether this gives me evidence I do not have today.
- As an executive, I want to see what my member companies actually receive so that I can tell whether the free-software offer is attractive enough for them to adopt.
- As an executive evaluating in French, I want the entire demo in French so that I assess the substance rather than translating as I go.

**Member company recruiter (portrayed in the demo)**
- As a recruiter at a member company, I want to post a job and track applicants in one place so that I can hire without buying recruitment software.

**Community job seeker (portrayed in the demo)**
- As a job seeker, I want to find and apply to jobs across every company in the community so that one profile reaches many employers.

**Presenter**
- As a presenter, I want the organization demo to behave exactly like the ministry demo — same toggle, same nav, same pacing — so that I can run either without relearning it.

**Maintainer**
- As a maintainer, I want the organization site to build with the same commands and the same coverage gate so that I do not maintain two pipelines.
- As a maintainer, I want ministry output to be byte-identical after this work so that I know the shared tooling changes were safe.

---

## Requirements

### P0 — Must have

**R1. Multi-site tooling, ministry unchanged**
`--site <dir>` on the four CLI entries; `englishDir` option on `rewriteToggleLinks`.

*Acceptance:*
- [ ] Given `npm run i18n:build` with no `--site`, then ministry `/fr` and `/es` output is byte-identical to what is committed today
- [ ] Given `--site pan-african-org`, then the generator reads `pan-african-org/en` and `pan-african-org/i18n` and writes `pan-african-org/{fr,es}`
- [ ] Given an explicit `en/`, then a toggle on `fr/entities.html` links to `../en/entities.html` and `../es/entities.html`
- [ ] Given the full existing test suite, then it passes unchanged

**R2. Thirteen English pages with organization vocabulary**
Seeded via `org-seed.json`, then committed as source; the seed is deleted in the same change.

*Acceptance:*
- [ ] Given any page, then no ministry-only term ("Ministry of Labour", "Ministry Users", "Registered Employers") appears
- [ ] Given any page, then no Equatorial Guinea proper noun from the ministry DNT list appears
- [ ] Given the repo after this task, then `i18n/org-seed.json` does not exist
- [ ] Given `pan-african-org/en/index.html`, then nav, brand and user identity use organization vocabulary throughout

**R3. Ethiopia-anchored multi-country dataset**

*Acceptance:*
- [ ] Given all 13 pages, then roughly 70% of location-bearing rows are Ethiopian and the remainder are from the named secondary markets
- [ ] Given `supported-countries.html`, then it lists the secondary markets as member countries
- [ ] Given any company row, then its city and region are geographically consistent
- [ ] Given the dashboard and `entities.html`, then member-company totals agree

**R4. Two new persona pages**

*Acceptance:*
- [ ] Given `seeker-home.html`, then it renders the left nav, job feed and both quick-action panels described above
- [ ] Given `recruiter-jobs.html`, then it renders the status tabs with counts, four KPI tiles, two charts and the jobs table
- [ ] Given `recruiter-jobs.html`, then the table header reads "Sponsored Status" — the live demo's misspelling is not reproduced
- [ ] Given either page, then no raw i18n key (`SOMETHING.SOMETHING`) is visible
- [ ] Given either page at 1920×1080 and 768px, then no element overflows its container

**R5. FR and ES at full coverage**
Own catalogs, own glossary, own DNT list.

*Acceptance:*
- [ ] Given `npm run i18n:check --site pan-african-org`, then it exits zero with no untranslated strings
- [ ] Given one string removed from a catalog, then the check exits non-zero naming the string and file
- [ ] Given any FR or ES page, then no informal address (`tu` / `tú`) appears
- [ ] Given the ES catalogs, then terminology matches the existing ministry ES glossary wherever a term is shared

**R6. Language toggle on all 39 pages**

*Acceptance:*
- [ ] Given any of the 39 pages, then the toggle renders with the current locale active
- [ ] Given `fr/skill-gap.html`, when ES is clicked, then the browser lands on `es/skill-gap.html` — same page, other language
- [ ] Given the site opened over `file://`, then every toggle link resolves

**R7. Video in three locales**

*Acceptance:*
- [ ] Given each of the three projects, then `hyperframes check` reports no finding absent from the ministry baseline
- [ ] Given each rendered file, then it is 1920×1080, 60.0s, with streams h264 + aac + mjpeg(`attached_pic=1`)
- [ ] Given the FR and ES cuts, then no mojibake appears in any frame — generated files open with `<!DOCTYPE html>`
- [ ] Given each cut, then the thumbnail is the scene-00 intro cover
- [ ] Given the intro cover in each locale, then every `.title-line` fits its container at the chosen size

### P1 — Should have

- **R8. Job detail and Post-a-Job pages** — round out both personas; not needed for the 60s cut.
- **R9. Per-locale screenshot capture** for the organization site, mirroring `capture_screenshots.js`.
- **R10. `npm run` scripts** — `org:build`, `org:check`, `org:video:*` so the workflow is discoverable.
- **R11. Upstream defect report** for the two live-demo bugs.

### P2 — Future considerations (design for, do not build)

- **Portuguese** — the locale list stays a config array so PT is catalogs plus one entry, no code change.
- **A third site** — if one appears, revisit `sites/<name>/` symmetry as a standalone migration.
- **Per-market variants** (a Kenya-anchored cut, a Ghana-anchored cut) — keep demo data in a form that could later be data-driven rather than inlined.

---

## Success Metrics

**Leading (verifiable at merge)**
| Metric | Target |
|---|---|
| Untranslated strings across FR/ES | **0** (build gate) |
| Pages per locale | 13 / 13 / 13 |
| Ministry output changed | **0 bytes** |
| Console errors across 39 pages | 0 |
| Broken internal links | 0 |
| Layout overflow findings | 0 |
| Video findings beyond ministry baseline | 0 |

**Lagging (post-launch)**
| Metric | Target | Measured by |
|---|---|---|
| Pan-African demos run in the org site rather than the ministry site | 100% within 30 days | Presenter report |
| "Is this built for government?" objections | 0 | Demo notes |
| Demos run in FR or ES | ≥ 1 within 30 days | Presenter report |
| Time to propagate an English copy edit to all locales | < 5 min | One build plus one changed key |

---

## Open Questions

**Blocking — needed before Phase 2**

1. **Organization name.** Proposed: **Pan-African Enterprise Alliance (PAEA)** — descriptive, plausible, clearly generic. Alternatives: *Continental Enterprise Alliance*, *Africa Workforce Alliance*.
   **This must be checked against real organizations before any external showing.** Several plausible names in this space are taken by real bodies headquartered in Addis Ababa, and a demo carrying a real organization's name would misrepresent them. The name is one catalog entry plus one DNT entry, so swapping it late is cheap — but showing the wrong one is not. *(Owner: stakeholder, with a name check)*

**Non-blocking**

2. **Does the organization brand the portal, or does each member company?** `tenant-branding.html` currently assumes one tenant. For a membership body, per-member branding may be the more compelling story. Assumption: organization-level branding, unchanged. *(Owner: stakeholder)*
3. **Native FR/ES review before render?** Subtitles are the most visible copy in the deliverable. Same recommendation as the ministry videos. *(Owner: stakeholder)*
4. **Commit generated trees and renders, or build at deploy?** Assumption: commit, matching current practice. Renders will add ~10 MB. *(Owner: engineering)*
5. **Do the seeker and recruiter pages get the language toggle in the same place?** Their shell differs — the top bar is the natural home rather than the sidebar foot. Assumption: top bar for these two, sidebar foot for the other eleven. *(Owner: design)*

---

## Timeline and Phasing

| Phase | Work | Depends on |
|---|---|---|
| **0** | Confirm organization name; check it against real bodies | Q1 |
| **1** | Multi-site tooling + tests; prove ministry byte-identical | — |
| **2** | Seed and commit 13 English pages; apply vocabulary | 0, 1 |
| **3** | Ethiopia-anchored dataset across all pages | 2 |
| **4** | Build the two new persona pages | 1 |
| **5** | FR + ES catalogs, glossary, DNT; generate and gate | 2, 3, 4 |
| **6** | Video: script → beats → intro/outro → FR/ES builds | 4, 5 |
| **7** | Render, posters, deliver | 6 |

**Critical path is content, not code.** Phase 1 is small and well understood; Phases 3 and 5 carry the effort. Phase 4 can run in parallel with Phase 3 — the new pages have no dependency on the ministry dataset.

**Suggested cut if time is short:** P0 alone is a complete, demonstrable deliverable. R8–R11 are genuine fast-follows that no demo depends on.

**Prerequisite:** Phase 1 must land and prove ministry output byte-identical before any content work begins. Everything downstream depends on shared tooling that the ministry demo is already using in production.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Chosen organization name collides with a real body | Demo misrepresents a real organization | Name check in Phase 0; name isolated to one catalog entry |
| Shared tooling change regresses the ministry site | Breaks a shipped demo | Byte-equality assertion on ministry output in Phase 1, run in CI |
| Demo dataset is internally inconsistent | Reads as fake in exactly the moment credibility matters | Explicit consistency acceptance criteria in R3; single reviewer pass over totals |
| `org-seed.json` survives and becomes de-facto infrastructure | Reintroduces the coupling this spec rejects | R2 asserts the file is absent after the task |
| Charset bug reintroduced in the new video projects | Every accented character corrupted in FR/ES cuts | `withGeneratedHeader` reused as-is; regression tests already assert doctype-first |
| Two new pages drift from the real product as it evolves | Demo shows something that no longer exists | Accepted — the point is vocabulary control. Re-check against the live demo before each major showing. |
