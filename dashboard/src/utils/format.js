export const fmt = new Intl.NumberFormat("de-CH");
export const pctFmt = new Intl.NumberFormat("de-CH", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function yoyChange(current, previous) {
  if (previous == null || previous <= 0) return null;
  return (current - previous) / previous;
}

export function completeYears(yearly, currentYear = new Date().getFullYear()) {
  return yearly.filter((y) => y.year < currentYear);
}
