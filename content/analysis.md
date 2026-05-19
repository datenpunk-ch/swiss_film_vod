<!--
  Analyse-Seite: Text hier bearbeiten. Zahlen/Grafiken kommen aus
  data/analysis_report.json (pixi run analyze).
  Platzhalter im Body: INJECT:id:typ (HTML-Kommentar-Syntax).
-->

<!--PART:hero-->
<div class="container">
  <div class="hero-tag">Bayesian · BFS Kino</div>
  <h1>Kino-Analysen im Detail</h1>
  <p class="hero-sub">Sieben Bayesianische Modelle plus Länder-Zeitverlauf (deskriptiv). Unsicherheit: <strong>95&nbsp;%-höchstes Dichtheitsintervall (HDI)</strong>; Richtung: <strong>Richtungswahrscheinlichkeit (Pd)</strong>. Schätzung per <strong>MCMC</strong> (Markov Chain Monte Carlo, NUTS). Daten: BFS-<strong>PX</strong> (Filmangebot und Nachfrage, jährlich), BFS-<strong>P4</strong> (Kinostatistik nach Wochen). Text in <code>content/analysis.md</code>; Zahlen per <code>pixi run analyze</code>. Stand: <span id="analysis-stand">—</span>.</p>
  <p class="hero-byline"><a href="./index.html">← Artikel</a> · <a href="./unified.html">Übersicht</a></p>
</div>

<!--PART:body-->

<section class="analysis-block" id="ch_genre_bayes">
  <div class="container">
    <div class="section-label">Analyse 01</div>
    <div class="sec-head"><div class="sec-num">01</div><h2>Bayes: CH-Erfolg nach Genre (hierarchisch)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Tragen Fiktion, Dokumentar und Animation den CH-Kinoerfolg unterschiedlich — gemessen als CH-Anteil **innerhalb** des jeweiligen Genre-Markts (nicht am Gesamtkino)?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS PX nach Genre; Schätzjahre ohne 2020 und 2021.</p>
      <h3>Modelldefinition</h3>
      <p><strong>Hierarchisches Binomialmodell nach Genre</strong></p>
      <dl class="analysis-dl">
        <dt>Likelihood</dt><dd><code>y_{g,t} ~ Binomial(N_{g,t}, p_{g,t})</code></dd>
        <dt>Link</dt><dd><code>logit(p_{g,t}) = α_g + β_g · (Jahr − Jahr̄)</code></dd>
        <dt>Priors</dt><dd><ul><li><code>α_g, β_g</code> mit Hyperpriors (Partial Pooling über Genres)</li></ul></dd>
      </dl>
      <p class="analysis-note">Je Genre: CH-Besuche im Genre ÷ Marktbesuche im Genre. Fiktion als Referenz für den Genre-Mix-Teil in Analyse&nbsp;02.</p>
      <h3>Methode</h3>
      <p class="analysis-prose">Partial Pooling; Unsicherheit als HDI-Band, Richtung als Pd (siehe Kopfzeile).</p>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_genre_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_genre_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_genre_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Das Modell schätzt je Genre den CH-Anteil am Genre-Markt (z.&nbsp;B. Anteil der Dokumentar-Besuche, die auf CH-Produktionen entfallen). Partial Pooling zieht extreme Genre-Schätzungen zum gemeinsamen Mittel — sinnvoll bei nur zehn Schätzjahren pro Genre.</p>
      <p class="analysis-prose">Fiktion und Dokumentar zeigen posterior einen steigenden Trend; beim Animationsanteil am Genre-Markt eher Rückgang. Der Gesamttrend am Kino wird nicht von einem einzelnen Genre getragen — «Schweizer Film boomt» ist genreabhängig.</p>
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_genre_bayes:tables-->
      <h3>Grenzen</h3>
      <ul>
        <li>Aggregierte BFS-Daten (kein Film-Level).</li>
        <li>Kein Genre-Mix am Gesamtkino — siehe Analyse&nbsp;02.</li>
        <li>Pd misst Richtung, nicht Effektstärke.</li>
      </ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_genremix_bayes">
  <div class="container">
    <div class="section-label">Analyse 02</div>
    <div class="sec-head"><div class="sec-num">02</div><h2>Bayes: Genre-Mix und Zerlegung des CH-Gesamtanteils</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Erklärt die Genre-Zusammensetzung (z.&nbsp;B. mehr Dokus im Kino) den CH-Gesamterfolg — oder der Erfolg **innerhalb** der Genres?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS PX: Genre-Mix bei Besuchen und bei Filmen im Programm; ohne 2020–2021.</p>
      <h3>Modelldefinition</h3>
      <p><strong>Multinomial-Trend für den Genre-Mix</strong></p>
      <dl class="analysis-dl">
        <dt>Identität</dt><dd><code>CH-Gesamtanteil = Σ_g (Mix_g × CH-Erfolg_g)</code></dd>
        <dt>Likelihood</dt><dd><code>Multinomial(N_t, p_t)</code> mit <code>p_t = softmax(η_t)</code>, getrennt für Besuche und Filme</dd>
      </dl>
      <h3>Methode</h3>
      <p class="analysis-prose">Softmax-Trend für Besuchs- und Programm-Mix; algebraische Zerlegung 2014→letztes Jahr (Mix- vs. Erfolgseffekt).</p>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_genremix_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_genremix_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_genremix_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Mehr Dokumentar-Besuche am Markt bedeuten nur dann mehr CH-Besuche insgesamt, wenn im Dokumentar-Segment ein relevanter CH-Anteil besteht. Der Mix allein erklärt den Gesamttrend nicht.</p>
      <p class="analysis-prose">Die Zerlegung zeigt typischerweise einen kleineren Beitrag durch Genre-Umschichtung (Mix) und einen grösseren durch besseres CH-Abschneiden innerhalb der Genres — exakte Werte in der Posterior-Tabelle und in der Zerlegungsgrafik.</p>
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_genremix_bayes:tables-->
      <h3>Grenzen</h3>
      <ul>
        <li>Zerlegung nutzt beobachteten CH-Erfolg je Genre; Mix mit posterior Unsicherheit.</li>
        <li>Deskriptive Aufspaltung, kein kausales SEM.</li>
      </ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_changepoint_bayes">
  <div class="container">
    <div class="section-label">Analyse 03</div>
    <div class="sec-head"><div class="sec-num">03</div><h2>Bayes: Change-Point im CH-Kinoanteil (explorativ)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose"><strong>Hinweis:</strong> Wegen der Pandemielücke ist dieses Modell **explorativ** — für die Kurzstory eignet sich eher der Logit-Trend (Analyse&nbsp;07). Verändert sich der Trend des CH-Besuchsanteils nach der Pandemie mit zusätzlicher Steigung ab τ?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS PX Gesamtmarkt. Schätzjahre ohne 2020–2022 (2022 = instabile Erholung). Die Jahre 2020–2022 sind in der Grafik ausgeblendet (nicht geschätzt); ab 2023 modelliert ein zusätzlicher Trend — nicht als «Bruch» im Jahr 2022.</p>
      <h3>Modelldefinition</h3>
      <p><strong>Change-Point auf logit-Skala</strong></p>
      <dl class="analysis-dl">
        <dt>Link</dt><dd><code>logit(p_t) = α + β₁·(Jahr−Jahr̄) + β₂·(Jahr−Jahr̄)·𝟙[Jahr ≥ 2023]</code></dd>
      </dl>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_changepoint_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_changepoint_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_changepoint_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Nur der <strong>CH-Besuchsanteil</strong> — nicht absolute Kinobesuche (Analyse&nbsp;04). Schätzjahre ohne 2020–2022; τ&nbsp;=&nbsp;2023. 2022: Übergang (Markt ~8,7&nbsp;Mio. Besuche, CH-Anteil ~5 %). Der beobachtete Sprung liegt bei <strong>2023→2024</strong> (~6,3 % → ~8,9 %). Mit ausgeschlossenem 2022 schätzt β₁ den langfristigen Anstieg; ein zusätzlicher linearer β₂-Slope ab τ fängt den konzentrierten Sprung nicht vollständig — in der Grafik als Niveau-Anhebung sichtbar. Gesamtmarkt-Besuche haben keinen gemeinsamen «CH-Change-Point» in diesem Modell.</p>
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_changepoint_bayes:tables-->
      <h3>Grenzen</h3>
      <ul>
        <li>τ fix auf 2023 (nicht geschätzt); 2020–2022 aus der Schätzung — graue Fläche ≠ Break-Jahr.</li>
        <li>β₂ fängt einen konzentrierten Sprung 2023→2024 nicht zuverlässig; Modell fragil.</li>
        <li>Nur CH-Anteil am Besuch — keine Länder- oder Gesamtmarkt-Change-Points.</li>
        <li>Absolute Besuche: Analyse&nbsp;04.</li>
      </ul>
    </div>
  </div>
</section>


<section class="analysis-block" id="ch_absolute_bayes">
  <div class="container">
    <div class="section-label">Analyse 04</div>
    <div class="sec-head"><div class="sec-num">04</div><h2>Bayes: Absolute CH-Besuche (Markt-Offset)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Steigen die **absoluten** CH-Kinobesuche — und wie viel davon kommt von der Markterholung vs. von einer höheren CH-**Rate** (Anteil)?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS PX: CH-Besuche und Kinobesuche gesamt; ohne 2020–2021.</p>
      <h3>Modelldefinition</h3>
      <p><strong>Poisson mit log-Offset</strong></p>
      <dl class="analysis-dl">
        <dt>Likelihood</dt><dd><code>yₜ ~ Poisson(μₜ)</code></dd>
        <dt>Link</dt><dd><code>log(μₜ) = log(Nₜ) + α + β·(Jahr − Jahr̄)</code></dd>
        <dt>Interpretation</dt><dd><code>μₜ = Nₜ · exp(α + β·t)</code></dd>
      </dl>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_absolute_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_absolute_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_absolute_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Anteilsmodelle fragen nur nach dem CH-**Anteil**. Hier: **absolute** Besuche mit Offset Nₜ.</p>
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_absolute_bayes:tables-->
      <h3>Grenzen</h3>
      <ul><li>Poisson ohne Überdispersion.</li><li>Offset nur Gesamtbesuche.</li></ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_gap_bayes">
  <div class="container">
    <div class="section-label">Analyse 05</div>
    <div class="sec-head"><div class="sec-num">05</div><h2>Bayes: Programm-Lücke CH (Angebot vs. Nachfrage)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Wird die Überrepräsentation von CH-Filmen im Programm gegenüber dem Besuchsanteil kleiner?</p>
      <h3>Modelldefinition</h3>
      <p><strong>Trend der Lücke (Prozentpunkte)</strong></p>
      <dl class="analysis-dl">
        <dt>Lücke</dt><dd>Anteil CH-Filme minus Anteil CH-Besuche</dd>
        <dt>Likelihood</dt><dd><code>Lücke_t ~ Normal(μ_t, σ)</code>, <code>μ_t = α + β·(Jahr−Jahr̄)</code></dd>
      </dl>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_gap_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_gap_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_gap_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Die <strong>Lücke</strong> ist die Differenz zweier Anteile: Programmanteil CH minus Besuchsanteil CH, in <strong>Prozentpunkten</strong> (nicht «Prozent» im Sinne von Relativwachstum). Beispiel: 12&nbsp;% Programm und 10,5&nbsp;% Besuche → Lücke 1,5&nbsp;Prozentpunkte.</p>
      <p class="analysis-prose">Positive Lücke: mehr Programmplatz als Publikumsanteil. Der Trend ist fallend: die Lücke schrumpft — das Publikum holt auf. Ob und wann sie <strong>null</strong> wird, zeigt eine <strong>lineare Prognose</strong> aus demselben Modell — mit begrenzter Aussagekraft.</p>
      <h3>Prognose (Lücke = 0?)</h3>
      <!--INJECT:ch_gap_bayes:figure:3-->
      <h3>Kennzahlen &amp; Warnungen</h3>
      <!--INJECT:ch_gap_bayes:metrics-->
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_gap_bayes:tables-->
      <h3>Grenzen</h3>
      <ul>
        <li>Prognose = Trendextrapolation, kein Szenario für Programmpolitik oder Produktion.</li>
        <li>Prozentpunkte ≠ Prozent: Lücke ist Differenz, nicht Quotient.</li>
        <li>Jahresaggregate; keine Genre-Aufteilung der Lücke.</li>
      </ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_weekly_bayes">
  <div class="container">
    <div class="section-label">Analyse 06</div>
    <div class="sec-head"><div class="sec-num">06</div><h2>Bayes: Kinosaison (P4, wöchentlich)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Welche Kinowochen sind für den CH-Anteil am stärksten — mit Unsicherheit?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS P4; Jahre 2019, 2022–2024 (ohne Pandemie).</p>
      <h3>Modelldefinition</h3>
      <p><strong>Binomial + Fourier-Saison</strong></p>
      <dl class="analysis-dl">
        <dt>Link</dt><dd><code>logit(p_w) = α + β·Jahr + Fourier(Woche)</code></dd>
      </dl>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_weekly_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_weekly_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_weekly_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Hunderte Wochen statt Jahresmittel: glatte Saisonkurve mit HDI-Band. CH folgt dem Kinokalender (Dezember/Jahreswechsel, Frühling); Sommerwochen tiefer — nicht weniger CH-Filme, sondern kleinerer Anteil am Wochenpublikum.</p>
      <h3>Grenzen</h3>
      <ul><li>Kein Genre in P4; Wochen über mehrere Jahre gemittelt.</li></ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_forecast_bayes">
  <div class="container">
    <div class="section-label">Analyse 07</div>
    <div class="sec-head"><div class="sec-num">07</div><h2>Bayes: Prognose CH-Besuchsanteil</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Wie hoch könnte der CH-Besuchsanteil 2026–2028 sein, wenn der geschätzte Trend weiterläuft?</p>
      <h3>Modelldefinition</h3>
      <p><strong>Logit-Trend + extrapoliertes p_t</strong></p>
      <h3>MCMC-Konfiguration</h3>
      <!--INJECT:ch_forecast_bayes:mcmc-->
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_forecast_bayes:figures-->
      <h3>Modellgüte (MCMC-Diagnostik)</h3>
      <!--INJECT:ch_forecast_bayes:diagnostics-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Prognose = posterior extrapoliert, keine neuen Beobachtungen. Szenario «Trend geht so weiter» — ohne Streaming-Schocks, Produktionsausfälle oder Krise.</p>
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_forecast_bayes:tables-->
      <h3>Grenzen</h3>
      <ul><li>Keine Einzelfilm-Prognose; Unsicherheit wächst in der Ferne.</li></ul>
    </div>
  </div>
</section>

<section class="analysis-block" id="ch_countries_trend">
  <div class="container">
    <div class="section-label">Analyse 08</div>
    <div class="sec-head"><div class="sec-num">08</div><h2>Länder im Zeitverlauf (PX, deskriptiv)</h2></div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p class="analysis-prose">Wie verschieben sich die Anteile der wichtigsten Herkunftsländer am Kinomarkt über die Jahre — und wo steht die Schweiz im Vergleich zu USA und europäischen Produktionsländern?</p>
      <h3>Daten</h3>
      <p class="analysis-prose">BFS PX, Genre-Total, alle Herkunftsländer je Jahr. Feste Kernländer: Schweiz, USA, Frankreich, Deutschland, UK, Italien; «Übrige Länder» = Rest des Marktes. Kein MCMC — Zeitreihen aus <code>unified.json</code> (<code>country_series</code>).</p>
      <h3>Methode</h3>
      <p class="analysis-prose">Anteil Besuche bzw. Filme am Gesamtmarkt pro Jahr. Ergänzt die Top-Länder-Balken in der <a href="./unified.html#countries">interaktiven Übersicht</a> (dort nur ein Jahr sichtbar).</p>
      <h3>Ergebnisse (Grafiken)</h3>
      <!--INJECT:ch_countries_trend:figures-->
      <h3>Kennzahlen</h3>
      <!--INJECT:ch_countries_trend:metrics-->
      <h3>Posterior-Zusammenfassung</h3>
      <!--INJECT:ch_countries_trend:tables-->
      <h3>Ergebnisse im Detail</h3>
      <p class="analysis-prose">Die USA dominieren den Besuchsanteil über den ganzen Zeitraum; Frankreich und Deutschland bleiben relevante europäische Quellen. Der CH-Besuchsanteil liegt durchgehend unter dem USA-Anteil, steigt aber seit der Pandemie-Erholung (vgl. Logit-Trend, Analyse&nbsp;07). Im Programm ist die Schweiz stärker vertreten als in den Besuchen (vgl. Lücke, Analyse&nbsp;05).</p>
      <p class="analysis-prose">Ein Bayesianisches Länder-Modell (Multinomial-Trend, Partial Pooling) wäre der nächste Schritt für Unsicherheitsbänder — hier bewusst nur die beobachteten Jahresanteile.</p>
      <h3>Grenzen</h3>
      <ul>
        <li>Keine Posterior-Unsicherheit in diesem Block.</li>
        <li>Koproduktionen: ein Herkunftsland pro BFS-Zuordnung.</li>
        <li>«Übrige» bündelt viele kleine Länder.</li>
      </ul>
    </div>
  </div>
</section>

<section class="analysis-block analysis-synthesis" id="gesamtinterpretation">
  <div class="container">
    <div class="section-label">Synthese</div>
    <div class="sec-head"><div class="sec-num">∑</div><h2>Gesamtinterpretation: Schweizer Film am Kino</h2></div>
    <div class="measure analysis-body">
      <p class="analysis-prose analysis-lead">Sieben Bayesianische Modelle plus Länder-Zeitverlauf (deskriptiv): Genre-Erfolg, Genre-Mix, Strukturbruch, absolute Besuche, Programm-Lücke, Wochensaison, Prognose, Top-Länder.</p>
      <p class="analysis-prose">Lesereihenfolge: (1) Genre → (2) Mix → (3) Change-Point (explorativ) → (4) Absolute Besuche → (5) Lücke → (6) Saison → (7) Prognose → (8) Länder.</p>
      <h3>Gemeinsame Story</h3>
      <p class="analysis-prose">CH wächst in Fiktion und Dokumentar; der Gesamt-CH-Anteil steigt vor allem durch Erfolg in den Genres, nicht durch Genre-Umschichtung. Der Sprung in den Rohdaten liegt bei 2023→2024; Change-Point nur explorativ. Programm-Lücke schrumpft. Am Länder-Markt dominieren USA; CH holt beim Besuchsanteil auf. Saison und Prognose — mit allen Caveats.</p>
      <h3>Grenzen (alle Modelle)</h3>
      <ul>
        <li>Jahres- bzw. Wochenaggregate BFS — kein Film-Level.</li>
        <li>2020–2021 in Jahresmodellen ausgeschlossen.</li>
        <li>Absolute Besuche mit Markt-Offset in Analyse 04.</li>
        <li><strong>Pd</strong> (Richtungswahrscheinlichkeit, Probability of Direction) — nicht p-Wert.</li>
        <li><strong>HDI</strong> — höchstes posteriores Dichtheitsintervall (Highest Density Interval), hier 95&nbsp;%.</li>
      </ul>
    </div>
  </div>
</section>
