/** Embed-Panel → Analyse-ID in analysis_report.json */
export const BAYES_PANEL_ANALYSIS = {
  forecast: "ch_forecast_bayes",
  countries: "ch_countries_bayes",
  chgenre: "ch_genre_bayes",
  gap: "ch_gap_bayes",
};

export function isBayesEmbedPanel(panel) {
  return panel in BAYES_PANEL_ANALYSIS;
}
