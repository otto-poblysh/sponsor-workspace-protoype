# Pan-African Organization Portal

This directory contains the Pan-African Organization (org) prototypes and their localized tutorial videos.

## Structure
- `en/`: The base English HTML portal pages.
- `fr/`, `es/`: Localized HTML portal pages for French and Spanish.
- `i18n/`: String catalogs mapping translation keys for FR and ES.
- `video-en/`: The base Hyperframes composition for the 60-second tutorial video.
- `video-fr/`, `video-es/`: Auto-generated video builds using the `tools/build-video-i18n.js` generator. 

## Tutorial Videos
The localized videos are 60 seconds long and contain 5 distinct feature scenes with embedded browser views of the product:
1. Dashboard
2. Member Network
3. Skill Gap Analysis
4. Operational Reports
5. Activity Logs

All localized variants pass layout, duration, and translation regression tests. The final MP4 renders and cover posters are in `video-*/renders/`.
