/** Top N Länder + «Andere» (Rest aggregiert). */
export function collapseTopCountries(rows, topN = 5) {
  const list = rows.filter((r) => r.label !== "Andere");
  const sorted = [...list].sort((a, b) => (b.demand ?? 0) - (a.demand ?? 0));
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  if (rest.length === 0) {
    return top.map((r) => ({ ...r, id: r.id ?? r.label }));
  }

  const other = {
    id: "Andere",
    label: "Andere",
    bucket: "ww",
    demand: rest.reduce((s, r) => s + (r.demand ?? 0), 0),
    supply: rest.reduce((s, r) => s + (r.supply ?? 0), 0),
    share_demand: rest.reduce((s, r) => s + (r.share_demand ?? 0), 0),
    share_supply: rest.reduce((s, r) => s + (r.share_supply ?? 0), 0),
    intensity: null,
  };

  return [...top.map((r) => ({ ...r, id: r.id ?? r.label })), other];
}
