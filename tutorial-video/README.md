# Tutorial Video Project

This directory contains the production package for a silent HyperFrames tutorial video demonstrating the Equatorial Guinea Ministry of Labour Market Portal.

## Purpose

The tutorial is designed to teach Ministry stakeholders and operational teams how to use key features on the portal to get certain outcomes. The video uses a screen-recording style format with deliberate mouse movements mapping to Job-to-be-Done (JTBD) scenarios.

## Canonical documents

1. `SCRIPT.md` — timed English on-screen subtitles and actions for the silent tutorial film.
2. `STORYBOARD.md` — beat-by-beat visual, motion, and transition direction.

## Planned production structure

```text
tutorial-video/
├── README.md
├── SCRIPT.md
├── STORYBOARD.md
```

## Current status

- Script: Finalized.
- Storyboard: Finalized.
- HyperFrames composition code: Implemented (5 beats).
- Portal capture: Ready for recording.

## Next action

The HyperFrames HTML compositions are ready. We can now load `index.html` in a local server or browser, and use a screen recording tool (or a headless capture script) to render the final `tutorial-video.mp4`.
