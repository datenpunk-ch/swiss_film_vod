import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import ChartBox from "./ChartBox.jsx";
import ChartResponsive from "./ChartResponsive.jsx";
import ChartTooltip from "./ChartTooltip.jsx";

const MARGIN = { top: 16, right: 24, left: 56, bottom: 44 };

export default function WeeklyAdmissionsChart({ profile, years, height = 280 }) {
  const data = (profile ?? []).map((p) => ({
    week: p.week,
    label: `Kinowoche ${p.week}`,
    admissions: p.admissions ?? p.mean_admissions ?? 0,
    share: p.share ?? 0,
  }));

  if (!data.length) {
    return <p className="panel-intro">Keine Wochendaten (P4) vorhanden.</p>;
  }

  const subtitle = years?.length ? `Mittel über ${years.join(", ")}` : "";
  const intFmt = new Intl.NumberFormat("de-CH");

  return (
    <div className="weekly-chart-wrap">
      {subtitle ? <p className="chart-subtitle">{subtitle}</p> : null}
      <ChartBox height={height}>
        <ChartResponsive height={height}>
          <BarChart data={data} barCategoryGap="8%" margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="week"
              tick={{ ...AXIS.tick, fontSize: 10 }}
              tickMargin={AXIS.tickMargin}
              interval={3}
            >
              <Label value="Kinowoche" position="bottom" offset={12} style={{ fontSize: 11, fill: "#55606a" }} />
            </XAxis>
            <YAxis
              tick={AXIS.tick}
              tickMargin={6}
              tickFormatter={(v) => intFmt.format(v)}
              width={56}
              domain={[0, (max) => (max > 0 ? max * 1.05 : 1)]}
              axisLine={{ stroke: "#b0b0b0" }}
              tickLine={{ stroke: "#b0b0b0" }}
            />
            <Tooltip
              wrapperStyle={TOOLTIP_WRAPPER_STYLE}
              allowEscapeViewBox={{ x: true, y: true }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="admissions"
              name="Ø Eintritte"
              fill="#b5542a"
              isAnimationActive={false}
              maxBarSize={28}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartResponsive>
      </ChartBox>
    </div>
  );
}
