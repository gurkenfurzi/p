# SlideBloom Studio v6.7.2 — Test Report

Automated browser testing was run against the actual v6.7.2 HTML/CSS/JS logic using Chromium.

Desktop 1440×900:
- Visible version: v6.7.2
- Home/projects modal: passed
- Built-in templates: 19
- Right-click menu opens, scrolls, closes: passed (683 px content / 558 px viewport, scrollTop reached 125)
- Ctrl+C / Ctrl+V / Delete: 6 → 7 → 6 elements
- Ctrl+D: 6 → 7 elements
- Properties / Layers / Animation right-dock switching: passed
- Linear gradient on SVG star: passed
- Rounded star path: passed
- Adjustable star points/depth: passed
- Feather mask: passed
- Soft + hard shadow together: passed
- Sticker color update on notepad: passed
- Pushpin present; redundant memo/info cards removed: passed
- Timeline: 7 points / 6 connecting segments, so lines stop between circles
- Milestone number changed to “07”: passed
- Story Rail: 4 symbols + exactly 1 active ring; no extra marker icon and no rail background
- Story Rail active ring moved between slide 1 and 2: passed
- SVG Story Rail symbol upload: passed
- Story Rail delete: passed
- UI accent settings + slider accent: passed
- Pan: viewport moved to scrollLeft 150 / scrollTop 90
- Marquee selection from a blank canvas point selected 7 elements
- Reload simulation with persisted localStorage: 3 slides → 3 slides
- Canvas Y before/after tested workflow: identical after final fixed-height toolbar patch
- JavaScript runtime errors: 0

Tablet 820×1180:
- App starts, canvas renders, scrollY remains 0, runtime errors 0

Mobile 390×844:
- App starts, canvas renders, scrollY remains 0, runtime errors 0

`node --check app.js` also passes.
