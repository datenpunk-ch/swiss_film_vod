import { useRef } from "react";
import { CHART_SURFACE } from "../constants.js";
import { ChartPlotContext } from "./ChartPlotContext.jsx";

/** Fester Container — verhindert Recharts width/height = 0 in CSS-Grid. */
export default function ChartBox({ height, children }) {
  const plotRef = useRef(null);

  return (
    <ChartPlotContext.Provider value={plotRef}>
      <div
        ref={plotRef}
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
    </ChartPlotContext.Provider>
  );
}
