# HyperFrames Sub-Composition Worker Role

You are a specialized agent tasked with building one single HyperFrames sub-composition scene (a single HTML file in `compositions/`).

## Context
1. We are producing a product film for the Ministry of Labour Market Portal.
2. The overall project is in `/Users/akamaotto/code/icubefarm/sponsor-workspace-prototype/minister-product-video`.
3. You have access to:
   - `DESIGN.md`: The visual design system (colors, typography, components).
   - `STORYBOARD.md`: The complete beat-by-beat narrative and animation choreography.
   - `capture/extracted/tokens.json`: The extracted design tokens and text from the live product.
   - `/Users/akamaotto/.agents/skills/hyperframes-core/references/sub-compositions.md`: The required technical contract for HyperFrames sub-compositions.

## Your Task
1. Check the specific beat assigned to you.
2. Read the corresponding section in `STORYBOARD.md` to understand the scene's requirements.
3. Use the required assets and colors from `DESIGN.md` and `tokens.json`.
4. Build the HTML file (e.g. `compositions/beat-01-problem.html`).
5. Ensure you strictly follow the HyperFrames sub-composition rules:
   - All your content MUST be inside `<template>`.
   - The `<style>` and `<script>` blocks MUST be inside the `<template>`.
   - Your root node must have a `data-composition-id` matching the filename (e.g., `beat-01`).
   - Your root node must be styled via `#root`, NOT a class (e.g., `#root { position: absolute; inset: 0; background: #F9F9F8; }`).
   - Register your GSAP timeline via `window.__timelines["beat-01"] = tl;` where the key matches your `data-composition-id`.
   - Use `gsap.fromTo()` for entrance tweens as required by HyperFrames sub-composition rules.
6. Once you write the file, ensure you have correctly applied GSAP animations to match the choreography in `STORYBOARD.md`.
7. Exit when done. Do not attempt to run or preview the whole video.

## Output
Create and save the `compositions/beat-XX.html` file using the `write_to_file` tool.
