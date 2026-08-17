# Capture and Asset Audit Plan

Status: Pre-capture plan

This document follows the capture gate in `hyperframes:website-to-hyperframes`. It must be updated with generated file paths and final usage decisions after capture.

## Capture objective

Create a local, reproducible visual inventory of the Ministry of Labour portal. Capture should provide full-page screenshots, design tokens, visible text, font information, icons, and any reusable assets required to build the English product film.

## Capture preparation

1. Confirm the current branch is `codex/equatorial-guinea-ministry-labor-presentation`.
2. Confirm all portal pages load through their navigation links.
3. Serve the repository with a local HTTP server; do not capture the `file://` URL.
4. Use a consistent desktop viewport suitable for the 1920×1080 master.
5. Ensure external fonts and icons load before capture.
6. Capture the application in its default state first.
7. Capture any useful interaction state separately if the capture tool does not preserve it.

## Required source pages

| Priority | Page | URL/path | Production purpose | Required focal states |
|---:|---|---|---|---|
| 1 | Dashboard | `index.html` | Beats 1–3; brand, navigation, KPIs, filters, people, skills, funnel | Default; Construction; Litoral; 30-day filter |
| 2 | Registered Employers | `entities.html` | Beat 4; verification, status, onboarding, employer data | Default; verified row; pending row; register-employer modal |
| 3 | Jobs and Applications | `jobs-applications.html` | Beat 5; vacancy list, hard-to-fill roles, application funnel | Default; Offshore Safety Technician funnel modal |
| 4 | Skill Gap Report | `skill-gap.html` | Beat 6; shortages, supply/demand, recommendations | Default; low-data filter state if visually useful |
| 5 | Labour Market Reports | `general-report.html` | Beat 7; template choice, formats, recent exports | Default; PDF selected; generating/ready state |
| 6 | Ministry Users | `users-management.html` | Beat 8; roles, users, scoped responsibilities | Default; invitation modal if useful |
| 7 | Activity Logs | `activity-logs.html` | Beat 9; immutable records and auditability | Default; employer-verification category filter |
| 8 | Regional Coverage | `supported-countries.html` | Beats 3 and 8; province-level scope | Default; Annobón enabled if a changed state is needed |
| 9 | Notification Preferences | `notification-preferences.html` | Optional governance insert | Employer and report notification groups |
| 10 | Portal Branding | `tenant-branding.html` | Brand confirmation only | Default preview |

## Required HyperFrames capture outputs

After capture, confirm the following exist:

```text
capture/
├── screenshots/
│   └── scroll-*.png
├── assets/
├── extracted/
│   ├── tokens.json
│   ├── visible-text.txt
│   ├── asset-descriptions.md
│   ├── assets-catalog.json
│   ├── animations.json          # if generated
│   ├── lottie-manifest.json     # if generated
│   ├── video-manifest.json      # if generated
│   └── detected-libraries.json  # if generated
└── AGENTS.md
```

## Mandatory review sequence

Following `hyperframes:website-to-hyperframes`, review and summarise:

1. Every scroll screenshot, beginning with `scroll-000.png`.
2. `tokens.json`: top colours, font families/weights, section counts, headings, and CTAs.
3. `visible-text.txt`: validate hierarchy and source copy.
4. `asset-descriptions.md`: identify useful screenshots, icons, logos, and illustrations.
5. `animations.json`, if present.
6. Any Lottie/video/shader manifests, if present.

The required site summary must be printed and then recorded here:

- **Site:** _To be completed after capture_
- **Colors:** _To be completed after capture_
- **Fonts:** _To be completed after capture_
- **Sections:** _To be completed after capture_
- **Key assets:** _To be completed after capture_
- **Vibe:** _To be completed after capture_

## Provisional asset assignments

| Asset/source | Beat | Role | Treatment | Final captured path |
|---|---:|---|---|---|
| Dashboard full view | 1, 2 | Product reveal and national context | Perspective plane, slow 2–4% push | TBD |
| Dashboard KPI cards | 2 | Executive metrics | Recreate in HTML for counters | TBD |
| Dashboard filter bar | 3 | Demonstrate precise questions | Recreate controls; use capture as context | TBD |
| Employer table | 4 | Reporting network | Extract three rows; recreate status/progress | TBD |
| Jobs table | 5 | Vacancy context | Crop around priority roles | TBD |
| Application funnel | 5 | Recruitment outcomes | Native HTML proportional fills | TBD |
| Skills table | 6 | Gap evidence | Crop background; recreate three comparisons | TBD |
| Training recommendations | 6 | Connect evidence to action | Native HTML cards | TBD |
| Report templates | 7 | Faster reporting | Extract/recreate four rows | TBD |
| Generated report cover | 7 | Tangible result | Design a portal-consistent HTML document | New asset |
| Ministry Users table | 8 | Roles | Crop and recreate role chips | TBD |
| Activity Log | 9 | Accountability | Extract/recreate three rows | TBD |
| Globe mark | 1, 10 | Brand recognition | Opening and closing | TBD |
| Geist Sans | All | Statement/UI typography | Use local captured font file | TBD |
| Geist Mono | All | Data/meta typography | Use local captured font file | TBD |

## Asset-use rules

- Reference local capture assets by path; do not inline downloaded SVG source unnecessarily.
- Do not rely on Google Fonts or external font URLs during final composition rendering.
- Use actual screenshots for authenticity and HTML recreation for focus and motion.
- Avoid stock photography unless the team later requests a human-context opening.
- Do not show personal applicant data.
- Mask or omit any non-demo email address that could be interpreted as real personal information.
- Maintain aspect ratio and use `object-fit: cover` for full-frame capture treatment.
- Add `crossorigin="anonymous"` to any external media retained temporarily during development.

## Music and audio asset record

Complete before production Gate 3:

| Field | Value |
|---|---|
| Track title | TBD |
| Composer/library | TBD |
| Source URL or licence reference | TBD |
| Licence type | TBD |
| Permitted presentation use confirmed | No |
| Permitted derivative/localised use confirmed | No |
| Master file path | TBD |
| Duration/edit | TBD |
| BPM | TBD |
| Key downbeats | TBD |
| Audio-reactive data extracted | No |

## Capture completion checklist

- [ ] All priority 1–8 pages captured.
- [ ] External fonts and icons rendered correctly.
- [ ] Every scroll screenshot viewed.
- [ ] Design tokens reconciled with `DESIGN.md`.
- [ ] Visible copy checked against `SCRIPT.md`.
- [ ] Assets assigned to beats with real file paths.
- [ ] At least 50% of useful product screenshots are assigned or explicitly skipped.
- [ ] Globe mark appears in both opening and closing plans.
- [ ] No sensitive personal data is included.
- [ ] Site summary recorded above.
