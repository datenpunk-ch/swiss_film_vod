import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, pctFmt } from "../utils/format.js";

const COLORS = {
  ch: "#b5542a",
  eu: "#c4896e",
  ww: "#e5d4c8",
  grid: "#d6d6d6",
  muted: "#55606a",
};

export default function VodPanel({ vod }) {
  const series = vod.series.map((s) => ({
    year: s.year,
    Schweiz: s.och,
    Europa: s.oep,
    Welt: s.oot,
    total: s.total,
    share_ch: s.share_ch,
  }));

  const last = vod.series[vod.series.length - 1];

  return (
    <section className="panel" aria-labelledby="vod-heading">
      <div className="panel-label" id="vod-heading">
        VoD — Kauf (EST)
      </div>
      <p className="panel-intro">
        Gestapelte Views nach Herkunft: Schweiz, Europa (ohne CH), übrige Welt. Datenquelle: BFS
        StatVoD.
      </p>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              tickFormatter={(v) => fmt.format(v)}
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value, name) => [fmt.format(value), name]}
              contentStyle={{
                border: "2px solid #d6d6d6",
                borderRadius: 0,
                fontFamily: "Karla, sans-serif",
              }}
            />
            <Bar dataKey="Schweiz" stackId="vod" fill={COLORS.ch} />
            <Bar dataKey="Europa" stackId="vod" fill={COLORS.eu} />
            <Bar dataKey="Welt" stackId="vod" fill={COLORS.ww} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend" aria-hidden="true">
        <span className="lg-ch">Schweiz</span>
        <span className="lg-eu">Europa (ohne CH)</span>
        <span className="lg-ww">Übrige Welt</span>
      </div>
      <p className="chart-caption">
        Letztes Jahr {last.year}: {fmt.format(last.total)} EST-Views gesamt, davon{" "}
        {pctFmt.format(last.share_ch)} Schweiz.
      </p>
    </section>
  );
}
