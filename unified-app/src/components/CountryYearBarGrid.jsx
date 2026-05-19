import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, DIMMED_SERIES_OPACITY, PALETTE, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import { buildCountryColorMap } from "../utils/countryColors.js";
import { withAlpha } from "../utils/colorAlpha.js";
import { flagImageUrls, isoForCountry } from "../utils/countryFlags.js";
import { pctFmt } from "../utils/format.js";
import { isDimmedYear, yearHeadingLabel } from "../utils/yearDisplay.js";
import ChartBox from "./ChartBox.jsx";
import ChartResponsive from "./ChartResponsive.jsx";

const MARGIN = { top: 22, right: 6, left: 2, bottom: 4 };
const COL_HEIGHT = 220;
const MIN_LABEL_SHARE = 0.07;

function rowsForYear(data, series, year) {
  const row = data.find((r) => r.year === year);
  if (!row) return [];
  return series
    .map((s) => ({
      id: s.key,
      label: s.label,
      share: Number(row[s.key]) || 0,
    }))
    .filter((r) => r.share > 0.0001)
    .sort((a, b) => b.share - a.share);
}

function CountryFlagTick({ x, y, payload, dimmed }) {
  const label = payload?.value;
  if (label == null || x == null || y == null) return null;
  const muted = dimmed ? 0.45 : 1;

  if (label === "Übrige Länder" || label === "Andere") {
    return (
      <text x={x} y={y + 14} textAnchor="middle" fontSize={8} fill={PALETTE.muted} opacity={muted}>
        Übr.
      </text>
    );
  }

  const iso = isoForCountry(label);
  const url = iso ? flagImageUrls(iso, 40)[0] : null;
  if (!url) {
    return (
      <text x={x} y={y + 12} textAnchor="middle" fontSize={7} fill={PALETTE.muted} opacity={muted}>
        {String(label).slice(0, 3)}
      </text>
    );
  }

  return <image href={url} x={x - 14} y={y + 4} width={28} height={19} opacity={muted} />;
}

function ShareTopLabel({ x, y, width, value }) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < MIN_LABEL_SHARE || x == null || y == null || width == null) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      fontSize={9}
      fill={PALETTE.ink}
      pointerEvents="none"
    >
      {pctFmt.format(n)}
    </text>
  );
}

function CountryYearColumn({ year, rows, colors, dimmedYears }) {
  const dimmed = isDimmedYear(year, dimmedYears);
  const yMax = useMemo(() => {
    const m = Math.max(0, ...rows.map((r) => r.share));
    return m > 0 ? Math.min(1, m * 1.18) : 1;
  }, [rows]);

  return (
    <div className={`country-year-bar-cell${dimmed ? " is-dimmed-year" : ""}`}>
      <p className="country-year-heading">{yearHeadingLabel(year, dimmedYears)}</p>
      {!rows.length ? (
        <p className="country-year-empty">Keine Anteile</p>
      ) : (
        <ChartBox height={COL_HEIGHT}>
          <ChartResponsive height={COL_HEIGHT}>
            <BarChart data={rows} margin={MARGIN} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="2 4" stroke={PALETTE.gridLight} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: PALETTE.axis }}
                interval={0}
                height={32}
                tick={<CountryFlagTick dimmed={dimmed} />}
              />
              <YAxis
                type="number"
                domain={[0, yMax]}
                width={34}
                tick={{ ...AXIS.tick, fontSize: 8, fill: dimmed ? PALETTE.axis : PALETTE.muted }}
                tickMargin={2}
                tickLine={false}
                tickFormatter={(v) => pctFmt.format(v)}
                axisLine={false}
              />
              <Tooltip
                wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                formatter={(value, name) => [pctFmt.format(Number(value)), name]}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="share" name="Anteil" isAnimationActive={false} maxBarSize={28} minPointSize={2}>
                {rows.map((entry) => {
                  const base = colors[entry.id] ?? colors[entry.label] ?? PALETTE.ink;
                  return (
                    <Cell
                      key={entry.id}
                      fill={dimmed ? withAlpha(base, DIMMED_SERIES_OPACITY) : base}
                    />
                  );
                })}
                <LabelList dataKey="share" content={<ShareTopLabel />} />
              </Bar>
            </BarChart>
          </ChartResponsive>
        </ChartBox>
      )}
    </div>
  );
}

/** Pro Jahr: vertikale Balken, nach Anteil sortiert, Flaggen an der X-Achse, Prozent auf dem Balken. */
export default function CountryYearBarGrid({
  data = [],
  series = [],
  colors: colorsProp,
  metric: _metric = "demand",
  dimmedYears,
  allYears,
}) {
  const colors = useMemo(
    () => colorsProp ?? buildCountryColorMap(series.map((s) => ({ id: s.key, label: s.label }))),
    [colorsProp, series]
  );

  const colorById = useMemo(() => {
    const map = { ...colors };
    for (const s of series) {
      if (s.color) map[s.key] = s.color;
    }
    return map;
  }, [colors, series]);

  const years = useMemo(() => {
    const fromData = [...new Set((data ?? []).map((r) => r.year).filter((y) => Number.isFinite(y)))];
    const union = new Set([...(allYears ?? []), ...fromData]);
    return [...union].sort((a, b) => a - b);
  }, [data, allYears]);

  if (!years.length || !series.length) {
    return <p className="panel-intro">Keine Jahresdaten.</p>;
  }

  return (
    <div className="country-year-bar-grid" role="region" aria-label="Top-Länder nach Jahr">
      {years.map((year) => (
        <CountryYearColumn
          key={year}
          year={year}
          rows={rowsForYear(data, series, year)}
          colors={colorById}
          dimmedYears={dimmedYears}
        />
      ))}
    </div>
  );
}
