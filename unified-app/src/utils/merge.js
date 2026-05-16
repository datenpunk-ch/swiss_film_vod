export function mergePxOrigins(harmonized, rows) {
  if (!harmonized?.origins) return [];
  return harmonized.origins.map((h) => {
    const row = rows?.find((o) => o.id === h.id);
    return {
      id: h.id,
      label: h.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}

export function mergePxGenres(harmonized, rows) {
  if (!harmonized?.genres) return [];
  return harmonized.genres.map((g) => {
    const row = rows?.find((x) => x.id === g.id);
    return {
      id: g.id,
      label: g.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}

export function mergeChannelOrigins(harmonized, channelOrigins, channelKey) {
  if (!harmonized?.origins) return [];
  return harmonized.origins.map((h) => {
    const code = h[channelKey];
    const row = channelOrigins?.find((o) => o.origin === code);
    return {
      id: h.id,
      label: h.label,
      origin: code,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
      genres: row?.genres,
    };
  });
}

export function mergeGenreRows(harmonized, genreRows) {
  if (!harmonized?.genres) return [];
  return harmonized.genres.map((g) => {
    const row = genreRows?.find((x) => x.id === g.id);
    return {
      id: g.id,
      label: g.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}
