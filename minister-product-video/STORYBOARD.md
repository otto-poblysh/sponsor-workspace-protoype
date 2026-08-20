# Storyboard — English Ministry Product Film

Status: First production draft — exact timing to be confirmed after music selection

**Format:** 1920×1080, 30fps, landscape

**Duration:** 88 seconds target

**Audio:** Gentle instrumental underscore; no voiceover; no vocals

**Language:** English for the first production and approval cycle

**Style basis:** `DESIGN.md` and captured portal assets generated during Production Phase 1

## Global direction

The viewer should experience the portal as a national decision-support system, not as a collection of screens. The film begins with fragmented administrative information, progressively consolidates it into evidence, and concludes with a clear Ministry outcome. Actual interface captures establish product credibility; native HTML cards, counters, filters, highlights, and report objects focus attention on what matters.

Each beat follows this rhythm:

1. **Build:** The Ministry question or dominant feature enters.
2. **Breathe:** The interface remains readable while one ambient motion continues.
3. **Resolve:** The advantage or benefit becomes explicit.
4. **Transition:** The complete visible scene hands off to the next scene; do not pre-fade scene content.

## Global guardrails

- Every visible element receives an entrance via `gsap.from()`.
- No exit animation is used before scene transitions.
- Only the final scene may fade out.
- Use at least three depth layers per beat: background structure, product/content layer, and foreground emphasis.
- Use two focal points per beat: the product action and the benefit statement.
- Use actual portal copy and figures.
- Add `Illustrative demo data` to all statistic-heavy beats.
- Use no more than three dominant data points at once, except the four-card executive reveal in Beat 2.
- Keep entrance sequences below 500ms total stagger where items form one group.
- Persistent screenshots require a subtle pan, push, or crop movement.
- Use literal brand colours from `DESIGN.md`.
- Do not introduce voiceover captions; all text is primary editorial content.

## Transition system

- **Primary transition:** directional push slide, 0.4s, `power2.inOut` — related product capabilities.
- **Topic transition:** focus pull/blur crossfade, 0.6s, `sine.inOut` — changes from oversight to insight or from insight to reporting.
- **Closing transition:** colour dip to Ministry navy, 0.8s, `power1.inOut`.
- Do not mix in unrelated transition styles.

## Music and SFX direction

- Music begins immediately with a warm unresolved pad.
- A restrained pulse enters at Beat 2.
- A modest lift begins at Beat 5 and peaks gently in Beat 7.
- The arrangement simplifies through Beats 8 and 9.
- Beat 10 resolves on a clean final chord.
- Optional SFX: soft paper/report movement, quiet interface click, restrained confirmation chime.
- No keyboard typing noise, large whooshes, notification clutter, or cinematic impacts.

## Beat summary

| Beat | Time | Duration | Ministry question | Dominant feature | Primary benefit |
|---|---:|---:|---|---|---|
| 1 | 0:00 | 6s | How do we overcome fragmented reporting? | Data consolidation metaphor | One national view |
| 2 | 0:06 | 9s | What is happening now? | Executive dashboard | Briefing at a glance |
| 3 | 0:15 | 10s | What is happening in a specific sector or province? | Filters | Faster targeted decisions |
| 4 | 0:25 | 10s | Which employers are reporting reliably? | Employer registry | Coverage and data quality |
| 5 | 0:35 | 11s | Where is recruitment succeeding or stalling? | Vacancies and funnel | Better placement focus |
| 6 | 0:46 | 12s | Which skills are missing? | Skill-gap report | Evidence-based training priorities |
| 7 | 0:58 | 10s | How quickly can we prepare reports? | Report generation | Minutes instead of manual consolidation |
| 8 | 1:08 | 9s | How do different teams work safely? | Roles and permissions | Coordinated access |
| 9 | 1:17 | 7s | Can we trace important actions? | Activity log | Accountability and trust |
| 10 | 1:24 | 4s | What does the Ministry gain? | Ministry promise | Better decisions |

---

## BEAT 1 — FROM FRAGMENTATION TO ONE VIEW (0:00–0:06)

### Concept

The film opens inside an administrative landscape: several small, incomplete employer-report fragments drift across a warm-neutral canvas. They are not chaotic; they are disconnected. A navy organising field moves through them and aligns the fragments into the outline of the portal dashboard, establishing the transformation before the product is fully shown.

### On-screen copy

- `Private-sector employment data is often fragmented.`
- `One Ministry needs one clear national view.`

### Visual description

Five document-like cards represent employer returns, vacancy lists, application totals, regional updates, and training requests. Each enters from a different edge with slight rotation. Fine navy connector lines draw between them, then straighten into a disciplined grid. A cropped dashboard silhouette appears beneath the assembled cards. The Ministry globe mark occupies the upper-left edge; the resolve line anchors the lower-right.

### Assets

- Brand mark from the captured dashboard/sidebar
- Cropped or recreated document/report fragments using real portal labels
- Dashboard capture from `index.html`, initially softened and partially masked

### Techniques

- CSS 3D card depth with restrained rotation
- SVG path drawing for consolidation lines
- Clip-path reveal of the dashboard silhouette

### Animation choreography

- Brand mark **settles** from scale 0.88 with `expo.out` at 0.2s.
- Fragment cards **drift in** from varied directions over 0.55–0.75s with three different eases.
- Headline **resolves** from a narrow masked crop at 0.55s.
- Connector paths **draw** between 1.2s and 2.2s.
- Cards **align** into the dashboard grid between 2.3s and 3.2s.
- Dashboard silhouette **reveals** beneath them at 3.0s.
- Resolve line **rises** at 3.8s and remains readable through the transition.

### Depth layers

- BG: bone surface, faint oversized word `EMPLOYMENT`, quiet radial navy tint.
- MG: dashboard silhouette and connector paths.
- FG: document fragments, headline, resolve line, Ministry mark.

### Transition

Focus pull into the now-sharp dashboard. The blurred dashboard in Beat 1 becomes the clear product frame in Beat 2. Duration 0.6s.

### Audio

Warm sustained pad. One soft consolidation chime as the cards align.

---

## BEAT 2 — THE NATIONAL PICTURE (0:06–0:15)

### Concept

The product becomes authoritative and clear. Rather than showing the complete web page at small scale, the camera travels across four enlarged KPI tiles that assemble into one national summary. The viewer should feel that a morning ministerial briefing is already prepared.

### On-screen copy

- `Now, the Ministry can see the national picture.`
- `386 REGISTERED EMPLOYERS`
- `1,126 ACTIVE VACANCIES`
- `18,742 JOB SEEKERS`
- `6,408 APPLICATIONS`
- `A current executive briefing—at a glance.`

### Visual description

The dashboard capture fills the background at a 3° perspective, with the sidebar still recognisable. Four KPI cards detach from the screen and float forward as native HTML recreations. Values count up in sequence; their short context lines appear afterward. A thin navy horizontal rule joins the cards and resolves into the benefit tag.

### Assets

- Full dashboard capture from `index.html`
- Native HTML recreations of the four KPI tiles
- Ministry mark and portal title

### Techniques

- CSS 3D screen plane with slow camera push
- Tabular numeric counter animation
- Proportional fill under each KPI to give the numbers visual weight

### Animation choreography

- Dashboard plane **pushes forward** from scale 0.94 at 6.2s.
- Headline **slides in** from the left at 6.35s.
- KPI cards **lift** from the screen with a 90ms stagger starting at 6.7s.
- Values **count up** between 7.0s and 8.5s.
- Context fills **grow** from 0 to their final proportions.
- Benefit tag **locks to the rule** at 10.2s.
- The dashboard continues a 2% scale push during the reading hold.

### Depth layers

- BG: full dashboard capture with warm neutral overlay.
- MG: enlarged KPI cards and joining rule.
- FG: headline, benefit tag, illustrative-data label.

### Transition

Directional push left. The KPI row travels off as the filter bar from Beat 3 enters from the right. Duration 0.4s.

### Audio

Light rhythmic pulse enters. Four muted ticks accompany the counter completions.

---

## BEAT 3 — ASK A PRECISE QUESTION (0:15–0:25)

### Concept

The national view becomes an analytical instrument. A clean oversized filter bar becomes the dominant object; selecting sector, province, and period visibly narrows the labour-market picture. The scene demonstrates speed without relying on a busy cursor tutorial.

### On-screen copy

- `Ask a precise question.`
- `SECTOR · CONSTRUCTION`
- `PROVINCE · LITORAL`
- `PERIOD · LAST 30 DAYS`
- `See the answer immediately.`
- `Faster regional and sector decisions.`

### Visual description

Three enlarged filter controls occupy the left two-thirds. A restrained cursor moves once per control. On each selection, a connected results panel on the right reorganises: employer count, active vacancies, and hard-to-fill roles change. The map reference remains abstract and administrative—a province label and coverage bar rather than a decorative geographic map.

### Assets

- Dashboard filter bar capture
- Native HTML filter controls matching the portal
- Cropped KPI/result cards

### Techniques

- CSS mask for dropdown reveals
- Deterministic cursor motion path
- Numeric morph/counter and bar-width changes

### Animation choreography

- Headline **anchors** from x:-60 with `expo.out` at 15.2s.
- Filter controls **cascade** upward with varied scale, y, and opacity entrances.
- Cursor **glides** to Construction; dropdown **unfolds** and selection **stamps** at 16.8s.
- Cursor **moves** to Litoral and selection **confirms** at 18.2s.
- Period selection **snaps** into place at 19.3s.
- Result cards **recalculate** and proportional bars **refill** between 19.5s and 20.7s.
- Resolve and benefit lines **appear in sequence** at 21.0s and 22.0s.

### Depth layers

- BG: faint dashboard grid and Ministry navy radial field.
- MG: filter controls and result panel.
- FG: cursor, selected-value chips, benefit statement.

### Transition

Directional push upward. The filter controls become the header region of the Registered Employers screen. Duration 0.4s.

### Audio

Three quiet interface clicks. Music remains restrained and even.

---

## BEAT 4 — A TRUSTED EMPLOYER NETWORK (0:25–0:35)

### Concept

The platform connects insight to the organisations supplying employment data. Employer records arrive as controlled, verifiable entries rather than disconnected contacts. Verification, pending review, and onboarding progress communicate both coverage and governance.

### On-screen copy

- `Build a trusted network of reporting employers.`
- `VERIFIED`
- `PENDING REVIEW`
- `ONBOARDING 85%`
- `Improve reporting coverage, follow-up, and data quality.`

### Visual description

The Registered Employers screen fills the frame. Three employer rows detach and expand: Bioko Marine Services, Litoral Obras, and Annobón Eco Tours. A status badge travels along a short process line from Registered to Review to Verified. The onboarding bar fills to 85%. A fine metadata panel shows sector and workforce size to reinforce structured data.

### Assets

- Capture from `entities.html`
- Native HTML employer rows and progress bar
- Portal status badges

### Techniques

- Row extraction from screenshot into native cards
- SVG process-line drawing
- Progress-bar fill with tabular percentage counter

### Animation choreography

- Employer screen **enters** from y:80 with `power3.out` at 25.2s.
- Headline **reveals** from a horizontal crop.
- Three employer rows **separate** from the table with a 110ms stagger.
- Bioko status **advances** to Verified and glows once in semantic green.
- Litoral onboarding bar **fills** to 85%.
- Annobón status **settles** at Pending Review in gold.
- Benefit line **draws onto** a navy footer band at 31.2s.

### Depth layers

- BG: employer screen and faint province/sector labels.
- MG: extracted employer rows and process line.
- FG: status badges, progress indicator, benefit band, illustrative-data label.

### Transition

Focus pull. Employer rows soften while vacancy cards become sharp. Duration 0.6s.

### Audio

Soft confirmation tone on Verified. No alarm tone for pending review.

---

## BEAT 5 — RECRUITMENT PERFORMANCE (0:35–0:46)

### Concept

Vacancy activity becomes a flow the Ministry can observe. Applicants move through a simplified funnel while hard-to-fill roles remain visibly constrained. The scene balances progress with the need for intervention.

### On-screen copy

- `See where recruitment moves—and where it stalls.`
- `6,408 APPLICANTS`
- `1,628 SHORTLISTED`
- `982 OFFERS ACCEPTED`
- `814 HIRED`
- `186 hard-to-fill roles need attention.`

### Visual description

The left side shows four broad funnel stages with navy fills moving toward green at Hired. The right side shows three vacancy cards—Offshore Safety Technician, Industrial Electrician, and Heavy Equipment Mechanic—with applicant counts. The first vacancy receives a restrained shortage-red outline because it has only two applicants. A thin flow line visually connects vacancy demand to the funnel.

### Assets

- Capture from `jobs-applications.html`
- Recruitment funnel data from dashboard and jobs page
- Native HTML vacancy cards and funnel stages

### Techniques

- Sequential bar-fill animation
- Counter morph between funnel stages
- SVG flow path connecting vacancy cards to outcomes

### Animation choreography

- Headline **lands** from slight scale and letter-spacing compression at 35.2s.
- Vacancy cards **slide** from the right with varied y offsets.
- Funnel outline **draws** from left to right.
- Applicant count **counts** to 6,408; subsequent stages **fill** to their proportions.
- Hired stage **settles** in green at 39.8s.
- Hard-to-fill vacancy **receives** its red outline and `2 APPLICANTS` callout.
- Constraint statement **anchors** beneath the vacancy cards at 42.0s.

### Depth layers

- BG: light field with oversized faint word `PLACEMENT` and subtle flow lines.
- MG: funnel and vacancy cards.
- FG: stage counts, hard-to-fill callout, illustrative-data label.

### Transition

Directional push left. Funnel bands become the horizontal skill supply/demand bars in Beat 6. Duration 0.4s.

### Audio

Music gains a modest percussive lift. One low, restrained note marks the hard-to-fill reveal.

---

## BEAT 6 — FROM DEMAND TO TRAINING PRIORITIES (0:46–0:58)

### Concept

The Ministry sees not only that vacancies are hard to fill, but which capabilities are constrained. Demand and supply become physical, comparable bars. Recommended training interventions appear as a direct response to observable gaps.

### On-screen copy

- `Turn employer demand into training priorities.`
- `INDUSTRIAL ELECTRICAL SYSTEMS · SHORTAGE`
- `WELDING & FABRICATION · SHORTAGE`
- `COMMERCIAL DRIVING · TIGHT`
- `Align programmes with the skills employers need.`

### Visual description

Three skill rows dominate the frame. Each shows a navy demand bar and a lighter supply bar with a semantic shortage or tight badge. A small training recommendation card grows from the end of each constrained row, visually linking evidence to action. The underlying Skill Gap Report remains visible as an authentic product context.

### Assets

- Capture from `skill-gap.html`
- Native HTML skill rows and badges
- Training recommendation cards based on current portal copy

### Techniques

- Comparative supply/demand bar animation
- Masked badge reveal
- Motion-path link from shortage to training recommendation

### Animation choreography

- Skill Gap screen **clarifies** from blur at 46.2s.
- Headline **rises** at 46.35s with `expo.out`.
- Skill labels **enter** from alternating sides.
- Demand bars **fill** first; supply bars **follow** 180ms later.
- Shortage badges **stamp** without bounce at 49.0s.
- Training cards **grow** from the constrained end points.
- Resolve line **writes on** beneath the complete comparison at 53.0s.
- The bars maintain a subtle 2px breathing movement during the hold, driven by the composition timeline.

### Depth layers

- BG: Skill Gap Report capture with softened nonessential content.
- MG: comparative bars and recommendation cards.
- FG: badges, headline, resolve line, illustrative-data label.

### Transition

Topic focus pull. Skill rows compress into clean report-template rows. Duration 0.6s.

### Audio

Music reaches its analytical lift. A soft chime marks each training recommendation, mixed low.

---

## BEAT 7 — REPORTS IN MINUTES (0:58–1:08)

### Concept

This is the operational payoff. Four report templates assemble quickly; one is selected, generated, and delivered as a polished report object. The scene must make speed tangible without presenting an unrealistic loading sequence.

### On-screen copy

- `Generate clear ministerial reports in minutes.`
- `LABOUR MARKET SUMMARY`
- `EMPLOYER COMPLIANCE`
- `PRIVATE-SECTOR VACANCIES`
- `SKILLS DEMAND`
- `PDF · EXCEL · CSV`
- `Less consolidation. More time for analysis.`

### Visual description

The Labour Market Reports screen appears on the left. Four template cards cascade into a vertical stack. A single format control selects PDF. The chosen Labour Market Summary card slides through a navy processing band and emerges as a clean document cover with Ministry mark, date, and report title. Excel and CSV formats remain as secondary options.

### Assets

- Capture from `general-report.html`
- Native report-template cards
- Native generated-report cover using Ministry identity

### Techniques

- Staggered card assembly
- Clip-path processing band
- CSS 3D document emergence with gentle page depth

### Animation choreography

- Headline **enters** from x:-80 at 58.2s.
- Report cards **cascade** with a 70ms stagger.
- Format selector **unfolds** and PDF **confirms** at 60.2s.
- Selected report **travels** through the navy band.
- Completed report **emerges** with slight rotation and settles flat at 62.0s.
- `PDF · EXCEL · CSV` **appears** as a mono metadata line.
- Benefit statement **expands** across the lower third at 64.0s.

### Depth layers

- BG: report screen and faint document grid.
- MG: template cards and processing band.
- FG: finished report cover, format line, benefit statement.

### Transition

Directional push upward. The report document moves upward and reveals the Ministry Users table below. Duration 0.4s.

### Audio

Modest musical peak. Soft paper movement and a clean confirmation chime as the report resolves.

---

## BEAT 8 — THE RIGHT ACCESS FOR EVERY TEAM (1:08–1:17)

### Concept

The platform is presented as shared institutional infrastructure. Four Ministry roles enter around the same product core, each with a clearly bounded responsibility. The mood is coordinated rather than restrictive.

### On-screen copy

- `Give every Ministry team the access it needs.`
- `DIRECTOR`
- `ADMINISTRATOR`
- `REGIONAL OFFICER`
- `LABOUR ANALYST`
- `One platform. Clear responsibilities.`

### Visual description

A simplified Ministry Users panel sits at centre-right. Four role chips enter from the frame edges and connect to relevant portal modules: leadership dashboard, employer administration, regional coverage, and reports. Permission indicators illuminate only the applicable modules for each role. The scene ends with all roles connected to one portal core.

### Assets

- Capture from `users-management.html`
- Cropped navigation/module icons from the portal
- Native role chips and permission connections

### Techniques

- SVG connector drawing
- Controlled role-to-module highlighting
- CSS depth shift between active and inactive permissions

### Animation choreography

- Portal core **settles** from scale 0.92 at 68.2s.
- Headline **reveals** from left.
- Director chip **enters** first, followed by Administrator, Regional Officer, and Labour Analyst in importance order.
- Connectors **draw** to their modules with a 100ms stagger.
- Relevant module icons **lift** and brighten; unrelated modules remain quiet but visible.
- Resolve line **anchors** below the completed network at 73.0s.

### Depth layers

- BG: Ministry Users screen and subtle navigation map.
- MG: portal core and role chips.
- FG: connection lines, module highlights, resolve line.

### Transition

Directional push left. Connection lines become the horizontal rules of the Activity Log table. Duration 0.4s.

### Audio

Arrangement begins to simplify. Four soft ticks accompany role connections.

---

## BEAT 9 — VISIBLE AND ACCOUNTABLE (1:17–1:24)

### Concept

The final feature beat demonstrates institutional trust. Important actions arrive as immutable records with actor, time, and result. Rather than feeling like surveillance, the scene communicates responsible administration.

### On-screen copy

- `Keep every important action visible and accountable.`
- `EMPLOYER VERIFIED`
- `REGIONAL ACCESS UPDATED`
- `REPORT GENERATED`
- `Stronger oversight. Greater institutional trust.`

### Visual description

Three Activity Log rows expand to fill the frame. Timestamps and actors appear in Geist Mono. A small lock mark and an unbroken rule suggest immutability. Each action receives a concise semantic result: verified, updated, generated. The lower benefit line appears only after all three records are visible.

### Assets

- Capture from `activity-logs.html`
- Native log rows using current portal entries
- Lock/check icon from Phosphor or captured icon asset

### Techniques

- Table-row reveal via clip masks
- SVG unbroken-rule draw
- Metadata type-on effect without simulated keyboard sound

### Animation choreography

- Headline **enters** at 77.2s with a calm opacity and y offset.
- Lock mark **settles** from scale 0.9.
- Log rows **unmask** left-to-right with 120ms stagger.
- Timestamps **type on** quickly while action labels **rise** separately.
- Unbroken audit rule **draws** beneath all rows.
- Benefit line **appears** at 81.0s and holds fully visible into the closing transition.

### Depth layers

- BG: activity-log capture and faint timestamp pattern.
- MG: enlarged log rows and audit rule.
- FG: lock mark, headline, benefit line.

### Transition

Colour dip to Ministry navy. Duration 0.8s. The log rules contract into the closing card divider.

### Audio

Percussion recedes. One restrained confirmation tone as the audit rule completes.

---

## BEAT 10 — THE MINISTRY PROMISE (1:24–1:28)

### Concept

The product interface disappears, leaving the institutional outcome. The end card is calm, spacious, and decisive. The language arrives in three measured parts, followed by the portal signature.

### On-screen copy

- `Better data.`
- `Faster reports.`
- `Better employment decisions.`
- `Ministry of Labour · Labour Market Portal`

### Visual description

A full Ministry navy field fills the frame with a restrained lighter radial glow behind the text. The globe mark appears at the upper-left. Three promise phrases align along one structural rule, not as a centred floating stack. The signature anchors the lower-right. The final frame holds long enough to register before fading to navy.

### Assets

- Ministry globe mark
- Portal wordmark recreated with Geist Sans and Geist Mono

### Techniques

- Kinetic phrase sequencing
- Structural-rule drawing
- Very subtle music-reactive glow if approved

### Animation choreography

- Navy field **resolves** from the transition.
- Globe mark **settles** at 84.2s.
- `Better data.` **appears** first with `expo.out`.
- `Faster reports.` **follows** with a different x entrance.
- `Better employment decisions.` **expands** from a mask and receives the strongest visual weight.
- Signature **rises** at 86.0s.
- Final scene may **fade gently** toward deep navy in the last 0.5s.

### Depth layers

- BG: navy field and localised glow.
- MG: structural rule and ghosted word `EMPLOYMENT`.
- FG: promise phrases, mark, and signature.

### Transition

Final fade only. No following scene.

### Audio

Resolved final chord with gentle decay.

---

## Asset audit table

Paths will be replaced with actual capture paths after Production Phase 1.

| Source | Type | Assigned beats | Role | Status |
|---|---|---:|---|---|
| `index.html` | Dashboard page | 1, 2, 3 | National view, KPI cards, filters | Capture required |
| `entities.html` | Employer page | 4 | Employer verification and onboarding | Capture required |
| `jobs-applications.html` | Recruitment page | 5 | Vacancies and funnel context | Capture required |
| `skill-gap.html` | Skills page | 6 | Demand, supply, shortage, recommendations | Capture required |
| `general-report.html` | Reports page | 7 | Templates, formats, generated report | Capture required |
| `users-management.html` | Roles page | 8 | Ministry roles and permissions | Capture required |
| `activity-logs.html` | Audit page | 9 | Immutable action history | Capture required |
| `supported-countries.html` | Coverage page | 3, 8 | Provincial scope and regional access | Capture required |
| Portal globe mark | Brand asset | 1, 10 | Opening and closing identity | Extract required |
| Geist Sans / Mono | Fonts | All | Brand typography and data | Download/localise required |
| Music track | Audio | All | Timing and emotional continuity | Select/license required |

## Planned production architecture

```text
minister-product-video/
├── index.html
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
├── PRODUCTION_PLAN.md
├── CONTENT_MATRIX.md
├── ASSET_AUDIT.md
├── REVIEW_PLAN.md
├── LOCALIZATION_PLAN.md
├── capture/
│   ├── screenshots/
│   ├── assets/
│   │   ├── fonts/
│   │   └── svgs/
│   └── extracted/
├── audio/
│   ├── music-master.wav
│   ├── music-source-license.txt
│   └── audio-data.js
├── compositions/
│   ├── beat-01-problem.html
│   ├── beat-02-national-dashboard.html
│   ├── beat-03-filters.html
│   ├── beat-04-employers.html
│   ├── beat-05-recruitment.html
│   ├── beat-06-skills.html
│   ├── beat-07-reports.html
│   ├── beat-08-roles.html
│   ├── beat-09-accountability.html
│   └── beat-10-close.html
├── snapshots/
└── renders/
```

## Storyboard approval checklist

- [ ] Every beat answers a Ministry question.
- [ ] Every demonstrated feature exists in the current prototype.
- [ ] Feature, advantage, and benefit remain distinct.
- [ ] The film can be understood with music muted.
- [ ] The portal is recognisable in every product beat.
- [ ] No data is implied to be official.
- [ ] Music direction suits a ministerial presentation.
- [ ] English copy has sufficient reading time.
- [ ] Spanish expansion has been considered in layout plans.
- [ ] The closing promise is approved.
