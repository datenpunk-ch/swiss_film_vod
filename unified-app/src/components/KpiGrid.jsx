import { formatVsMarketDelta, formatYoYCount, formatYoYSharePp, intFmt, pctFmt } from "../utils/format.js";

function KpiCard({ card }) {
  return (
    <div className="stat-card" role="listitem">
      <div className="v">{card.value}</div>
      {card.pct ? <div className="stat-pct">{card.pct}</div> : null}
      <div className="k">{card.label}</div>
    </div>
  );
}

export default function KpiGrid({ pxRow, prevPxRow, year }) {
  if (!pxRow?.market) return null;

  const m = pxRow.market;
  const ch = pxRow.switzerland ?? {};
  const pm = prevPxRow?.market;
  const pch = prevPxRow?.switzerland ?? {};
  const marketIntensity = m.intensity ?? 0;
  const chIntensity = ch.intensity ?? 0;

  const chIntensityPct = [
    formatYoYCount(chIntensity, pch?.intensity),
    marketIntensity > 0 && chIntensity
      ? `${formatVsMarketDelta(chIntensity / marketIntensity)} ggü. Markt-Ø`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const groups = [
    {
      key: "market",
      label: "Markt",
      cards: [
        {
          key: "demand",
          label: "Kinobesuche",
          value: intFmt.format(m.demand),
          pct: formatYoYCount(m.demand, pm?.demand),
        },
        {
          key: "supply",
          label: "Filme im Programm",
          value: intFmt.format(m.supply),
          pct: formatYoYCount(m.supply, pm?.supply),
        },
        {
          key: "intensity",
          label: "Ø Besuche je Film",
          value: marketIntensity ? intFmt.format(Math.round(marketIntensity)) : "—",
          pct: formatYoYCount(marketIntensity, pm?.intensity),
        },
      ],
    },
    {
      key: "ch",
      label: "Schweiz",
      cards: [
        {
          key: "ch-demand",
          label: "Anteil Besuche",
          value: pctFmt.format(ch.share_demand ?? 0),
          pct: formatYoYSharePp(ch.share_demand, pch?.share_demand),
        },
        {
          key: "ch-supply",
          label: "Anteil Filme",
          value: pctFmt.format(ch.share_supply ?? 0),
          pct: formatYoYSharePp(ch.share_supply, pch?.share_supply),
        },
        {
          key: "ch-intensity",
          label: "Ø Besuche je CH-Film",
          value: chIntensity ? intFmt.format(Math.round(chIntensity)) : "—",
          pct: chIntensityPct || null,
        },
      ],
    },
  ];

  return (
    <section className="kpi-section" aria-labelledby="kpi-heading">
      <div className="panel-label" id="kpi-heading">
        Kennzahlen {year ? `· ${year}` : ""}
      </div>
      <div className="kpi-groups">
        {groups.map((group) => (
          <div key={group.key} className="kpi-row-group">
            <div className="kpi-row-label">{group.label}</div>
            <div className="stat-grid" role="list">
              {group.cards.map((card) => (
                <KpiCard key={card.key} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
