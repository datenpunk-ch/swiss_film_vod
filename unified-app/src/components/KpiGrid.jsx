import KpiCard from "./KpiCard.jsx";
import {
  formatDeltaPercentWithArrow,
  formatYoYCount,
  formatYoYSharePp,
  intFmt,
  pctFmt,
} from "../utils/format.js";

export default function KpiGrid({ pxRow, prevPxRow, year }) {
  if (!pxRow?.market) return null;

  const m = pxRow.market;
  const ch = pxRow.switzerland ?? {};
  const pm = prevPxRow?.market;
  const pch = prevPxRow?.switzerland ?? {};
  const marketIntensity = m.intensity ?? 0;
  const chIntensity = ch.intensity ?? 0;

  const chIntensityYoY = formatYoYCount(chIntensity, pch?.intensity);
  const chVsMarket =
    marketIntensity > 0 && chIntensity
      ? formatDeltaPercentWithArrow(chIntensity / marketIntensity, 1)
      : null;
  const chIntensityPct = [chIntensityYoY, chVsMarket ? `${chVsMarket} ggü. Markt-Ø` : null]
    .filter(Boolean)
    .join(" · ");

  const columns = [
    {
      key: "demand",
      market: {
        key: "demand",
        label: "Kinobesuche",
        value: intFmt.format(m.demand),
        pct: formatYoYCount(m.demand, pm?.demand),
      },
      ch: {
        key: "ch-demand",
        label: "Anteil Besuche",
        showChFlag: true,
        value: pctFmt.format(ch.share_demand ?? 0),
        pct: formatYoYSharePp(ch.share_demand, pch?.share_demand),
      },
    },
    {
      key: "supply",
      market: {
        key: "supply",
        label: "Filme im Programm",
        value: intFmt.format(m.supply),
        pct: formatYoYCount(m.supply, pm?.supply),
      },
      ch: {
        key: "ch-supply",
        label: "Anteil Filme",
        showChFlag: true,
        value: pctFmt.format(ch.share_supply ?? 0),
        pct: formatYoYSharePp(ch.share_supply, pch?.share_supply),
      },
    },
    {
      key: "intensity",
      market: {
        key: "intensity",
        label: "Interesse (Ø Besuche/Film)",
        value: marketIntensity ? intFmt.format(Math.round(marketIntensity)) : "—",
        pct: formatYoYCount(marketIntensity, pm?.intensity),
      },
      ch: {
        key: "ch-intensity",
        label: "Interesse (Ø Besuche/Film)",
        showChFlag: true,
        value: chIntensity ? intFmt.format(Math.round(chIntensity)) : "—",
        pct: chIntensityPct || null,
      },
    },
  ];

  return (
    <section className="kpi-section" aria-labelledby="kpi-heading">
      <div className="panel-label visually-hidden" id="kpi-heading">
        Kennzahlen {year ? `· ${year}` : ""}
      </div>
      <div className="kpi-grid-split" role="list">
        {columns.map((col) => (
          <div className="kpi-grid-pair" role="group" key={col.key}>
            <KpiCard card={col.market} />
            <KpiCard card={col.ch} />
          </div>
        ))}
      </div>
    </section>
  );
}
