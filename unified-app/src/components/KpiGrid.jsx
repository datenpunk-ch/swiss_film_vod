import { intFmt, pctFmt } from "../utils/format.js";

export default function KpiGrid({ pxRow, year }) {
  if (!pxRow?.market) return null;

  const m = pxRow.market;
  const ch = pxRow.switzerland ?? {};
  const marketIntensity = m.intensity ?? 0;
  const chIntensity = ch.intensity ?? 0;

  const cards = [
    { key: "demand", label: "Kinobesuche (Markt)", value: intFmt.format(m.demand) },
    { key: "supply", label: "Filme im Programm", value: intFmt.format(m.supply) },
    {
      key: "intensity",
      label: "Ø Eintritte je Film",
      value: marketIntensity ? intFmt.format(Math.round(marketIntensity)) : "—",
    },
    { key: "ch-demand", label: "CH-Anteil (Eintritte)", value: pctFmt.format(ch.share_demand ?? 0) },
    { key: "ch-supply", label: "CH-Anteil (Filme)", value: pctFmt.format(ch.share_supply ?? 0) },
    {
      key: "ch-intensity",
      label: "Ø Eintritte je CH-Film",
      value: chIntensity ? intFmt.format(Math.round(chIntensity)) : "—",
      pct:
        marketIntensity > 0 && chIntensity
          ? `${pctFmt.format(chIntensity / marketIntensity)} vom Markt-Ø`
          : null,
    },
  ];

  return (
    <section className="kpi-section" aria-labelledby="kpi-heading">
      <div className="panel-label" id="kpi-heading">
        Kennzahlen {year ? `· ${year}` : ""}
      </div>
      <div className="stat-grid" role="list">
        {cards.map((c) => (
          <div className="stat-card" role="listitem" key={c.key}>
            <div className="v">{c.value}</div>
            {c.pct ? <div className="stat-pct">{c.pct}</div> : null}
            <div className="k">{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
