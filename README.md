# SlideBloom Studio v6.7 — Stable UI Rebuild

Diese Version konzentriert sich auf Stabilität und Übersichtlichkeit.

## Wichtige Fehlerbehebungen
- Das JavaScript wird jetzt erst **nach** dem Rechtsklick-Menü geladen. In v6.6 brach das Script vorher an einem noch nicht vorhandenen DOM-Element ab; dadurch wurden Home, Shortcuts und weitere Handler nicht registriert.
- Neue Asset-Dateien `app.v67.js` und `styles.v67.css`, damit GitHub/Browser nicht alte JS/CSS-Versionen mischen.
- LocalStorage-Zugriff ist abgesichert; gespeicherte Projekte werden beim Start wiederhergestellt.
- Rechtsklick wird per Event-Delegation behandelt und funktioniert auch nach Re-Renders.
- Rechtsklick-Menü schließt bei Klick außerhalb, Scroll, Resize, Fensterwechsel und Escape.
- Shortcuts wurden als globaler Keyboard-Handler neu aufgebaut.
- Mehrfachauswahl per Ziehen wählt jetzt alle Elemente, die den Auswahlrahmen schneiden.
- Der verwirrende Pan-Button wurde entfernt. Leertaste + Ziehen bleibt als optionaler Power-User-Pan beim Zoomen verfügbar.

## Rechte Seitenleiste
Auf Desktop bleibt die rechte Leiste dauerhaft sichtbar. Oben gibt es drei Ansichten:
- Eigenschaften
- Ebenen
- Animation

Eigenschaftsbereiche lassen sich einzeln ein- und ausklappen.

## Shortcuts
- Ctrl/Cmd + C: Kopieren
- Ctrl/Cmd + X: Ausschneiden
- Ctrl/Cmd + V: Einfügen
- Ctrl/Cmd + D: Duplizieren
- Ctrl/Cmd + Z: Rückgängig
- Ctrl/Cmd + Y: Wiederholen
- Ctrl/Cmd + G: Gruppieren
- Ctrl/Cmd + Shift + G: Gruppe lösen
- Ctrl/Cmd + A: alle sichtbaren Elemente auswählen
- Delete / Backspace: Auswahl löschen
- Pfeiltasten: Auswahl verschieben
- Shift + Pfeiltaste: 10 px verschieben

## Neue Vorlagen
Zusätzlich zu den bisherigen Vorlagen gibt es unter anderem:
- Polaroid Collage
- Big Number
- Definition Card
- Before / After
- Agenda Cards
- Photo + Erklärung
- Study Summary
- Clean Steps

## GitHub Pages
Alle alten App-Dateien im Repository können durch die Dateien dieser ZIP ersetzt werden.
Die neue Version verwendet absichtlich andere Dateinamen:
- `index.html`
- `app.v67.js`
- `styles.v67.css`
- `.nojekyll`
- `README.md`
- `TEST-REPORT.md`
- `VERSION.txt`

Beim ersten Aufruf kann zusätzlich `?v=6.7` an die URL gehängt werden.
