import CountryFlag from "./CountryFlag.jsx";

export default function CategoryLegend({ rows, colors, useFlags = false }) {
  return (
    <ul className="category-legend" aria-label="Legende">
      {rows.map((r) => (
        <li key={r.id ?? r.label}>
          <span className="swatch" style={{ background: colors[r.id] ?? "#b5542a" }} aria-hidden="true" />
          {useFlags ? (
            <span className="legend-label-with-flag">
              <CountryFlag label={r.label} size={18} />
              <span>{r.label}</span>
            </span>
          ) : (
            r.label
          )}
        </li>
      ))}
    </ul>
  );
}
