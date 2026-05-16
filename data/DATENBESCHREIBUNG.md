# Datenbeschreibung — Swiss Film Projekt

Überblick über Rohdaten, aufbereitete Dateien und sinnvolle Auswertungen.  
Stand: automatisch aus den Dateien in `data/raw/` abgeleitet (Mai 2026).

---

## Kurzüberblick

| Datei | Quelle | Zeitraum | Granularität | Thema |
|--------|--------|----------|--------------|--------|
| `ts-x-16.02.01.10.csv` | BFS StatVoD | 2019–2024 | jährlich | Video on Demand |
| `ts-x-16.02.01-P4.csv` | BFS Kinostatistik | 2019–2026* | **wöchentlich** | Kinobesuche |
| `px-x-1602010000_200.px` | BFS PX-Web | 2014–2025 | jährlich (Tabelle) | Filmangebot & Kinonachfrage (detailliert) |

\*2025/2026 in der Kinodatei sind oft noch unvollständig — für Jahresvergleiche nur vollständige Jahre verwenden.

**Im Repo, aber in `sources.txt` erwähnt (ggf. noch nachzuladen):**

| Datei | Quelle | Hinweis |
|--------|--------|---------|
| `je-d-16.02.01.01.xlsx` | BFS | Indikatoren Schweizer Film- und Kinolandschaft |
| `2025-Publikation-Jahresdaten-Mediapulse-TV.xlsx` | Mediapulse | TV-Jahresdaten |
| `*-APPENDIX.ods` | BFS | **Code-Listen** zu Spaltenwerten (wichtig für exakte Labels) |

---

## 1. VoD — `data/raw/ts-x-16.02.01.10.csv`

**Offizieller Titel (BFS):** Film- und Kinostatistik – Video on Demand (StatVoD)  
**Zeilen:** 1 440 · **Format:** CSV (UTF-8 mit BOM)

### Spalten

| Spalte | Bedeutung | Werte im Datensatz |
|--------|-----------|-------------------|
| `PERIODE` | Berichtsjahr | 2019, 2020, 2021, 2022, 2023, 2024 |
| `TYPE_VOD` | Vertriebsmodell | `EST` (Kauf), `TVOD` (Leihe), `SVOD` (Abo) |
| `TYPE_FILM` | Filmebene | `all` (alle Filme), `cin` (Kino-/Kinofilme-Kontext, siehe BFS-Appendix) |
| `ORIGIN` | Herkunftsregion | `all`, `och`, `oep`, `oot`, `ous` |
| `GENRE` | Genre | `all`, `fic` (Fiktion), `doc` (Dokumentar), `ani` (Animation) |
| `UNIT` | Kennzahl | `film` (Anzahl Filme), `view` (Anzahl Views/Transaktionen) |
| `VALUE` | Messwert | ganze Zahl |
| `STATUS` | Datenstatus | `A` (aktiv), `D` (deaktiviert/gelöscht) |

### Herkunft (`ORIGIN`) — grob

| Code | Inhalt (für Storytelling) |
|------|---------------------------|
| `och` | Schweiz |
| `oep` | Europa ohne Schweiz |
| `oot` | Übrige Welt |
| `ous` | Unbestimmt / nicht zugeordnet |
| `all` | Total über alle Herkünfte (offizielle Summe) |

**Wichtig:** `och + oep + oot` ist **nicht** immer gleich `all` (wegen `ous` und Rundungen). Für Totals `ORIGIN=all` verwenden; für Herkunfts-Anteile die Einzelcodes.

### Was du damit machen kannst

- **Zeitreihen:** Views oder Filme pro Jahr, nach VoD-Modell (EST/TVOD/SVOD).
- **Herkunft:** Anteil Schweiz vs. Europa vs. Welt (EST), Entwicklung 2019–2024.
- **Genre:** Fiktion vs. Dokumentar vs. Animation (pro Jahr, pro Modell).
- **Kino vs. Gesamt:** `TYPE_FILM=all` vs. `TYPE_FILM=cin` vergleichen.
- **Intensität:** Views pro Film = `view` / `film` (bei passenden Filtern).

### Bereits aufbereitet im Projekt

| Datei | Inhalt |
|--------|--------|
| `data/vod.json` | EST-Herkunftsserie, letztes Jahr |
| `data/vod_stats.json` | Deskriptive Statistik, Tabellen pro Jahr |
| **Seite** `data_explorer.html` | Visualisierung (Dropdown: VoD / Kino / PX) |

---

## 2. Kino (wöchentlich) — `data/raw/ts-x-16.02.01-P4.csv`

**Offizieller Titel (BFS):** Kinostatistik – Ergebnisse nach Kinowochen  
**Zeilen:** ca. 19 080 · **Format:** CSV

### Spalten

| Spalte | Bedeutung | Werte im Datensatz |
|--------|-----------|-------------------|
| `year` | Kalenderjahr | 2019 … 2026 |
| `week` | Kalenderwoche (1–53) | 1 … 53 |
| `date` | Referenzdatum der Woche | z. B. 2019-01-02 |
| `unit` | Beobachtungseinheit | siehe unten |
| `recent` | Neuaufführungen | `rall` (alle), `rnew` (nur Neuaufführungen) |
| `origin` | Herkunft | `oall`, `och`, `oeu`, `oot`, `ous` |
| `value` | Messwert | ganze Zahl (Besuche, Filme, …) |

### Beobachtungseinheiten (`unit`)

| Code | Typische Bedeutung (BFS) |
|------|--------------------------|
| `adm` | **Kinobesuche** (Admissions) — meist genutzt in der Site |
| `cin` | Kinos / Kinostandorte |
| `flm` | Filme |
| `prj` | Vorführungen / Projektionen |
| `scr` | Leinwände / Screens |

### Herkunft Kino — Achtung, andere Codes als VoD!

| Code | Hinweis |
|------|---------|
| `oall` | Alle Herkünfte |
| `och` | Schweiz |
| `oeu` | **Europa** (nicht `oep` wie bei VoD!) |
| `oot` | Übrige Welt |
| `ous` | Unbestimmt |

### Was du damit machen kannst

- **Saisonalität:** Besuche pro Woche (`unit=adm`, `origin=oall`, `recent=rall`).
- **Jahresvergleiche:** Summe wöchentlicher Besuche pro Jahr (nur vollständige Jahre).
- **Herkunft im Kino:** Schweiz vs. Europa vs. Welt — wöchentlich oder jährlich.
- **Neu vs. Bestand:** `rnew` vs. `rall`.
- **Nebenkennzahlen:** Filme, Vorführungen, Screens parallel auswerten.

### Bereits aufbereitet

| Datei | Inhalt |
|--------|--------|
| `data/cinema.json` | Jährliche Summen, Wochenreihen 2019+ |
| `data/cinema_stats.json` | Deskriptive Statistik | `data_explorer.html?dataset=cinema` |
| **Seite** `dashboard.html` → `dash/` | Wochenverlauf, Jahr wählen (React) |

---

## 3. Filmangebot & Nachfrage (PX) — `data/raw/px-x-1602010000_200.px`

**Offizieller Titel (BFS):** Filmangebot und Nachfrage nach Herkunftsland, Sprachgebiet, Sprachfassung, Projektionsart (2D/3D) und Genre  
**Format:** PC-Axis / PX-Web (Text, kein flaches CSV)  
**Jahre in Datei:** 2014–2025

### Dimensionen (aus PX-Metadaten)

1. **Jahr**
2. **Herkunftsland** — sehr fein (Schweiz, USA, einzelne EU-Staaten, Regionen „Total Europa“, …)
3. **Sprachgebiet** — Schweiz, Deutschschweiz, französische/italienische Schweiz, …
4. **Alle Filme / Erstaufführungen** — `Alle vorgeführten Filme` vs. `Erstaufführungen`
5. **Sprachfassung · Projektionsart · Genre** — z. B. Originalfassung, 2D/3D, Genre-Total
6. **Beobachtungseinheit** — `Anzahl Filme`, `Anzahl Vorführungen`, `Kinoeintritte`

### Was du damit machen kannst

- **Länder-Rankings:** Welche Herkunftsländer dominieren Angebot vs. Eintritte?
- **Sprache:** Deutschschweiz vs. andere Sprachgebiete.
- **Erstaufführungen:** Anteil neuer Filme am Angebot.
- **2D/3D, Genre, Sprachfassung:** tiefere Schnitt als VoD-CSV.
- **Längere Historie:** ab 2014 (VoD nur ab 2019).

### Aufbereitung

| Datei | Inhalt |
|--------|--------|
| `data/px_stats.json` | Metadaten, Jahresreihen (Total / CH-Schnitt) |
| **Seite** `data_explorer.html?dataset=px` | Datenbeschreibung + Tabellen |

Extraktion über minimalen PX-Parser in `scripts/export_site.mjs` (kein vollständiger Kreuztabellen-Export).

---

## 4. Aufbereitete JSON (`data/`)

| Datei | Quelle | Verwendung |
|--------|--------|------------|
| `vod.json` | VoD-CSV | Explorer, Artikel-Karten |
| `vod_stats.json` | VoD-CSV | `data_explorer.html?dataset=vod` |
| `cinema.json` | Kino-CSV | Explorer, Artikel |
| `cinema_stats.json` | Kino-CSV | `data_explorer.html?dataset=cinema` |
| `px_stats.json` | PX-Datei | `data_explorer.html?dataset=px` |
| `summary.json` | beide | Kennzahlen Artikel |
| `labels.json` | Code → Label (DE) | optional für UI |

Neu erzeugen:

```text
node scripts/export_site.mjs
```

(Cursor-Node: Pfad siehe `scripts/export_site.mjs` — oder Node installieren.)

---

## 5. Praktische Tipps

### Vollständige Jahre

- VoD: 2019–2024 in der CSV.
- Kino: 2025/2026 oft **laufend/unvollständig** — für YoY z. B. 2024 vs. 2023, nicht 2026 vs. 2025.

### Totals vs. Summen

- Immer prüfen, ob `ORIGIN=all` / `oall` existiert — nicht blind `och+oep+oot` summieren.

### VoD vs. Kino

- **Verschiedene Märkte** (Streaming vs. Besuch), verschiedene **Herkunftscodes** (`oep` vs. `oeu`).
- Direkt nur mit Vorsicht vergleichen; eher gemeinsame Story (Schweizer Anteil in beiden).

### Metadaten nachschlagen

Für exakte BFS-Definitionen jedes Codes:

- `ts-x-16.02.01.10-APPENDIX.ods`
- `ts-x-16.02.01-P4-APPENDIX.ods`

(von [BFS Katalog](https://www.bfs.admin.ch/bfs/de/home/statistiken/katalog.html) laden, falls nicht im Ordner.)

### STATUS `D` in VoD

Zeilen mit `STATUS=D` sind deaktiviert — für Publikation meist **nur `STATUS=A`** filtern.

---

## 6. Quellenlinks

Siehe auch `sources.txt` im Projektroot.

- [StatVoD (VoD)](https://www.bfs.admin.ch/bfs/de/home/statistiken/kultur-medien-informationsgesellschaft-sport/kultur/film-kino/vod.assetdetail.36217919.html)
- [Kinostatistik wöchentlich](https://www.bfs.admin.ch/bfs/de/home/statistiken/katalog.assetdetail.36596835.html)
- [Filmangebot/Nachfrage PX](https://www.bfs.admin.ch/bfs/de/home/statistiken/katalog.assetdetail.36476429.html)
- [Indikatoren Kinolandschaft (XLSX)](https://www.bfs.admin.ch/bfs/de/home/statistiken/katalog.assetdetail.36461148.html)
- [Mediapulse Jahresdaten](https://www.mediapulse.ch/daten/jahresdaten)

---

## 7. Ideen für neue Stories (noch nicht umgesetzt)

1. **PX → Schweizer Anteil Kinoeintritte nach Land** (feiner als `och` allein).
2. **Wochenprofil Kino:** welche KW sind stärkste/schwächste?
3. **VoD TVOD/SVOD vs. EST:** Shift weg vom Kauf?
4. **Mediapulse TV** vs. BFS VoD (andere Datenquelle, andere Definition).
5. **Erstaufführungen (`rnew`)** vs. Gesamtprogramm wöchentlich.
