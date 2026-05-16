<!--
  Artikel-Inhalt (Deutsch). index.html lädt PART:hero und PART:body.
-->

<!--PART:hero-->
<div class="container">
  <div class="hero-tag reveal">Datenjournalismus · Schweiz · Film</div>
  <h1 class="reveal">Kino, VoD und Herkunft</h1>
  <p class="hero-sub reveal">Wie viele Menschen gehen noch ins Kino — und was schauen sie zu Hause? Offizielle BFS-Zahlen zu Kinobesuchen und Video-on-Demand erlauben einen Blick auf Entwicklung, Herkunftsländer und die vergleichsweise kleine Rolle Schweizer Produktionen im digitalen Kaufangebot.</p>
  <div class="hero-byline reveal">
    <span><a href="#interactive">↓ Zur interaktiven Auswertung</a></span>
  </div>
</div>

<!--PART:body-->
<section>
  <div class="container">
    <div class="section-label reveal">Kontext</div>
    <div class="sec-head reveal">
      <div class="sec-num">01</div>
      <h2>Zwei Bildschirme, eine Branche</h2>
    </div>
    <div class="measure">

Die Schweizer Filmstatistik des Bundesamtes für Statistik (BFS) trennt Kinobesuche und VoD-Transaktionen — zwei Märkte, die sich gegenseitig beeinflussen, aber nicht identisch messen. Kinodaten liegen als wöchentliche Besucherzahlen vor; VoD als jährliche Aggregation nach Modell (Kauf, Leihe, Abo), Herkunftsregion und Genre.

<div class="note-box reveal">
  <div class="note-box-label">Datenstand</div>
  <p>VoD-Auswertungen basieren auf dem BFS-Datensatz «Film- und Kinostatistik – Video on Demand» (2019–2024). Kinobesuche stammen aus «Kinostatistik – Ergebnisse nach Kinowochen». Weitere Quellen: <a href="./sources.txt">Quellenliste</a>.</p>
</div>

Nach der pandemiebedingten Einbruchsphase erholten sich die Kinobesuche wieder — ohne das Niveau von 2019 vollständig zu erreichen. Parallel wächst das VoD-Angebot; der Anteil Schweizer Produktionen an den erfassten Kauf-Views bleibt jedoch gering.

    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-label reveal">Zahlen</div>
    <div class="sec-head reveal">
      <div class="sec-num">02</div>
      <h2>Ein paar Kennzahlen</h2>
    </div>
    <div class="measure">
      <p class="reveal stats-intro">Die folgenden Werte werden beim Laden aus den aufbereiteten JSON-Dateien berechnet (letztes vollständiges Berichtsjahr).</p>
      <div class="stats reveal" id="headlineStats" aria-live="polite">
        <div class="stats-label">Überblick</div>
        <div class="stats-cards" id="headlineStatsCards"><div class="stat-card is-loading">Lädt…</div></div>
      </div>
      <p class="reveal stats-intro">Kinobesuche pro Kalenderjahr (Summe wöchentlicher Zählungen, alle Herkünfte):</p>
      <div class="stats reveal" id="cinemaYearStats" aria-live="polite">
        <div class="stats-label">Kinobesuche nach Jahr</div>
        <div id="cinemaYearStatsInner"><div class="stat-card is-loading" style="width:100%;max-width:100%;height:auto;min-height:72px;">Lädt…</div></div>
      </div>
      <p class="reveal stats-intro">VoD-Kauf-Views (EST) nach Herkunftsregion — Anteil Schweiz am Gesamtvolumen:</p>
      <div class="stats reveal" id="vodShareStats" aria-live="polite">
        <div class="stats-label">Schweizer Anteil (EST, Views)</div>
        <div id="vodShareStatsInner"><div class="stat-card is-loading" style="width:100%;max-width:100%;height:auto;min-height:72px;">Lädt…</div></div>
      </div>
    </div>
  </div>
</section>

<section id="interactive">
  <div class="container">
    <div class="section-label reveal">Interaktiv</div>
    <div class="sec-head reveal">
      <div class="sec-num">03</div>
      <h2>Explorer</h2>
    </div>
    <p class="measure reveal stats-intro">Wochenverlauf der Kinobesuche und VoD-Herkunft im Zeitvergleich — Filter und Jahreswahl in der eingebetteten Ansicht.</p>
  </div>
  <div class="wide-bleed">
    <div class="embed-frame reveal" style="height: min(72vh, 820px); max-width: 1240px; margin: 0 auto;">
      <iframe title="Swiss Film Explorer" src="./explore.html?embed=1" loading="lazy" referrerpolicy="no-referrer"></iframe>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-label reveal">Methodik</div>
    <div class="sec-head reveal">
      <div class="sec-num">04</div>
      <h2>Quellen &amp; Grenzen</h2>
    </div>
    <div class="measure">

- **BFS Kinostatistik** (wöchentlich): Besucherzählungen nach Herkunft, Format u. a.
- **BFS VoD** (jährlich): Transaktionen/Views nach Modell, Herkunft, Genre.
- **Aufbereitung**: CSV → JSON via `node scripts/export_site.mjs`; keine Live-API.
- **Hinweis**: Unvollständige Kalenderjahre (z. B. laufendes Jahr) werden in Jahresvergleichen ausgeschlossen.

Projekt auf [GitHub](https://github.com/datenpunk-ch/swiss_film).

    </div>
  </div>
</section>
