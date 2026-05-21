/** Flache Zeilen für Recharts aus Bayes-chart JSON. */

export function covidYearSet(chart) {
  return new Set((chart?.covidYears ?? []).map(Number));
}

export function isCovidYear(chart, year) {
  return covidYearSet(chart).has(Number(year));
}

export function splitObserved(year, value, covidYears) {
  const yr = Number(year);
  const v = value != null && value !== "" ? Number(value) : NaN;
  if (!Number.isFinite(v)) return { obs: null, obsCovid: null };
  if (covidYears.has(yr)) return { obs: null, obsCovid: v };
  return { obs: v, obsCovid: null };
}

export function mergeBandRows(band, observed, covidYears = new Set()) {
  const years = band?.years ?? [];
  const obsByYear = new Map();
  if (observed?.years?.length) {
    observed.years.forEach((yr, i) => {
      obsByYear.set(Number(yr), observed.value?.[i] ?? null);
    });
  }
  return years.map((year, i) => {
    const y = Number(year);
    const rawObs = obsByYear.has(y) ? obsByYear.get(y) : null;
    const { obs, obsCovid } = splitObserved(y, rawObs, covidYears);
    return {
      year: y,
      mean: band.mean?.[i] ?? null,
      lo: band.lo?.[i] ?? null,
      hi: band.hi?.[i] ?? null,
      band: (band.hi?.[i] ?? 0) - (band.lo?.[i] ?? 0),
      obs,
      obsCovid,
      phase: "hist",
    };
  });
}

/** Beobachtete Pandemie-Jahre, die nicht in hist liegen (Modell ohne 2020–2021). */
export function covidObsRows(chart) {
  const covidYears = covidYearSet(chart);
  const histYears = new Set((chart.hist?.years ?? []).map(Number));
  const rows = [];
  if (!chart.observed?.years?.length) return rows;
  chart.observed.years.forEach((yr, i) => {
    const year = Number(yr);
    if (!covidYears.has(year) || histYears.has(year)) return;
    const rawObs = chart.observed.value?.[i] ?? null;
    const { obsCovid } = splitObserved(year, rawObs, covidYears);
    if (!Number.isFinite(obsCovid)) return;
    rows.push({
      year,
      mean: null,
      lo: null,
      hi: null,
      band: null,
      obs: null,
      obsCovid,
      phase: "covid",
    });
  });
  return rows.sort((a, b) => a.year - b.year);
}

export function mergeForecastChart(chart) {
  const covidYears = covidYearSet(chart);
  const hist = mergeBandRows(chart.hist, chart.observed, covidYears);
  const covidOnly = covidObsRows(chart);
  const fut = mergeBandRows(chart.forecast, null, covidYears).map((r) => ({
    ...r,
    obs: null,
    obsCovid: null,
    phase: "forecast",
  }));
  return [...hist, ...covidOnly, ...fut];
}

export function yearTicks(rows) {
  const years = [...new Set(rows.map((r) => r.year).filter(Number.isFinite))].sort((a, b) => a - b);
  return years.map((y) => (Number.isInteger(y) ? y : Math.round(y)));
}
