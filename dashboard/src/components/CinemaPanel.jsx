import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "../utils/format.js";

const CHART_COLORS = {
  accent: "#b5542a",
  grid: "#d6d6d6",
  muted: "#55606a",
};

export default function CinemaPanel({ cinema }) {
  const years = useMemo(
    () => [...new Set(cinema.weekly.map((w) => w.year))].sort((a, b) => b - a),
    [cinema]
  );
  const [year, setYear] = useState(years[0]);

  const weekly = useMemo(
    () =>
      cinema.weekly
        .filter((w) => w.year === year)
        .map((w) => ({
          week: w.week,
          label: `KW ${w.week}`,
          admissions: w.admissions,
        })),
    [cinema, year]
  );

  const total = weekly.reduce((s, w) => s + w.admissions, 0);

  return (
    <section className="panel" aria-labelledby="cinema-heading">
      <div className="panel-label" id="cinema-heading">
        Kinobesuche
      </div>
      <div className="controls">
        <label htmlFor="cinemaYear">Jahr</label>
        <select
          id="cinemaYear"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="Kalenderjahr Kinobesuche"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weekly} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
            />
            <YAxis
              tickFormatter={(v) => fmt.format(v)}
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value) => [fmt.format(value), "Besuche"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ""}
              contentStyle={{
                border: "2px solid #d6d6d6",
                borderRadius: 0,
                fontFamily: "Karla, sans-serif",
              }}
            />
            <Line
              type="monotone"
              dataKey="admissions"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-caption">
        {year}: {weekly.length} Wochen, Summe {fmt.format(total)} Besuche.
      </p>
    </section>
  );
}
