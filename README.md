# SlideBloom Studio Stable

Stabilitäts-Neuauflage der GitHub-Pages-Präsentations-App.

## Wichtigste Fehlerbehebungen
- Kein automatisches Hochfahren des Inspectors mehr, wenn ein Element angetippt wird.
- Auf Handy/Tablet erscheint stattdessen ein eigener **Bearbeiten**-Button.
- Die App ist fest an `100dvh` gebunden; die Webseite selbst scrollt nicht mehr weg.
- Canvas-Gesten scrollen nicht mehr versehentlich die Browser-Seite.
- Eingabefelder sind mobil mindestens 16 px groß, damit iPhone/Safari beim Antippen nicht automatisch hineinzoomt.
- Inspector ist ein kontrolliertes Bottom-Sheet und überdeckt nicht mehr den kompletten Editor.
- Smart-Panel öffnet nur noch bewusst.
- Alte SlideBloom-Service-Worker und Caches werden entfernt, damit GitHub Pages nicht alte JS/CSS-Dateien mit der neuen Version mischt.
- Alt+Drag-Duplizieren wurde entfernt, weil es bei Pointer-Gesten unnötig fehleranfällig war. Duplizieren geht weiterhin über Ctrl/Cmd+D.

## GitHub aktualisieren
Alle Dateien im bestehenden Repository durch die Dateien aus dieser ZIP ersetzen und committen.

Danach beim **ersten Aufruf** am besten einmal diese URL öffnen:

`https://DEINNAME.github.io/DEIN-REPO/?stable=3`

Der Query-Parameter sorgt dafür, dass ein eventuell noch aktiver alter Service-Worker nicht die alte Startseite aus seinem Cache nimmt. Die neue Version entfernt danach den alten Cache automatisch.

## Mobile Bedienung
- Element antippen = auswählen.
- Unten erscheint **Bearbeiten**.
- Erst auf **Bearbeiten** tippen, wenn du Eigenschaften ändern möchtest.
- Mit dem Pfeil im Bearbeitungsfenster schließt du es wieder.
- Shift/Ctrl/Command + Klick = Mehrfachauswahl (Desktop).
- Auswahlrahmen = auf freie Fläche ziehen.
- Ctrl/Cmd+C / V = Kopieren / Einfügen.
- Ctrl/Cmd+D = Duplizieren.
- Ctrl/Cmd+G = Gruppieren.

## Morph
1. Folie erstellen.
2. Folie duplizieren.
3. Auf der duplizierten Folie Elemente verschieben/skalieren/rotieren.
4. Übergang **Morph** wählen.
5. Präsentieren.

## Hinweis
Die App läuft weiterhin vollständig statisch auf GitHub Pages. Login, serverseitige KI, echte Cloud-Kollaboration und vollständig kompatibler PPTX-Import/Export benötigen später ein Backend bzw. zusätzliche Dienste.
