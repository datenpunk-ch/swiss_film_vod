/** Deutsche Ländernamen (BFS/PX) → ISO 3166-1 alpha-2. */
const LABEL_TO_ISO = {
  Schweiz: "CH",
  "Vereinigte Staaten": "US",
  Frankreich: "FR",
  Deutschland: "DE",
  "Vereinigtes Königreich": "GB",
  Schweden: "SE",
  Kanada: "CA",
  Italien: "IT",
  Japan: "JP",
  Australien: "AU",
  Spanien: "ES",
  Argentinien: "AR",
  Österreich: "AT",
  Norwegen: "NO",
  Mexiko: "MX",
  Finnland: "FI",
  Belgien: "BE",
  Dänemark: "DK",
  Niederlande: "NL",
  Polen: "PL",
  Russland: "RU",
  China: "CN",
  Indien: "IN",
  Brasilien: "BR",
  Neuseeland: "NZ",
  Irland: "IE",
  Portugal: "PT",
  Türkei: "TR",
  Ungarn: "HU",
  Tschechien: "CZ",
  Südafrika: "ZA",
  Island: "IS",
  Luxemburg: "LU",
  Andere: null,
};

export function isoForCountry(label) {
  if (!label) return null;
  return LABEL_TO_ISO[label] ?? null;
}

export function flagImageUrls(iso, width = 40) {
  if (!iso || iso.length !== 2) return [];
  const code = iso.toLowerCase();
  return [
    `https://flagcdn.com/w${width}/${code}.png`,
    `https://flagsapi.com/${iso.toUpperCase()}/flat/32.png`,
  ];
}

export function countryFlagUrl(label, width = 40) {
  return flagImageUrls(isoForCountry(label), width)[0] ?? null;
}
