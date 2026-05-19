/** Jahre mit reduzierter Sichtbarkeit (unvollständig / aus der Hauptauswertung). */
export function resolveDimmedYears(pxMeta, allYears = []) {
  const set = new Set();
  const fromMeta = pxMeta?.year_display?.incomplete ?? pxMeta?.incomplete_years ?? [];
  for (const y of fromMeta) {
    if (Number.isFinite(y)) set.add(y);
  }
  for (const row of pxMeta?.yearly ?? []) {
    if (row?.incomplete && Number.isFinite(row.year)) set.add(row.year);
  }
  if (set.size > 0) return set;

  const cur = new Date().getFullYear();
  for (const y of allYears) {
    if (y >= cur - 1) set.add(y);
  }
  return set;
}

export function isDimmedYear(year, dimmedYears) {
  return dimmedYears?.has?.(year) ?? false;
}

export function yearHeadingLabel(year, dimmedYears) {
  return isDimmedYear(year, dimmedYears) ? `${year} (unvollständig)` : String(year);
}
