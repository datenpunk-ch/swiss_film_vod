import { useMemo } from "react";
import { buildCountryColorMap } from "../utils/countryColors.js";
import { indexRowsById } from "../utils/format.js";
import ShareStackChart from "./ShareStackChart.jsx";

function rowsForYear(data, series, year, shareField) {
  const row = data.find((r) => r.year === year);
  if (!row) return [];
  return series
    .map((s) => ({
      id: s.key,
      label: s.label,
      share_demand: shareField === "share_demand" ? Number(row[s.key]) || 0 : 0,
      share_supply: shareField === "share_supply" ? Number(row[s.key]) || 0 : 0,
    }))
    .filter((r) => (shareField === "share_demand" ? r.share_demand : r.share_supply) > 0.0001);
}

/** Pro Jahr dieselbe Darstellung wie «Top-Länder» im Einjahres-Block (Flaggen + Prozent). */
export default function CountryYearShareGrid({
  data = [],
  series = [],
  colors: colorsProp,
  metric = "demand",
}) {
  const shareField = metric === "supply" ? "share_supply" : "share_demand";

  const colors = useMemo(
    () => colorsProp ?? buildCountryColorMap(series.map((s) => ({ id: s.key, label: s.label }))),
    [colorsProp, series]
  );

  const years = useMemo(
    () =>
      [...new Set((data ?? []).map((r) => r.year).filter((y) => Number.isFinite(y)))].sort(
        (a, b) => a - b
      ),
    [data]
  );

  const prevByYear = useMemo(() => {
    const map = new Map();
    for (let i = 1; i < years.length; i++) {
      const year = years[i];
      const prevYear = years[i - 1];
      map.set(year, indexRowsById(rowsForYear(data, series, prevYear, shareField)));
    }
    return map;
  }, [data, series, years, shareField]);

  if (!years.length || !series.length) {
    return <p className="panel-intro">Keine Jahresdaten.</p>;
  }

  return (
    <div className="country-year-share-grid" role="region" aria-label="Top-Länder nach Jahr">
      {years.map((year) => (
        <div key={year} className="country-year-cell">
          <p className="country-year-heading">{year}</p>
          <ShareStackChart
            rows={rowsForYear(data, series, year, shareField)}
            colors={colors}
            metric={metric}
            useFlags
            prevRowById={prevByYear.get(year)}
          />
        </div>
      ))}
    </div>
  );
}
