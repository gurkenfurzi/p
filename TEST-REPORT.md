# v6.9.26 repair notes

- Desktop slide rail is forced visible from 561 CSS px and also on fine-pointer devices.
- Slide rail uses an explicit four-row CSS grid so the thumbnail list cannot collapse to zero height.
- Thumbnail list has its own vertical scrolling region.
- Ribbon was reduced to 27 px and the active command strip to 46 px.
- Added repeated layout repair after startup to defeat older mobile breakpoint transforms.
- app.js syntax checked with Node.
