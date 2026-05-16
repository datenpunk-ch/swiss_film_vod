import { useState } from "react";
import { flagImageUrls, isoForCountry } from "../utils/countryFlags.js";

/** Flaggen-Grafik (PNG) mit Fallback-CDN. */
export default function CountryFlag({ label, iso, size = 20, className = "" }) {
  const code = iso ?? isoForCountry(label);
  const urls = code ? flagImageUrls(code, Math.max(20, size * 2)) : [];
  const [urlIndex, setUrlIndex] = useState(0);

  if (!urls.length || urlIndex >= urls.length) return null;

  const h = Math.round(size * 0.72);

  return (
    <img
      className={`country-flag ${className}`.trim()}
      src={urls[urlIndex]}
      width={size}
      height={h}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setUrlIndex((i) => i + 1)}
    />
  );
}
