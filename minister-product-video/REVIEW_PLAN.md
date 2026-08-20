# English Review and Approval Plan

Status: Ready for team use

## Review principle

The team should approve the message before judging animation polish. Feedback is collected in deliberate rounds so product corrections, editorial corrections, and visual preferences do not compete in one unstructured review.

One named coordinator must consolidate feedback for each round. The implementation team should not act on parallel chat messages from multiple reviewers unless the coordinator includes them in the consolidated review.

## Review roles

| Reviewer | Primary responsibility |
|---|---|
| Product owner | Feature and workflow accuracy |
| Ministry subject-matter reviewer | Institutional relevance and terminology |
| Data reviewer | Figure consistency and illustrative-data treatment |
| English copy approver | Clarity, brevity, and executive tone |
| Creative reviewer | Story, hierarchy, pacing, motion, and music |
| Technical reviewer | HyperFrames integrity, rendering, layout, and performance |
| Final sponsor | Release approval |

## Round 0 — Strategy alignment

Review:

- `PRODUCTION_PLAN.md`
- `CONTENT_MATRIX.md`
- Beat summary in `STORYBOARD.md`

Questions:

1. Does the film answer the Minister's likely questions?
2. Is the platform positioned as decision support rather than software administration?
3. Are faster reporting, training alignment, employer coverage, and accountability the right priority benefits?
4. Is 88 seconds appropriate for the meeting agenda?
5. Is anything strategically important missing?

Output:

- Approved narrative arc
- Confirmed priority order
- Named reviewers and coordinator

## Round 1 — English copy review

Review:

- `SCRIPT.md`
- Claims policy in `CONTENT_MATRIX.md`

Method:

- Read the script silently at the planned timings.
- Mark only copy, terminology, and claim issues.
- Do not comment on animation before storyboard approval.

Questions:

1. Can every headline be understood on its own?
2. Does each benefit sound relevant to Ministry leadership?
3. Are any phrases too promotional or absolute?
4. Is “in minutes” appropriate?
5. Should the full official Ministry name appear in the close?
6. Is “Illustrative demo data” sufficiently clear?

Acceptance criteria:

- No unresolved product claims
- No paragraph-length screen copy
- Terminology approved
- English copy status set to Copy Locked

## Round 2 — Storyboard and hero-frame review

Review:

- Full `STORYBOARD.md`
- One static hero-frame snapshot per beat

Method:

- Judge the most visible moment of each scene before judging motion.
- Review on a large screen where possible.
- Verify that every frame has one dominant feature and one dominant benefit.

Questions:

1. Is the correct part of the product visible?
2. Is all important text legible from presentation distance?
3. Does the interface still look like the actual portal?
4. Is any frame too dense or too sparse?
5. Does semantic colour retain its meaning?
6. Is the illustrative-data label visible but unobtrusive?

Acceptance criteria:

- All ten hero frames approved
- No unresolved content hierarchy problem
- No use of unapproved assets or visual styles

## Round 3 — Motion and music review

Review:

- HyperFrames Studio preview
- Sound-on and fully muted playbacks

Method:

1. Watch once without pausing and without music.
2. Watch once with music.
3. Scrub scene boundaries.
4. Rewatch only scenes with documented concerns.

Questions:

1. Is the film completely understandable while muted?
2. Is reading time comfortable?
3. Does motion direct attention or compete with it?
4. Do transitions clarify continuity and topic changes?
5. Does the music feel appropriate for a Ministerial presentation?
6. Are any counters or interactions too fast to understand?

Acceptance criteria:

- No unreadable scene
- No distracting audio or animation
- Scene timing locked
- Studio preview approved for technical QA

## Round 4 — Technical QA

Required checks:

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect --samples 15
npx hyperframes snapshot . --at <approved-hero-frame-times>
```

Also run the HyperFrames animation-map script and examine:

- tween summaries
- dead zones
- lifecycle flags
- collisions
- off-screen elements
- unexpectedly invisible elements
- pacing under 0.2s or over 2s

Acceptance criteria:

- Zero lint errors
- Zero validation errors
- No unjustified overflow or contrast warning
- Every local asset resolves
- Every timeline is registered and deterministic
- No infinite repeat
- No pre-transition scene exit animation
- All snapshots match approved hero frames

## Round 5 — English final approval

Review:

- Standard-quality review MP4
- Studio preview remains available for scrubbing

Questions:

1. Is the MP4 visually and editorially identical to the approved preview?
2. Is sound level appropriate?
3. Does playback work on the presentation device?
4. Is the final frame held long enough?
5. Are all data and claims approved?

Output:

- English master approval
- Authorisation for high-quality render
- Locked English script and timing sheet
- Explicit authorisation to begin Spanish localisation

## Feedback format

Use one row per issue:

| Time/beat | Category | Current state | Requested change | Reason | Priority | Approver |
|---|---|---|---|---|---|---|
| Example: 0:46 / Beat 6 | Copy | “training priorities” | Keep | Correct Ministry emphasis | — | Ministry reviewer |

Categories:

- Strategy
- Product accuracy
- Data
- Copy
- Visual design
- Motion
- Music/audio
- Technical
- Localisation readiness

Priorities:

- **P0:** Incorrect, misleading, broken, or unusable
- **P1:** Required before approval
- **P2:** Improvement if schedule permits
- **P3:** Preference; does not block approval

## Change control after English lock

- Copy changes after timing lock require a reading-time check.
- New features after storyboard approval require scene-scope review.
- Music replacement after motion build may require retiming all transitions.
- A change to a headline must be reflected in `SCRIPT.md`, `STORYBOARD.md`, and composition HTML.
- Approved English timing is the source for Spanish production.

## Presentation-room acceptance test

Before final delivery:

- Test the MP4 on the actual or equivalent presentation computer.
- Confirm the projector/TV preserves readable contrast.
- Confirm no network connection is required for playback.
- Confirm audio is audible but unobtrusive.
- Confirm playback starts and ends cleanly.
- Keep a muted backup MP4 if the room audio is unreliable.
- Keep the HyperFrames source and a standard MP4 backup on separate storage.
