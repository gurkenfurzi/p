# SlideBloom Studio Ultimate

Kostenlose Präsentations-Web-App für GitHub Pages. Keine Datenbank und kein Server nötig.

## Große Funktionen dieser Version

### Editor
- 16:9 Folien
- Titel, Text, Rechteck, Kreis, Dreieck, Stern, Linien, Pfeile, Badges
- Bilder, SVG, GIF, Video, Audio
- Icons, Tabellen, Balken-/Linien-/Kreis-/Donutdiagramme
- Freihandzeichnen
- Drag & Drop, Rotation und 4 Resize-Griffe
- Shift+Klick und Auswahlrahmen für Multi-Select
- Copy/Paste, Duplizieren, Gruppen, Ungroup
- Ebenen, Sperren, Ausblenden
- Smart Guides, Raster, Snap
- Tastatursteuerung und Undo/Redo

### Design
- Themes
- Farben
- lineare und radiale Verläufe
- Rahmen, Schatten, Ecken, Transparenz
- Typografie, Zeilenhöhe, Buchstabenabstand
- Bild-Crop/Zoom, Object Position
- Helligkeit, Kontrast, Sättigung, Blur
- Kreis-, Rund-, Hexagon- und Blob-Masken

### Animation
- Fade
- Von oben/unten/links/rechts
- Pop
- Zoom
- Blur
- Bounce
- Spin
- Typewriter
- Delay und Dauer
- Trigger "automatisch" / "beim Klick"
- Animation Timeline
- Folienübergänge Fade, Slide, Push, Zoom, Flip
- echtes Element-Morph über stabile Morph-IDs

### Präsentation
- Vollbildmodus
- Sprechernotizen
- Timer
- Laserpointer
- versteckte Folien
- Klick-Animationen

### Speichern / Export
- Autosave im Browser
- Projekt Export/Import (.json)
- eigenständige HTML-Präsentation
- PDF über Browser-Druckdialog
- PWA/Offline-Grundlage

## GitHub Pages Update
Wenn du dein Repository schon online hast:

1. ZIP entpacken.
2. In deinem bestehenden Repository die bisherigen Dateien ersetzen:
   - index.html
   - styles.css
   - app.js
   - manifest.webmanifest
   - sw.js
   - README.md
   - .nojekyll
3. Committen.
4. GitHub Pages aktualisiert die Website automatisch.
5. Wenn du noch die alte Version siehst: Browser hart neu laden (`Ctrl+F5`) oder Website-Daten/Cache einmal löschen, weil die App einen Service Worker nutzt.

## Morph
1. Folie bauen.
2. "Duplizieren".
3. Auf Folie 2 Übergang **Morph** wählen.
4. Bestehende Elemente verschieben/skalieren/rotieren/umfärben.
5. Präsentieren.

Die Morph-ID bleibt beim Folien-Duplizieren identisch.

## Technische Grenze
Diese Version bildet sehr viele PowerPoint-/Canva-Workflows lokal nach. Eine echte 1:1-Kopie aller Cloud-Funktionen ist mit reinem GitHub Pages nicht möglich. Dinge wie Echtzeit-Kollaboration mehrerer Accounts, Cloud-Login, serverseitige KI, Stock-Medien-Suche, dauerhafte Team-Kommentare und 100% PowerPoint-kompatibler PPTX-Import/Export brauchen einen Backend-/Cloud-Dienst oder zusätzliche Bibliotheken.
