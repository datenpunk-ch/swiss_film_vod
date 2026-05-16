import { ResponsiveContainer } from "recharts";

/** Recharts rendert bei width/height −1 nichts — fester Start verhindert leere Charts in Flex/Grid. */
export default function ChartResponsive({ height, width = "100%", children }) {
  const h = Math.max(1, Number(height) || 240);
  return (
    <ResponsiveContainer
      width={width}
      height={h}
      initialDimension={{ width: 400, height: h }}
    >
      {children}
    </ResponsiveContainer>
  );
}
