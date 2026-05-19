<!--
  Kurzstory Schweizer Film am Kino (index.html).
  Grafiken: data/analysis_report.json via assets/article-page.js
-->

<!--PART:hero-->
<div class="container">
  <div class="hero-tag reveal">Kultur · Schweiz · Kino</div>
  <h1 class="reveal">Wie stehts eigentlich um den Schweizer Film?</h1>
  <p class="hero-sub reveal">Zuerst die Lage in Zahlen: Nach der Pandemie hat sich der Gesamtmarkt erholt, der Anteil Schweizer Film am Publikum ist gestiegen — der deutliche Sprung vor allem zwischen 2023 und 2024. Danach geht es mit statistischen Schätzungen tiefer: Markt, Herkunftsländer, Genres und die Lücke zwischen Programm und Publikum.</p>
  <p class="hero-byline reveal">
    <span>Bundesamt für Statistik (BFS) · Stand <span id="article-stand">—</span></span>
    <span><a href="#interactive">↓ Zu den Details</a></span>
  </p>
</div>

<!--PART:body-->
<section id="story">
  <div class="container">
    <div class="section-label reveal">Überblick</div>
    <div class="sec-head reveal">
      <div class="sec-num">00</div>
      <h2>Zwei Fragen, ein roter Faden</h2>
    </div>
    <div class="measure">

<p class="reveal">Die **Hauptfrage** hat zwei Teile: **Wie steht es mit dem Kino insgesamt?** Und: **Wie macht sich der Schweizer Film darin?** — gemessen an Kinobesuchen und am Filmeangebot (jährliche BFS-Statistik **PX**), ergänzt um die **Kinosaison** in Wochen (**P4**).</p>

<!--ARTICLE:kpis-->

<p class="reveal">Die **Kennzahlen** und die <a href="#interactive">interaktive Jahresansicht</a> unten zeigen: Der Markt hat sich nach 2020–2021 erholt, liegt aber noch unter dem Niveau von Mitte der 2010er-Jahre. Der **Anteil Schweizer Film an den Besuchen** lag 2025 bei rund **9&nbsp;%** — vor der Pandemie meist **4–7&nbsp;%**. Zwischen **2023 und 2024** stieg er von etwa 6,3&nbsp;% auf 8,9&nbsp;%. Im **Programm** sind Schweizer Filme etwas häufiger vertreten als in den **Besuchen** (Differenz rund **1,5 Prozentpunkte**).</p>

<p class="reveal">Die Abschnitte **01–05** stellen nacheinander eine präzisere Frage — jeweils mit einer passenden Auswertung. Erst der **Gesamtmarkt**, dann der **Schweizer Anteil**, die **Herkunftsländer**, **Genres**, schliesslich **Programm versus Publikum**.</p>

    </div>
  </div>
</section>

<section id="kino-markt">
  <div class="container">
    <div class="section-label reveal">Teil I · Das Kino</div>
    <div class="sec-head reveal">
      <div class="sec-num">01</div>
      <h2>Wie steht es mit dem Kino insgesamt?</h2>
    </div>
    <div class="measure">

<p class="reveal">Nach der Pandemie sind die **Kinobesuche** wieder deutlich höher als 2020–2021, aber der Gesamtmarkt ist **noch nicht** wieder bei den rund 12–14&nbsp;Mio. Besuchen von 2015–2019; 2023 und 2024 liegen eher bei etwa 10&nbsp;Mio. Auch das **Angebot** (Filme im Programm) hat sich erholt — die Saison folgt dem üblichen Muster (stark im Winter, schwächer im Sommer).</p>

<div class="article-plot reveal">
  <div class="embed-frame visible embed-frame--demand" style="max-width: 100%;">
    <iframe title="Kinobesuche Gesamtmarkt und CH" src="./unified.html?embed=1&amp;panel=demand" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</div>

<p class="chart-caption reveal">Kinobesuche in Millionen — Gesamtmarkt und Schweizer Film im Vergleich.</p>

<p class="reveal"><strong>Frage:</strong> Wie viel vom Wachstum kommt daher, dass **insgesamt mehr Menschen** ins Kino gehen — und wie viel davon, dass der **Schweizer Film einen grösseren Anteil** am Publikum hat?</p>

<p class="reveal"><strong>Antwort:</strong> Beides spielt eine Rolle. Wenn der Gesamtmarkt wächst, steigen auch die Besuche bei Schweizer Filmen — aber der Schweizer Anteil hat in den letzten Jahren **überproportional** zugelegt. Der Sprung zwischen 2023 und 2024 lässt sich **nicht** allein mit «das Kino hat sich nach der Pandemie erholt» erklären.</p>

    </div>
  </div>
</section>

<section id="kinosaison">
  <div class="container">
    <aside class="info-box reveal" aria-labelledby="kinosaison-title">
      <div class="info-box-label">Saison</div>
      <h2 class="info-box-title" id="kinosaison-title">Wann gehen die Menschen ins Kino?</h2>
      <p>Die wöchentliche Statistik (Mittel **2019** und **2022–2024**) — **Gesamtmarkt**, ohne Modell:</p>
      <ul>
        <li><strong>Stark:</strong> Dezember und Jahreswechsel (Kinowochen 51–53, Woche 1).</li>
        <li><strong>Zweiter Schwerpunkt:</strong> Frühling (ca. Kinowoche 17).</li>
        <li><strong>Schwächer:</strong> Sommer.</li>
      </ul>
      <p>Schweizer Filme folgen dieser Kurve; sie profitieren von den Hochphasen des Gesamtmarkts.</p>
      <div class="info-box-figure">
        <div class="embed-frame visible embed-frame--season" style="max-width: 100%;">
          <iframe title="Kinosaison — Besuche pro Kinowoche (P4)" src="./unified.html?embed=1&amp;panel=season" loading="lazy" referrerpolicy="no-referrer"></iframe>
        </div>
      </div>
      <p class="info-box-foot">Durchschnittliche Besuche pro Kinowoche.</p>
    </aside>
  </div>
</section>

<section id="ch-anteil">
  <div class="container">
    <div class="section-label reveal">Teil II · Schweizer Film</div>
    <div class="sec-head reveal">
      <div class="sec-num">02</div>
      <h2>Wie macht sich der Schweizer Film am Publikum?</h2>
    </div>
    <div class="measure">

<p class="reveal">Hier geht es nicht um «mehr Besuche insgesamt», sondern um den **Anteil Schweizer Film**: Wie viel Prozent aller Kinobesuche entfallen auf Schweizer Produktionen? **2022** war ein schwaches Übergangsjahr (rund 5&nbsp;%). Der **Sprung** liegt bei **2023→2024**; 2025 bei etwa 9&nbsp;%.</p>

<p class="reveal"><strong>Frage:</strong> Steigt dieser Anteil **über die Jahre** weiter — und wie könnte es aussehen, wenn der bisherige Trend einfach weiterlaufen würde? Die Schätzung nutzt alle Jahre ausser 2020–2021 (Pandemie).</p>

<div class="article-plot reveal">
  <div class="embed-frame visible embed-frame--forecast" style="max-width: 100%;">
    <iframe title="CH-Anteil an Kinobesuchen — Verlauf" src="./unified.html?embed=1&amp;panel=forecast" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</div>

<p class="chart-caption reveal">Posterior-Mittel und 95&nbsp;%-HDI (Bayes-Modell); Punkte = beobachtete Anteile; gestrichelt = Prognose. Pandemie-Jahre schattiert.</p>

<p class="reveal"><strong>Antwort:</strong> Der Anteil steigt **klar nach oben** — von früher oft 4–7&nbsp;% Richtung rund 9&nbsp;% (2025). Eine statistische Trend-Fortsetzung (Bayes-Modell, siehe Analysen) deutet auf weiteres Wachstum hin — keine Vorhersage für einzelne Filme oder Ausnahmejahre.</p>

    </div>
  </div>
</section>

<section id="ch-laender">
  <div class="container">
    <div class="section-label reveal">Teil II · Herkunft</div>
    <div class="sec-head reveal">
      <div class="sec-num">03</div>
      <h2>Welche Länder prägen den Kinomarkt?</h2>
    </div>
    <div class="measure">

<p class="reveal">Neben dem Schweizer Anteil am **Gesamtkino** lohnt der Blick auf die **Herkunftsländer**: Wer liefert die meisten Besuche — und gewinnt die Schweiz im Vergleich zu USA und europäischen Produktionsländern an Gewicht?</p>

<p class="reveal"><strong>Frage:</strong> Wie verschieben sich die **Besuchsanteile** der wichtigsten Länder über die Jahre — und steigt der Anteil **Schweiz** im Modell spürbar?</p>

<div class="article-plot reveal">
  <div class="embed-frame visible embed-frame--countries" style="max-width: 100%;">
    <iframe title="Besuchsanteil nach Herkunftsland" src="./unified.html?embed=1&amp;panel=countries" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</div>

<p class="chart-caption reveal">Posterior je Kernland (95&nbsp;%-HDI) und beobachtete Besuchsanteile; Pandemie-Jahre schattiert.</p>

<!--INJECT:ch_countries_bayes:metrics-->

<p class="reveal"><strong>Antwort:</strong> Die **USA** dominieren den Besuchsanteil über den ganzen Zeitraum. **Schweiz**, **Frankreich** und **Deutschland** bleiben relevante europäische Quellen. Der **Schweizer Anteil** am Gesamtmarkt steigt im Modell **klar** — parallel zum CH-Trend in Abschnitt&nbsp;02, hier im direkten Ländervergleich.</p>

    </div>
  </div>
</section>

<section id="ch-genre">
  <div class="container">
    <div class="section-label reveal">Teil II · Warum</div>
    <div class="sec-head reveal">
      <div class="sec-num">04</div>
      <h2>In welchen Genres trägt der Schweizer Film?</h2>
    </div>
    <div class="measure">

<p class="reveal"><strong>Frage:</strong> Trägt der Schweizer Film in **Fiktion, Dokumentar und Animation** gleichermassen — gemessen am Anteil **innerhalb** des jeweiligen Genre-Publikums? Und kommt ein höherer Gesamtanteil daher, dass das Publikum **andere Genres** bevorzugt, oder weil Schweizer Filme in den Genres **besser ankommen**?</p>

<p class="reveal"><strong>Antwort:</strong> **Fiktion** und **Dokumentar** gewinnen an Boden; bei **Animation** eher das Gegenteil. «Der Schweizer Film boomt» gilt also **nicht für alle Genres gleich**. Der **grössere** Teil des Anstiegs seit 2014 kommt davon, dass Schweizer Filme in Fiktion, Dokumentar und Animation **stärker abschneiden** — nicht primär davon, dass das Publikum plötzlich andere Genres wählt.</p>

<div class="article-plot reveal">
  <div class="embed-frame visible embed-frame--chgenre" style="max-width: 100%;">
    <iframe title="CH-Anteil je Genre" src="./unified.html?embed=1&amp;panel=chgenre" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</div>

<p class="chart-caption reveal">CH-Anteil innerhalb jedes Genres: Posterior (95&nbsp;%-HDI) und Beobachtungen.</p>

    </div>
  </div>
</section>

<section id="ch-luecke">
  <div class="container">
    <div class="sec-head reveal">
      <div class="sec-num">05</div>
      <h2>Mehr im Programm als im Publikum — schliesst sich die Lücke?</h2>
    </div>
    <div class="measure">

<p class="reveal">Schweizer Filme sind im **Programm** stärker vertreten als in den **Besuchen**. Die **Lücke** ist die Differenz: Programmanteil minus Besuchsanteil (in **Prozentpunkten**, nicht «Prozent» im Sinne von Wachstum). 2025: rund **1,5 Prozentpunkte**.</p>

<p class="reveal"><strong>Frage:</strong> Schrumpft die Lücke — und wann könnte sie theoretisch **null** werden?</p>

<div class="article-plot reveal">
  <div class="embed-frame visible embed-frame--gap" style="max-width: 100%;">
    <iframe title="Programm-Lücke Schweizer Film" src="./unified.html?embed=1&amp;panel=gap" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</div>

<p class="chart-caption reveal">Programm-Lücke (Pp.): Posterior, Prognose und Beobachtungen; gestrichelte Linie = Median des Kreuzungsjahrs.</p>

<p class="reveal"><strong>Antwort:</strong> Die Lücke **schrumpft** — das Publikum holt zum Programm auf. Setzt man den Trend fort, liegt das **geschätzte Jahr mit ausgeglichener Lücke** im Median bei rund **2028** — mit grosser Unsicherheit.</p>

<!--INJECT:ch_gap_bayes:metrics-->

<div class="article-plot reveal">
<!--INJECT:ch_gap_bayes:figure:3-->
</div>

<p class="chart-caption reveal">Verlauf und Trend-Fortsetzung; markiert etwa **2028** (Median, Lücke = 0). Die Linie reicht bis **2030** — das Ende der Prognose, nicht dasselbe wie das Kreuzungsjahr.</p>

    </div>
  </div>
</section>

<section id="synthese">
  <div class="container">
    <div class="section-label reveal">Fazit</div>
    <div class="sec-head reveal">
      <div class="sec-num">·</div>
      <h2>Kurz zusammengefasst</h2>
    </div>
    <div class="measure">

<p class="reveal">**Kino allgemein:** Erholung ja, Vorkrisen-Niveau noch nicht. **Schweizer Film:** höherer Besuchsanteil, Sprung vor allem 2023→2024 — getragen von Fiktion und Dokumentar; im Ländervergleich gewinnt die Schweiz an Gewicht, die USA dominieren weiter. **Programm vs. Publikum:** Die Lücke schrumpft. Vertiefung in der interaktiven Jahresansicht unten.</p>

    </div>
  </div>
</section>

<section id="interactive">
  <div class="container">
    <div class="section-label reveal">Vertiefung</div>
    <div class="sec-head reveal">
      <div class="sec-num">↗</div>
      <h2>Jahresverläufe im Detail</h2>
    </div>
    <p class="measure reveal stats-intro">Kino nach Jahr: Kennzahlen, Herkunft, Top-Länder, Genre — Jahr im Dropdown wählen.</p>
  </div>
  <div class="wide-bleed">
    <div class="embed-frame visible embed-frame--year-explore" style="max-width: 1240px; margin: 0 auto;">
      <iframe title="Kino nach Jahr (PX)" src="./unified.html?embed=1&amp;panel=year" loading="lazy" referrerpolicy="no-referrer"></iframe>
    </div>
  </div>
</section>

<section id="quellen">
  <div class="container">
    <div class="section-label reveal">Quellen</div>
    <div class="sec-head reveal">
      <div class="sec-num">·</div>
      <h2>Datengrundlage</h2>
    </div>
    <div class="measure">

<ul class="reveal sources-list">
  <li><strong>PX</strong> — Kinostatistik des Bundesamts für Statistik (BFS): jährliche Aggregate zu Filmen im Programm und Kinobesuchen (keine Einzelfilme).</li>
  <li><strong>P4</strong> — Kinostatistik des BFS nach Kinowochen: Besuche und Filme pro Woche (keine Genre-Aufteilung in den Rohdaten).</li>
</ul>

<p class="reveal sources-foot"><a href="https://github.com/datenpunk-ch/swiss_film_vod">GitHub-Repository</a> (Daten und Code)</p>

    </div>
  </div>
</section>
