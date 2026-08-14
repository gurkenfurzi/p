# Flora Deck v7.0 – Test Report

Tested with system Chromium using injected local app assets.

## Desktop 1440×900
- v7.0 visible
- 8 presentation ribbon tabs
- Design sidebar, notes bar and status bar load
- 5 themes, 10 transitions and 13 entrance animations load
- Sticker, icon and Story Rail dialogs open
- Story Rail applies without runtime errors
- PPTX export produced a valid `.pptx` download

## Tablet 820×1180
- App initialized without runtime errors
- Stage auto-fitted inside the viewport
- Power Suite tabs/toolbars remained available

## Mobile 390×844
- App initialized without runtime errors
- Stage auto-fitted to phone width
- Ribbon remains horizontally usable
- Presenter controls remain available

## Important scope notes
- PPTX import is a practical browser importer for common text/shapes/images, not a perfect Microsoft Office round-trip parser.
- PPTX export keeps common text, shapes, images, tables and charts editable; highly custom stickers/complex effects may be approximated.
- Live multi-user collaboration/cloud accounts require a backend and are not part of this static GitHub Pages build.
