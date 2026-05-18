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

Die Schweizer Filmstatistik des Bundesamtes für Statistik (BFS) trennt Kinobesuche und VoD-Transaktionen — zwei Märkte, die sich gegenseitig beeinflussen, aber nicht identisch messen. Kinodaten liegen als wöchentliche Besuchszahlen vor; VoD als jährliche Aggregation nach Modell (Kauf, Leihe, Abo), Herkunftsregion und Genre.

<div class="note-box reveal">
  <div class="note-box-label">Datenstand</div>
  <p>VoD-Auswertungen basieren auf dem BFS-Datensatz «Film- und Kinostatistik – Video on Demand» (2019–2024). Kinobesuche stammen aus «Kinostatistik – Ergebnisse nach Kinowochen». Weitere Quellen: <a href="./sources.txt">Quellenliste</a>.</p>
</div>

Nach der pandemiebedingten Einbruchsphase erholten sich die Kinobesuche wieder — ohne das Niveau von 2019 vollständig zu erreichen. Parallel wächst das VoD-Angebot; der Anteil Schweizer Produktionen an den erfassten Kauf-Views bleibt jedoch gering.

    </div>
  </div>
</section>

<section id="interactive">
  <div class="container">
    <div class="section-label reveal">Interaktiv</div>
    <div class="sec-head reveal">
      <div class="sec-num">02</div>
      <h2>Datenauswertung</h2>
    </div>
    <p class="measure reveal stats-intro">Kinomarkt (PX) im Jahresverlauf: Angebot und Nachfrage als Linien, Kinosaison in zwei Wochenplots, Genre als gestapelte Jahresbalken; pro Jahr Herkunft, Top-Länder und Genre mit Vorjahresvergleich. VoD und P4 ergänzen. <a href="./unified.html">Vollbild-Ansicht</a>.</p>
  </div>
  <div class="wide-bleed">
    <div class="embed-frame visible" style="height: min(72vh, 820px); max-width: 1240px; margin: 0 auto;">
      <iframe title="Swiss Film — Unified Auswertung" src="./unified.html?embed=1" loading="lazy" referrerpolicy="no-referrer"></iframe>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-label reveal">Methodik</div>
    <div class="sec-head reveal">
      <div class="sec-num">03</div>
      <h2>Quellen &amp; Grenzen</h2>
    </div>
    <div class="measure">

- **BFS Kinostatistik** (wöchentlich): Besuchszählungen nach Herkunft, Format u. a.
- **BFS VoD** (jährlich): Transaktionen/Views nach Modell, Herkunft, Genre.
- **Aufbereitung**: CSV → JSON via `node scripts/export_site.mjs`; keine Live-API.
- **Hinweis**: Unvollständige Kalenderjahre (z. B. laufendes Jahr) werden in Jahresvergleichen ausgeschlossen.

Projekt auf [GitHub](https://github.com/datenpunk-ch/swiss_film_vod).

    </div>
  </div>
</section>
