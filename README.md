# SlideBloom Studio v5.0

## Woran du die richtige Version erkennst
Oben links steht **v5.0**. Außerdem heißen die Assets absichtlich `app.v5.js` und `styles.v5.css`. Es gibt **keinen Service Worker mehr**, damit GitHub Pages nicht wieder eine alte Version mischt.

## Neu in v5
- kompaktere, aufgeräumte Oberfläche
- Quick-Dock links an der Arbeitsfläche
- eigene Textstile: Auswahl gestalten → `Textstile` → `Auswahl als Stil` → später mit einem Klick wieder einfügen
- eigene Folienvorlagen
- eigene komplette Präsentationsvorlagen (Morph-IDs bleiben innerhalb der Vorlage erhalten)
- Pathfinder für Rechteck/Kreis/Dreieck/Stern: Vereinen, Abziehen, Schnittmenge, Ausschließen
- Horizontal/vertikal verteilen
- Story Rail: Seitenleiste wie im Beispiel, deren aktiver Punkt über die Folien hinweg per Morph nach unten wandert
- alte Funktionen aus v4.2 bleiben erhalten: Bilder, SVG, GIF/Video/Audio, Charts, Tabellen, Masken, Crop, Effekte, Gruppen, Ebenen, Timeline, Notizen, Morph, Presenter usw.

## GitHub aktualisieren
Lösche die alten App-Dateien im Repository und lade **nur** die Dateien aus dieser ZIP hoch. Wichtig: In v5 gibt es `app.v5.js` und `styles.v5.css`; die alten `app.js`, `styles.css`, `sw.js` und `manifest.webmanifest` sollen nicht mehr im Repo liegen.

Danach öffne: `https://DEINNAME.github.io/DEINREPO/?v=5.0`

Wenn oben links nicht **v5.0** steht, ist noch die alte GitHub-Version offen.

## Pathfinder
Zwei oder mehr Formen mit Shift auswählen → `Anordnen` → Pathfinder. Rotation muss derzeit 0° sein. Vereinen/Ausschließen funktionieren mit mehreren Formen; Abziehen mit mehreren; Schnittmenge mit genau zwei.

## Eigener Überschriften-Stil
1. Titel erstellen.
2. Schrift, Farbe, Hintergrund-Kasten, Ecken, Rahmen, Schatten und Animation einstellen.
3. Tab `Textstile`.
4. `Auswahl als Stil`.
5. Namen vergeben, z. B. `Meine Überschrift`.
6. Ab jetzt erscheint der Stil als eigener Button. Ein Klick fügt sofort ein neues Textelement in genau diesem Design ein.

## Story Rail / Morph-Leiste
`Animation → Story Rail`. Sie wird auf alle Folien gelegt. Der aktive Marker hat auf jeder Folie dieselbe Morph-ID, aber eine andere Y-Position. Ab Folie 2 wird deshalb automatisch Morph gesetzt und der Punkt bewegt sich beim Präsentieren immer weiter nach unten.
