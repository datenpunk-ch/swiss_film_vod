import { metricValue } from "./format.js";

/** Absteigend nach Kennzahl sortieren (grösster Balken zuerst). */
export function sortRowsByMetric(rows, metric) {
  return [...(rows ?? [])].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
}
