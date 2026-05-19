/** Hex (#rgb / #rrggbb) → rgba mit Alpha. */
export function withAlpha(color, alpha) {
  if (!color || typeof color !== "string") return color;
  const hex = color.trim();
  if (hex.startsWith("rgba(") || hex.startsWith("rgb(")) return color;
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return color;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return color;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
