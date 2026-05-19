import CountryFlag from "./CountryFlag.jsx";

function pctDirection(pct) {
  if (!pct || typeof pct !== "string") return null;
  const t = pct.trim();
  if (t.startsWith("↑")) return "up";
  if (t.startsWith("↓")) return "down";
  if (t.startsWith("+")) return "up";
  if (t.startsWith("-")) return "down";
  return null;
}

export function KpiCardLabel({ label }) {
  return (
    <div className="k kpi-card-label">
      <span>{label}</span>
    </div>
  );
}

export default function KpiCard({ card }) {
  const dir = pctDirection(card.pct);
  const showFlag = Boolean(card.showChFlag);

  return (
    <div className={`stat-card${showFlag ? " stat-card--ch" : ""}`} role="listitem">
      <div className="v">
        {showFlag ? (
          <span className="kpi-value-with-flag">
            <CountryFlag label="Schweiz" iso="CH" size={16} className="kpi-card-flag" />
            <span>{card.value}</span>
          </span>
        ) : (
          card.value
        )}
      </div>
      {card.pct ? (
        <div className={`stat-pct${dir ? ` stat-pct--${dir}` : ""}`}>
          <span className="stat-pct-delta">{card.pct}</span>
          <span className="stat-pct-context"> ggü. Vorjahr</span>
        </div>
      ) : null}
      <KpiCardLabel label={card.label} />
    </div>
  );
}
