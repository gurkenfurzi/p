# v6.9.27 smoke test

Tested in headless Chromium at 1440×900 with the real app script injected.

- Runtime errors: 0
- Slide rail visible: yes
- Initial slide thumbnails rendered: 2
- Slide panel: 190×852 px
- Slide list: 173×695 px
- Ribbon height: 27 px
- Active toolstrip height: 46 px
- Desktop layout class applied: yes

Root cause fixed: late-added sticker/math/graph/layout helpers were outside the main app closure and could not access shared editor constants/state. This stopped initialization before slide thumbnails were rendered.
