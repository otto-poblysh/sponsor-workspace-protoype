# Spanish Localisation Plan

Status: Deferred until English master approval

## Policy

English production is the creative and timing master. Spanish translation must not begin until the English script, storyboard, and edit are approved. This prevents translation work from being repeated while the product story is still changing.

Spanish localisation is not a word-for-word substitution exercise. It must preserve the approved meaning, reading time, institutional register, and visual hierarchy.

## Localisation inputs

Spanish work begins only when the following are locked:

- English `SCRIPT.md`
- English scene timings
- Approved hero-frame snapshots
- Approved Ministry role names
- Approved report names
- Approved claims and illustrative-data language
- Official preference for the Ministry's Spanish institutional name

## Recommended Spanish register

- Formal, direct, and institutionally neutral
- Suitable for senior government leadership
- Avoid marketing superlatives
- Prefer familiar administrative and labour-market terms
- Keep headlines concise enough for silent reading
- Use “empleadores” consistently for private-sector employers
- Confirm whether “vacantes,” “ofertas de empleo,” or another term is preferred by the Ministry
- Confirm official terms for job seekers, regional officers, skills gaps, and employer verification

## Draft terminology glossary

This glossary is provisional and requires Ministry review.

| English source term | Provisional Spanish | Review note |
|---|---|---|
| Ministry of Labour | Ministerio de Trabajo | Confirm whether full official name is required |
| Labour Market Portal | Portal del Mercado Laboral | Confirm institutional preference |
| Registered employers | Empleadores registrados | Confirm employer/company terminology |
| Verified employer | Empleador verificado | Confirm legal/compliance nuance |
| Active vacancies | Vacantes activas | Confirm portal vocabulary |
| Job seekers | Personas demandantes de empleo | May be too long; confirm preferred concise term |
| Applications | Candidaturas / Solicitudes | Confirm local recruitment usage |
| Hard-to-fill roles | Puestos difíciles de cubrir | Appropriate but longer than English |
| Skills gap | Brecha de competencias | Confirm training-department usage |
| Labour Market Summary | Resumen del mercado laboral | Confirm report title |
| Employer Compliance Report | Informe de cumplimiento de empleadores | Confirm legal meaning |
| Private-Sector Vacancy Report | Informe de vacantes del sector privado | — |
| Skills Demand Report | Informe de demanda de competencias | — |
| Director | Director/a | Decide whether neutral generic form is acceptable |
| Administrator | Administrador/a | — |
| Regional Officer | Responsable regional | Confirm organisation title |
| Labour Analyst | Analista del mercado laboral | Longer; reserve layout space |
| Illustrative demo data | Datos ilustrativos de demostración | Confirm legal clarity |

## Workflow

### Stage 1 — Extract the locked English timing sheet

Create a localisation table containing:

- beat number
- English start/end time
- English headline
- English support line
- English metadata labels
- maximum character count by text container
- visual emphasis words

### Stage 2 — First Spanish translation

- Translate for meaning and institutional register.
- Preserve feature, advantage, and benefit distinctions.
- Do not change product figures.
- Mark any line that cannot fit the approved timing.
- Provide concise and literal alternatives for difficult lines.

### Stage 3 — Ministry terminology review

The Ministry reviewer resolves:

- official institution name
- employer terminology
- job-seeker terminology
- vacancy/application terminology
- training and competence vocabulary
- provincial/regional role names
- report titles
- illustrative-data disclaimer

Update the glossary before composition work begins.

### Stage 4 — Timing and layout adaptation

- Replace English copy in duplicated Spanish compositions or a controlled locale layer.
- Preserve scene boundaries wherever possible.
- Use flexible widths and `fitTextFontSize` where appropriate.
- Reduce wording before reducing type below approved minimum sizes.
- Allow Spanish text to wrap naturally; do not force `<br>` breaks.
- Recheck visual hierarchy after every copy replacement.

### Stage 5 — Spanish visual and editorial QA

Run:

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect --samples 15
npx hyperframes snapshot . --at <spanish-hero-frame-times>
```

Review both sound-on and muted playback. The Spanish version requires the same acceptance criteria as the English master.

## Layout-readiness requirements during English production

The English composition must anticipate Spanish before translation begins:

- Reserve 25–35% horizontal expansion for headlines and labels.
- Prefer flexible content containers over fixed heights.
- Avoid headlines placed inside narrow pills.
- Keep role labels and report titles in containers that can expand.
- Do not use hard-coded line breaks for natural-language copy.
- Keep data and text as separate DOM elements so numbers do not move when labels expand.
- Use hero-frame inspection with deliberately long test strings before English lock if a container is tight.

## Localisation acceptance criteria

- Meaning matches the approved English master.
- Terminology is approved by a Ministry reviewer.
- Text can be understood at full playback speed without voiceover.
- No important text falls below the video-safe minimum size.
- No clipping, overlap, or uncontrolled wrapping.
- Product labels remain faithful to the Spanish portal vocabulary chosen for the demo.
- Figures remain identical to the English master unless the product data itself changes.
- Music and scene timing still feel natural.
- Spanish lint, validation, inspect, snapshot, and final presentation-device tests pass.

## Files to create after English approval

```text
minister-product-video/
├── SCRIPT.es.md
├── LOCALIZATION_TIMING.es.csv
├── TERMINOLOGY.es.md
├── compositions-es/
├── snapshots-es/
└── renders/
    └── ministry-labour-portal-es.mp4
```

Do not create these production files before English approval; the current document is the planning record only.
