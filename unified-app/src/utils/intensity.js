/** Markt-/Kanal-Ø: Summe Nachfrage ÷ Summe Angebot. */
export function aggregateMarketIntensity(rows) {
  const list = rows ?? [];
  const demand = list.reduce((s, r) => s + (r.demand ?? 0), 0);
  const supply = list.reduce((s, r) => s + (r.supply ?? 0), 0);
  return supply > 0 ? demand / supply : 0;
}
