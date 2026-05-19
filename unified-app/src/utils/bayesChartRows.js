/** Flache Zeilen für Recharts aus Bayes-chart JSON. */
export function mergeBandRows(band, observed) {
  const years = band?.years ?? [];
  const obsByYear = new Map();
  if (observed?.years?.length) {
    observed.years.forEach((y, i) => {
      obsByYear.set(Number(y), observed.value?.[i] ?? null);
    });
  }
  return years.map((year, i) => ({
    year: Number(year),
    mean: band.mean?.[i] ?? null,
    lo: band.lo?.[i] ?? null,
    hi: band.hi?.[i] ?? null,
    band: (band.hi?.[i] ?? 0) - (band.lo?.[i] ?? 0),
    obs: obsByYear.has(Number(year)) ? obsByYear.get(Number(year)) : null,
  }));
}

export function mergeForecastChart(chart) {
  const hist = mergeBandRows(chart.hist, chart.observed);
  const fut = mergeBandRows(chart.forecast, null).map((r) => ({ ...r, obs: null, phase: "forecast" }));
  const histRows = hist.map((r) => ({ ...r, phase: "hist" }));
  return [...histRows, ...fut];
}

export function yearTicks(rows) {
  const years = [...new Set(rows.map((r) => r.year).filter(Number.isFinite))].sort((a, b) => a - b);
  return years.map((y) => (Number.isInteger(y) ? y : Math.round(y)));
}
