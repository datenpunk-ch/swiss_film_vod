import { useEffect, useState } from "react";

const DATA_BASE = import.meta.env.DEV ? "/data" : "../data";

export function useExplorerData() {
  const [state, setState] = useState({ loading: true, error: null, cinema: null, vod: null, summary: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cinema, vod, summary] = await Promise.all([
          fetch(`${DATA_BASE}/cinema.json`, { cache: "no-cache" }).then((r) => {
            if (!r.ok) throw new Error("cinema.json");
            return r.json();
          }),
          fetch(`${DATA_BASE}/vod.json`, { cache: "no-cache" }).then((r) => {
            if (!r.ok) throw new Error("vod.json");
            return r.json();
          }),
          fetch(`${DATA_BASE}/summary.json`, { cache: "no-cache" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (!cancelled) setState({ loading: false, error: null, cinema, vod, summary });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || "load failed", cinema: null, vod: null, summary: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
