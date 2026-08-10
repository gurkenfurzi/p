# SlideBloom Studio v5.0 – Test Report

Automatisierte Chromium-Tests wurden auf drei Layoutgrößen ausgeführt:

- Desktop: 1440 × 900
- Tablet: 820 × 1180
- Mobile: 390 × 844

## Getestet
- sichtbare Versionsanzeige `v5.0`
- Canvas bleibt beim Anklicken an exakt derselben Position
- alle Ribbon-Tabs: Einfügen, Design, Textstile, Animation, Anordnen, Medien, Review, Notizen
- Formen hinzufügen
- Pathfinder: Vereinen, Abziehen, Schnittmenge, Ausschließen
- eigener Textstil speichern und wieder als neues Element einfügen
- eigene Folienvorlage speichern
- eigene Präsentationsvorlage speichern und wieder laden
- Morph-Beziehungen in Präsentationsvorlagen
- Story Rail auf alle Folien anwenden
- Story-Rail-Marker hat auf Folie 1 und 2 verschiedene Y-Positionen
- ab Folie 2 wird für Story Rail automatisch Morph verwendet
- Timeline öffnen/schließen
- Präsentationsmodus öffnen/schließen
- Quick-Dock Navigation
- Browser-Seite bleibt bei `scrollY = 0`
- keine JavaScript-Runtime-Exceptions in den Testabläufen

## Stabilitätsänderung gegenüber alten Versionen
v5 benutzt absichtlich neue Asset-Dateinamen:

- `app.v5.js`
- `styles.v5.css`

Es wird kein neuer Service Worker registriert. Beim Start versucht die App zusätzlich alte SlideBloom-Service-Worker und Caches zu entfernen. Dadurch soll GitHub Pages nicht wieder alte JS/CSS-Dateien mit dem neuen HTML kombinieren.

Hinweis: Wie bei jeder größeren Browser-App kann nicht mathematisch garantiert werden, dass kein denkbarer Edge Case existiert. Die oben genannten Kernabläufe wurden tatsächlich in Chromium ausgeführt.
