import { useEffect, useState } from "react";

/** Lädt chart-Serien aus analysis_report.json (Posterior / Prognose). */
export function useBayesCharts() {
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("./data/analysis_report.json", { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const map = {};
        for (const a of data.analyses ?? []) {
          if (a?.id && a.charts) map[a.id] = a.charts;
        }
        if (!cancelled) {
          setCharts(map);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCharts({});
          setError(e.message ?? String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { charts, chartsLoading: charts === null, chartsError: error };
}
