# Flora Deck v6.9.22 – Change/Test Notes

- Exact sticker insertion sizes corrected to original PNG aspect ratios.
- Exact sticker border slices refined so holes, torn edges and window chrome are not cut through.
- Formula editor is button-first: no formula syntax typing required; values are edited in the visual preview.
- Formula elements retain structured visual rendering on the slide and reopen on double click.
- Graph editor is button-first: choose function family and edit coefficients/parameters; no expression typing required.
- Existing legacy graph settings remain renderable.


## v6.9.23 verification
- `node --check app.js`: passed.
- Chromium/CDP interaction smoke test: passed.
- Formula modal opens from Insert > Formula and the preview is contenteditable.
- Visual root inserted around selected x; visual fraction nested inside the root successfully.
- Saved formula renders on the stage without live contenteditable slots.
- Graph modal opens from Insert > Graph; default curve renders.
- Function editor opens visually; direct `2x + 1` input updates the graph preview live.
- Saved graph renders on the stage and reopens on double-click.
- Window Exact nine-slice was composited at a wide aspect ratio and preserves the original top bar, 3 buttons, outline and back shadow without seams.
- Exact Notes 01, 02, 04, 05, 06, 07 were not changed.
