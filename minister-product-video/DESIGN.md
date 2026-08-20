# Design System — Ministry of Labour Product Film

Status: Provisional, derived from the current portal HTML. Confirm against HyperFrames capture artifacts during Production Phase 1.

## Overview

The Ministry of Labour Market Portal uses a light, institutional interface with white and warm-neutral surfaces, fine borders, compact information cards, and a restrained navy accent. The design communicates administrative clarity rather than consumer-style promotion. Information is organised through a fixed sidebar, KPI tiles, filter bars, tables, status badges, and bento-style report sections. The product film should preserve this visual identity while enlarging and simplifying individual elements for projected video.

## Colors

- **Canvas**: `#FFFFFF` — primary interface and video surface.
- **Warm Surface**: `#F9F9F8` — cards and soft section contrast.
- **Bone Background**: `#F7F6F3` — overall warm neutral background.
- **Border**: `#EAEAEA` — quiet structural rules and card outlines.
- **Primary Text**: `#111111` — headings and high-priority content.
- **Secondary Text**: `#787774` — supporting copy and labels.
- **Tertiary Text**: `#A5A29A` — de-emphasised metadata; use only at safe video sizes and validated contrast.
- **Ministry Navy**: `#1E3A5F` — primary accent, navigation, emphasis, and transitions.
- **Navy Deep**: `#172E4C` — hover/depth tone and closing card variation.
- **Verified Green**: `#346538` on `#EDF3EC` — verified employers and positive outcomes.
- **Attention Gold**: `#956400` on `#FBF3DB` — warnings, tight supply, and review states.
- **Shortage Red**: `#9F2F2D` on `#FDEBEC` — shortages, suspensions, and critical constraints.
- **Information Blue**: `#1F6C9F` on `#E1F3FE` — neutral informational context.

## Typography

- **Primary UI and statement font**: Geist Sans variable, weights 300–900.
- **Data and metadata font**: Geist Mono variable, weights 400–700.
- Use Geist Sans 800–900 for principal ministerial statements.
- Use Geist Sans 300–400 for supporting language.
- Use Geist Mono for statistics, dates, counts, filters, and labels.
- Use `font-variant-numeric: tabular-nums` for every animated or aligned number.
- Video headline range: 64–96px.
- Major statistic range: 84–132px.
- Supporting statement range: 28–38px.
- Data label minimum: 18px.
- No important projected text below 20px unless validated at target display size.

## Elevation

Depth comes from warm surface shifts, thin `#EAEAEA` borders, restrained rounded corners, and very soft shadows rather than glassmorphism or dramatic perspective. Video compositions may use a slightly stronger shadow beneath enlarged interface cards so they remain distinguishable during motion, but the treatment must still feel native to the portal. Localised navy radial glows may appear behind major transitions; full-screen linear gradients should be avoided.

## Components

- **Ministry App Shell**: white sidebar with navy globe mark and grouped navigation.
- **Executive KPI Tiles**: bordered cards containing a label, large tabular number, directional delta, and short context line.
- **Labour-Market Filter Bar**: date, sector, province, status, and workforce-size controls.
- **Employer Verification Table**: employer name, sector, workforce size, status, onboarding progress, and action.
- **Recruitment Funnel**: proportional stages from applicant to hired outcome.
- **Skill Supply/Demand Table**: requested skills, available profiles, and gap-state badges.
- **Hard-to-Fill Roles List**: role labels paired with applicant counts and low-fill bars.
- **Report Template Cards**: report name, description, output format, and generation action.
- **Regional Coverage Matrix**: province-level participation and reporting controls.
- **Activity Log**: timestamped, immutable administrative actions.
- **Role and Permission Table**: Ministry Director, Administrator, Regional Officer, and Labour Analyst access.

## Video adaptation rules

- Isolate one to three interface elements per hero frame.
- Crop screenshots around the feature being discussed.
- Rebuild key statistics and simple controls in HTML when animation or legibility requires it.
- Preserve original labels and data relationships.
- Add a small “Illustrative demo data” label to data-heavy beats.
- Use Ministry navy as the dominant connective colour across scenes.
- Keep the interface light for most of the film; reserve a full navy field for the closing promise.

## Do's

- Use warm white, fine borders, and disciplined spacing.
- Use navy to lead the eye and establish authority.
- Use semantic green, gold, and red only for their portal meanings.
- Enlarge interface details instead of displaying the entire page at once.
- Use structural rules and split frames to create visual paths.
- Keep animation confident, measured, and readable.

## Don'ts

- Do not introduce neon cyan, purple technology gradients, or black “futuristic” canvases.
- Do not use glitch, VHS, aggressive shader distortion, or rapid strobing.
- Do not use generic stock imagery when the product interface can tell the story.
- Do not place six or more equal cards on screen as a video composition.
- Do not use pie charts, dense legends, multi-axis charts, or chart-library visuals.
- Do not imply that illustrative demo figures are official statistics.
- Do not reduce copy to website-sized text.
