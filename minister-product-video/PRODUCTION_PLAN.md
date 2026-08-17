# Detailed Production Plan

## 1. Production objective

Create an approximately 88-second, 1920×1080, silent product film that can be played during a Ministry presentation. The film must explain the Ministry of Labour Market Portal without requiring a live narrator and must show how different Ministry roles use the platform to obtain reports and labour-market insights faster.

The core message is:

> From private-sector employment data to ministerial decisions—in minutes.

The final argument follows a clear chain:

> Employer data → national visibility → faster reporting → better training and employment decisions.

## 2. Audience and presentation context

### Primary audience

- Minister of Labour
- Vice Minister, Secretary General, or equivalent senior leadership
- Directors responsible for employment, training, inspection, statistics, or social security

### Secondary audience

- Labour-market analysts
- Regional or provincial officers
- Employer-registration and compliance teams
- IT and portal administrators
- Programme and implementation partners

### Viewing conditions

- Presented on a conference-room display or projector
- May be played before or during a live product demonstration
- May be viewed without sound, despite gentle music being included
- Must remain understandable without voiceover or presenter commentary
- Must use large, concise English text in the first production cycle

## 3. Deliverables

### English approval package

1. HyperFrames Studio preview of the 88-second English master
2. English storyboard and on-screen script
3. Hero-frame snapshots for every beat
4. One standard-quality review MP4 after preview approval
5. One high-quality 1920×1080, 30fps final MP4 after final sign-off
6. Editable HyperFrames source project

### Optional derivatives after the master is approved

- 30-second executive summary
- Silent lobby/pre-roll loop
- Spanish-language master using the approved English edit
- English and Spanish versions with alternative ending cards for specific events

## 4. HyperFrames skills and how they are used

This production is governed by the following installed skills:

### `hyperframes:website-to-hyperframes`

Owns the seven-gate pipeline:

1. Capture and understand the current portal
2. Confirm `DESIGN.md`
3. Finalise the English `SCRIPT.md`
4. Finalise `STORYBOARD.md`
5. Adapt timing to music instead of generating voiceover
6. Build modular compositions
7. Lint, validate, inspect, snapshot, preview, and deliver

Its capture workflow will create a local asset inventory from the actual portal rather than relying on manually reconstructed screenshots.

### `hyperframes:hyperframes`

Defines the composition contract:

- HTML remains the source of truth
- `data-*` timing attributes define clips
- GSAP timelines are deterministic and paused
- every scene has entrance animation
- transitions replace pre-transition exit animations
- visual identity must come from `DESIGN.md`
- music remains a separate audio clip
- validation and layout inspection are mandatory

### `hyperframes:hyperframes-cli`

Used for project setup and quality control:

- `npx hyperframes capture`
- `npx hyperframes lint`
- `npx hyperframes validate`
- `npx hyperframes inspect`
- `npx hyperframes snapshot`
- `npx hyperframes preview`
- `npx hyperframes render` only after explicit approval

### `hyperframes:gsap`

Used for timeline choreography, counters, filters, camera movement, UI highlighting, and deterministic ambient motion. Transform and opacity animation should be preferred over layout-property animation.

### HyperFrames reference guidance

- Typography: establishes video-safe type sizes, font contrast, and tabular numerals.
- Motion principles: establishes build/breathe/resolve pacing and varied easing.
- Transitions: establishes a restrained corporate transition system.
- Data in motion: ensures numbers have visual weight and avoids dense web-dashboard patterns.
- Audio-reactive animation: allows subtle, pre-extracted soundtrack energy to influence selected visual elements without generic waveform graphics.

## 5. Editorial strategy

This is not a click-by-click tutorial. It is an executive product story.

Every feature scene must answer four questions:

1. What Ministry question is being answered?
2. Which platform feature answers it?
3. What operational advantage does that feature create?
4. What institutional benefit does the Ministry receive?

The film should spend more time on outcomes than controls. Interface actions are evidence, not the story itself.

### Narrative arc

1. Fragmented information creates slow decisions.
2. The dashboard creates one national view.
3. Filters let teams ask precise questions.
4. Employer management improves reporting coverage and trust.
5. Vacancy and application data reveals recruitment performance.
6. Skill-gap intelligence connects employer demand to training priorities.
7. Report generation reduces turnaround time.
8. Roles and audit controls enable secure collaboration.
9. The Ministry gains better data, faster reports, and better decisions.

## 6. English-first language policy

- All initial on-screen copy, file names, reviews, and approval notes remain in English.
- English text is written for silent reading, not converted from a voiceover script.
- Copy should use short declarative sentences and familiar Ministry terminology.
- No Spanish text enters composition code until the English edit is approved.
- Spanish production begins from a locked English timing sheet and glossary.
- Text containers must be designed with approximately 25–35% expansion capacity for Spanish.

## 7. Format and technical specification

- Master format: 1920×1080 landscape
- Frame rate: 30fps
- Target duration: 88 seconds, tolerance ±3 seconds
- Audio: gentle instrumental underscore, no voiceover, no vocals
- Audio mix: conservative presentation-room level with a short fade-in and resolved fade-out
- Primary delivery: MP4/H.264
- Composition model: root `index.html` plus one sub-composition per beat
- Source captures: local portal served over HTTP, not `file://`
- Browser rendering: headless Chrome via HyperFrames
- Determinism: no runtime randomness, timers, or Web Audio analysis

## 8. Visual and motion strategy

### Visual register

- Institutional, calm, confident, contemporary
- Light canvas with warm-neutral surfaces and Ministry navy
- Actual portal UI remains recognisable
- Screen captures provide authenticity
- native HTML recreations animate critical numbers and focused controls

### Motion register

- Medium-energy corporate explainer
- Primary transition: directional push slide, 0.35–0.45s
- Topic transition: focus pull/blur crossfade, 0.5–0.65s
- Closing transition: colour dip into the Ministry end card, 0.7–0.9s
- No glitch, VHS, neon, aggressive shader distortion, or rapid trailer editing
- Each beat uses build, breathe, and resolve phases
- No element appears fully formed; every visible element receives an entrance
- No exit animation before scene transitions; the transition performs the hand-off

### Data animation

- Counters animate from zero to target values
- Each metric is paired with a bar, fill, ring, or spatial comparison
- No pie charts, multi-axis charts, dense legends, or full six-panel dashboards
- Present no more than three related measures as the dominant content at once

## 9. Music strategy

### Direction

- 80–95 BPM
- warm pad, restrained piano or marimba-like pluck, light organic percussion
- reassuring and forward-moving rather than triumphant
- no vocals, trailer drums, dramatic drop, or distracting melodic lead

### Musical structure

- 0–6s: quiet unresolved opening
- 6–35s: steady pulse enters under dashboard and employer scenes
- 35–68s: modest lift through recruitment, skills, and reporting
- 68–84s: controlled resolution during roles and accountability
- 84–88s: final chord and gentle decay

### Audio reactivity

If used, pre-extracted music data may subtly drive:

- navy background glow by 5–8%
- emphasis scale on major figures by 2–4%
- divider-line brightness
- transition timing on musical downbeats

Never add equaliser bars, spectrum displays, musical-note icons, rainbow pulses, or strobing.

## 10. Production phases and gates

### Phase 0 — Message alignment

Tasks:

- Review `CONTENT_MATRIX.md`
- Confirm the core promise and audience hierarchy
- Review the English `SCRIPT.md`
- Confirm whether the official Ministry name should be shortened on screen
- Confirm whether the figures are clearly understood as demo data

Gate 0 acceptance:

- Team approves the English message sequence
- Team agrees on approximately 88 seconds
- Team agrees that the film is executive-level, not a tutorial

### Phase 1 — Portal capture and visual audit

Tasks:

1. Serve the prototype locally.
2. Capture every source page listed in `ASSET_AUDIT.md`.
3. Review scroll screenshots, `tokens.json`, visible text, asset descriptions, and animation manifests.
4. Print the required HyperFrames site summary.
5. Reconcile captured tokens with provisional `DESIGN.md`.
6. Update `ASSET_AUDIT.md` with actual generated paths and usage decisions.

Gate 1 acceptance:

- Capture folder exists
- Dashboard and seven supporting screens are available
- All important product visuals have a planned scene assignment
- `DESIGN.md` contains confirmed rather than provisional values

### Phase 2 — Editorial lock

Tasks:

- Revise `SCRIPT.md` using team feedback
- Verify every claim against the prototype
- Lock English on-screen copy
- Finalise scene durations based on reading time and selected music phrases
- Record any required disclaimer for illustrative data

Gate 2 acceptance:

- `SCRIPT.md` status changes to English Copy Locked
- No unresolved feature or benefit claims
- No scene contains more copy than can be read comfortably

### Phase 3 — Music selection and timing map

Tasks:

- Shortlist two or three properly licensed instrumental tracks
- Test approximately 88-second edits
- Select the final English master track
- Document musical downbeats and scene boundaries
- Update `STORYBOARD.md` with exact times
- Pre-extract audio data only if subtle audio reactivity is approved

Gate 3 acceptance:

- Music licence and source are documented
- Final soundtrack file exists under `audio/`
- Scene timing map is locked

### Phase 4 — Composition build

Tasks:

- Scaffold the HyperFrames project
- Build one composition per storyboard beat
- Build each hero frame statically before GSAP animation
- Add entrances, mid-scene activity, and transitions
- Reference captured assets by file path
- Keep music as a separate audio element
- Register every paused timeline in `window.__timelines`

Planned compositions:

```text
compositions/
├── beat-01-problem.html
├── beat-02-national-dashboard.html
├── beat-03-filters.html
├── beat-04-employers.html
├── beat-05-recruitment.html
├── beat-06-skills.html
├── beat-07-reports.html
├── beat-08-roles.html
├── beat-09-accountability.html
└── beat-10-close.html
```

Gate 4 acceptance:

- All ten compositions exist
- No static screenshot remains completely motionless
- All scenes use the approved brand system
- Every scene communicates one principal benefit

### Phase 5 — Technical and visual quality assurance

Run in order:

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect --samples 15
npx hyperframes snapshot . --at <hero-frame-times>
```

Tasks:

- Fix all lint and runtime errors
- Fix or explicitly justify layout warnings
- Resolve contrast failures
- View every hero-frame snapshot
- Run the animation-map script and inspect pacing flags
- Scrub the complete video in HyperFrames Studio

Gate 5 acceptance:

- Lint and validate complete with zero errors
- No unintended overflow or clipping
- All text remains legible on a projected display
- Numbers and labels are internally consistent
- No music or motion distracts from comprehension

### Phase 6 — English review and approval

Tasks:

- Share the active HyperFrames Studio URL
- Conduct the review rounds described in `REVIEW_PLAN.md`
- Apply consolidated feedback
- Obtain English editorial and product sign-off
- Render a standard-quality review MP4 only after preview approval
- Render high-quality final MP4 only after final approval

Gate 6 acceptance:

- English master marked approved
- Locked timing sheet saved
- Final English MP4 accepted
- Spanish production explicitly authorised

### Phase 7 — Spanish localisation

Tasks:

- Follow `LOCALIZATION_PLAN.md`
- Translate from the approved English script
- Conduct Ministry terminology review
- Fit Spanish copy without changing the approved story unless necessary
- Re-run the complete validation and review cycle

Gate 7 acceptance:

- Spanish copy approved by an appropriate reviewer
- Spanish visual QA passes
- Spanish final MP4 accepted

## 11. Roles and decision rights

| Role | Responsibility | Approval authority |
|---|---|---|
| Product owner | Confirms features and workflows are accurate | Product accuracy |
| Ministry subject-matter reviewer | Confirms terminology and institutional relevance | Ministry language and claims |
| Creative lead | Owns story, visual hierarchy, motion, and music direction | Creative execution |
| HyperFrames implementer | Builds compositions and resolves technical issues | Technical readiness |
| Data reviewer | Confirms figures are consistent and labelled as illustrative | Data integrity |
| English copy approver | Locks English on-screen wording | English editorial lock |
| Spanish language reviewer | Approves later Spanish terminology and readability | Spanish editorial lock |
| Final sponsor | Authorises final render and presentation use | Final release |

One person may hold more than one role, but approval categories should remain explicit.

## 12. Risks and mitigations

| Risk | Consequence | Mitigation |
|---|---|---|
| Too much on-screen copy | Silent film becomes difficult to follow | Cap each card at one headline plus one support line; validate reading time |
| Film feels like a tutorial | Senior audience loses the strategic value | Lead every beat with a Ministry question or outcome |
| Demo data is mistaken for official statistics | Credibility or governance concern | Add a discreet “Illustrative demo data” label where appropriate |
| Portal screenshots are too dense | Projected UI becomes unreadable | Crop to focal areas and recreate critical data in native HTML |
| Music feels promotional or overpowering | Reduces institutional tone | Use restrained instrumental mix and review in the actual room if possible |
| Spanish expansion breaks layouts | Rework late in production | Reserve 25–35% text expansion and use flexible containers from the start |
| Multiple reviewers give conflicting notes | Revision churn | Require one consolidated feedback document per review round |
| Feature claims exceed prototype capability | Misrepresentation | Verify every interaction against current HTML before editorial lock |
| Local assets fail during render | Missing frames or fonts | Capture and reference local files; validate all network requests |
| Motion looks acceptable in browser but clips in render | Poor final output | Run lint, validate, inspect, snapshots, and animation map before render |

## 13. Definition of done

The English production is complete when:

- the product story is approved by product and Ministry stakeholders;
- all English text is approved and readable without audio;
- visual identity matches the portal;
- all depicted features exist in the current prototype;
- all statistics are internally consistent and clearly illustrative;
- HyperFrames lint and validate pass with zero errors;
- visual inspection finds no unintended overflow;
- every beat has an approved hero-frame snapshot;
- the Studio preview has been reviewed end-to-end;
- final music use is licensed or otherwise authorised;
- the final 1920×1080 English MP4 is accepted;
- the English source and timing sheet are locked for Spanish localisation.
