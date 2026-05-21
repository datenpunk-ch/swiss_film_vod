import { pctFmt } from "../utils/format.js";
import { isoForCountry } from "../utils/countryFlags.js";
import CountryFlag from "./CountryFlag.jsx";
import BayesTooltipFrame from "./BayesTooltipFrame.jsx";

const COUNTRY_ID_TO_ISO = {
  ch: "CH",
  us: "US",
  fr: "FR",
  de: "DE",
  uk: "GB",
  it: "IT",
};

export function formatBayesValue(yFormat, value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "—";
  if (yFormat === "pp") {
    return `${v.toLocaleString("de-CH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Pp.`;
  }
  return pctFmt.format(v / 100);
}

function tooltipRow(payload) {
  return payload?.find((p) => p?.payload)?.payload ?? null;
}

function seriesLabelCell(s, flagsOnly) {
  if (flagsOnly) {
    const iso = COUNTRY_ID_TO_ISO[s.id] ?? isoForCountry(s.label);
    if (iso) {
      return (
        <span className="chart-tooltip-series-inner">
          <CountryFlag iso={iso} size={18} className="chart-tooltip-flag" />
        </span>
      );
    }
  }
  return (
    <span className="chart-tooltip-series-inner chart-tooltip-series-inner--label">
      <span className="chart-tooltip-dot" style={{ background: s.color }} aria-hidden="true" />
      <span className="chart-tooltip-series-text">{s.label}</span>
    </span>
  );
}

function TooltipMetricTable({ rows }) {
  const visible = rows.filter((r) => r.value != null && r.value !== "");
  if (!visible.length) return null;
  return (
    <table className="chart-tooltip-table chart-tooltip-table--single">
      <colgroup>
        <col className="col-label" />
        <col className="col-value" />
      </colgroup>
      <tbody>
        {visible.map((r) => (
          <tr key={r.label}>
            <th scope="row" className="chart-tooltip-metric-label">
              {r.label}
            </th>
            <td className="chart-tooltip-num">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Einzelne Zeitreihe: Berechnet, optional HDI bei Prognose, dann Daten. */
export function BayesSingleTooltip({
  active,
  payload,
  label,
  coordinate,
  yFormat = "percent",
  showForecastHdi = false,
}) {
  if (!active) return null;
  const row = tooltipRow(payload);
  if (!row) return null;

  const fmt = (v) => formatBayesValue(yFormat, v);
  const year = Number.isFinite(Number(row.year)) ? row.year : label;
  const isForecast = row.phase === "forecast";
  const mean = Number.isFinite(row.mean)
    ? row.mean
    : Number.isFinite(row.futMean)
      ? row.futMean
      : row.histMean;
  const obsCovid = row.obsCovid;
  const obs = Number.isFinite(row.obs) ? row.obs : obsCovid;
  const covidOnly = row.phase === "covid" || (Number.isFinite(obsCovid) && !Number.isFinite(mean));
  const lo = Number.isFinite(row.lo) ? row.lo : row.futLo;
  const hi = Number.isFinite(row.hi) ? row.hi : row.futHi;

  const metricRows = [
    { label: "Berechnet", value: Number.isFinite(mean) ? fmt(mean) : null },
  ];
  if (showForecastHdi && isForecast && Number.isFinite(lo) && Number.isFinite(hi)) {
    metricRows.push({ label: "95 %-HDI", value: `${fmt(lo)} – ${fmt(hi)}` });
  }
  metricRows.push({ label: "Daten", value: Number.isFinite(obs) ? fmt(obs) : null });

  return (
    <BayesTooltipFrame active={active} coordinate={coordinate}>
      <p className="chart-tooltip-title">
        {year}
        {isForecast ? <span className="chart-tooltip-forecast"> · Prognose</span> : null}
        {covidOnly ? <span className="chart-tooltip-covid"> · Pandemie (nur Daten)</span> : null}
      </p>
      <TooltipMetricTable rows={metricRows} />
    </BayesTooltipFrame>
  );
}

/** Mehrere Länder/Genres: Länder mit Flagge, Genres mit Text. */
export function BayesMultiTooltip({
  active,
  payload,
  label,
  coordinate,
  series = [],
  yFormat = "percent",
  flagsOnly = false,
}) {
  if (!active) return null;
  const row = tooltipRow(payload);
  if (!row) return null;

  const fmt = (v) => formatBayesValue(yFormat, v);
  const year = Number.isFinite(Number(row.year)) ? row.year : label;

  const entries = series
    .map((s) => {
      const mean = row[`${s.id}_mean`];
      const obsCovid = row[`${s.id}_obsCovid`];
      const obs = Number.isFinite(row[`${s.id}_obs`]) ? row[`${s.id}_obs`] : obsCovid;
      if (![mean, obs].some((v) => Number.isFinite(v))) return null;
      return { s, mean, obs, covidOnly: Number.isFinite(obsCovid) && !Number.isFinite(mean) };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dm = Number(b.mean) - Number(a.mean);
      if (Number.isFinite(dm) && Math.abs(dm) > 1e-9) return dm;
      const dObs = Number(b.obs) - Number(a.obs);
      if (Number.isFinite(dObs) && Math.abs(dObs) > 1e-9) return dObs;
      return String(a.s.id).localeCompare(String(b.s.id), "de");
    });

  if (!entries.length) return null;

  const tableMod = flagsOnly ? " chart-tooltip-table--flags" : "";

  return (
    <BayesTooltipFrame active={active} coordinate={coordinate} variant="multi">
      <p className="chart-tooltip-title">
        {year}
        {entries.every((e) => e.covidOnly) ? (
          <span className="chart-tooltip-covid"> · Pandemie (nur Daten)</span>
        ) : null}
      </p>
      <table className={`chart-tooltip-table chart-tooltip-table--multi${tableMod}`}>
        <colgroup>
          <col className="col-series" />
          <col className="col-value" />
          <col className="col-value" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" aria-hidden="true" />
            <th scope="col">Berechnet</th>
            <th scope="col">Daten</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ s, mean, obs }) => (
            <tr key={s.id}>
              <th scope="row" className="chart-tooltip-series-name" aria-label={s.label}>
                {seriesLabelCell(s, flagsOnly)}
              </th>
              <td className="chart-tooltip-num">{Number.isFinite(mean) ? fmt(mean) : "—"}</td>
              <td className="chart-tooltip-num">{Number.isFinite(obs) ? fmt(obs) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BayesTooltipFrame>
  );
}
