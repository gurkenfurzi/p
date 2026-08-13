# SlideBloom Studio v6.7.7

Focus of this repair:
- cleaner Canva / Word style ribbon layout
- pin and pushpin now have a separate detail / metal color
- contour thickness stays editable
- smart resize for delicate reference stickers so they keep their shape better instead of stretching badly

What was changed:
- added `Detail / Metall` color control for `pin` and `pushpin`
- pin shaft + pushpin metal middle now use `stickerDetailColor`
- resize logic keeps aspect ratio automatically for delicate reference stickers (`pin`, `pushpin`, `notebook`, `window_square`, `window_wide`, `folder_window`, `paint_window`)
- inspector now shows contour width for more reference sticker types
- ribbon / toolstrip styles were cleaned up to feel more structured and compact

Files kept with the same names:
- index.html
- app.js
- styles.css
