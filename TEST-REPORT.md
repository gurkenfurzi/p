# SlideBloom v6.7 — Test Report

Automatisiert mit Chromium getestet.

## Desktop — 1440 × 900
- App startet ohne JavaScript-Runtime-Fehler: OK
- sichtbare Versionsnummer `v6.7`: OK
- Home / Meine Präsentationen öffnet: OK
- gespeichertes Projekt wird im Home-Dashboard angezeigt: OK
- Vorlagen-Menü: 19 Vorlagen angezeigt
- Ctrl+C + Ctrl+V: Element wird kopiert/eingefügt
- Delete: eingefügtes Element wird gelöscht
- Rechtsklick-Menü öffnet: OK
- Klick außerhalb schließt Rechtsklick-Menü: OK
- Mehrfachauswahl per Auswahlrahmen: OK
- Eigenschaften-Tab: OK
- Ebenen im permanenten rechten Dock: OK
- Animation-Tab: OK
- einklappbare Eigenschaftsbereiche: 10 Bereiche erkannt
- Autosave schreibt Projekt, Registry, Medien und Bibliothek: OK
- Reload-Simulation mit demselben Speicher: Projekt mit 3 Folien korrekt wiederhergestellt

## Tablet — 820 × 1180
- App startet ohne Runtime-Fehler: OK
- Canvas sichtbar: OK
- Home öffnet: OK

## Handy — 390 × 844
- App startet ohne Runtime-Fehler: OK
- Canvas sichtbar: OK
- Home öffnet: OK

## Statische Prüfungen
- `node --check app.v67.js`: OK
- keine doppelten HTML-IDs
- keine direkten JavaScript-Referenzen auf fehlende IDs
- `contextMenu` steht im HTML vor dem App-Script
- neue CSS/JS-Dateinamen verhindern Mix mit v6.6-Caches
