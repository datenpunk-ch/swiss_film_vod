import { pctFmt } from "../utils/format.js";

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

function TooltipMetricRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <li className="chart-tooltip-row">
      <span className="chart-tooltip-label">{label}</span>
      <strong className="chart-tooltip-value">{value}</strong>
    </li>
  );
}

/** Einzelne Zeitreihe: Berechnet, dann Daten. */
export function BayesSingleTooltip({ active, payload, label, yFormat = "percent" }) {
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
  const obs = row.obs;

  return (
    <div className="chart-tooltip chart-tooltip--bayes">
      <p className="chart-tooltip-title">
        {year}
        {isForecast ? <span className="chart-tooltip-forecast"> · Prognose</span> : null}
      </p>
      <ul className="chart-tooltip-list chart-tooltip-list--metrics">
        <TooltipMetricRow label="Berechnet" value={Number.isFinite(mean) ? fmt(mean) : null} />
        <TooltipMetricRow label="Daten" value={Number.isFinite(obs) ? fmt(obs) : null} />
      </ul>
    </div>
  );
}

/** Mehrere Länder/Genres: je Serie Berechnet, dann Daten. */
export function BayesMultiTooltip({ active, payload, label, series = [], yFormat = "percent" }) {
  if (!active) return null;
  const row = tooltipRow(payload);
  if (!row) return null;

  const fmt = (v) => formatBayesValue(yFormat, v);
  const year = Number.isFinite(Number(row.year)) ? row.year : label;

  const entries = series
    .map((s) => {
      const mean = row[`${s.id}_mean`];
      const obs = row[`${s.id}_obs`];
      if (![mean, obs].some((v) => Number.isFinite(v))) return null;
      return { s, mean, obs };
    })
    .filter(Boolean);

  if (!entries.length) return null;

  return (
    <div className="chart-tooltip chart-tooltip--bayes">
      <p className="chart-tooltip-title">{year}</p>
      <ul className="chart-tooltip-list chart-tooltip-list--series">
        {entries.map(({ s, mean, obs }) => (
          <li key={s.id} className="chart-tooltip-series">
            <div className="chart-tooltip-series-head">
              <span className="chart-tooltip-dot" style={{ background: s.color }} aria-hidden="true" />
              <span>{s.label}</span>
            </div>
            <ul className="chart-tooltip-list chart-tooltip-list--metrics">
              <TooltipMetricRow label="Berechnet" value={Number.isFinite(mean) ? fmt(mean) : null} />
              <TooltipMetricRow label="Daten" value={Number.isFinite(obs) ? fmt(obs) : null} />
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
