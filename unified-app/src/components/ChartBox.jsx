import { CHART_SURFACE } from "../constants.js";

/** Fester Container — verhindert Recharts width/height = 0 in CSS-Grid. */
export default function ChartBox({ height, children }) {
  return (
    <div
      className="chart-box"
      style={{
        width: "100%",
        height,
        minHeight: height,
        minWidth: 120,
        background: CHART_SURFACE,
      }}
    >
      {children}
    </div>
  );
}
