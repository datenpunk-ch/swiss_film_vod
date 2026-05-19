import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function plotRect() {
  const el = document.querySelector(".panel-embed .recharts-wrapper, .recharts-wrapper");
  return el?.getBoundingClientRect() ?? null;
}

/** Rendert Tooltip per Portal mit position:fixed — bleibt im Embed sichtbar. */
export default function BayesTooltipFrame({ active, coordinate, children, variant = "single" }) {
  const ref = useRef(null);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!active || !coordinate) {
      setStyle(null);
      return undefined;
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const node = ref.current;
        const plot = plotRect();
        if (!node || !plot) return;

        const pad = 8;
        const w = node.offsetWidth || (variant === "multi" ? 200 : 148);
        const h = node.offsetHeight || 72;
        const cx = plot.left + coordinate.x;
        const cy = plot.top + coordinate.y;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const plotMid = plot.left + plot.width * 0.5;

        let left = cx > plotMid ? cx - w - 12 : cx + 12;
        let top = cy - h * 0.5;

        if (left + w > vw - pad) left = vw - w - pad;
        if (left < pad) left = pad;
        if (top + h > vh - pad) top = vh - h - pad;
        if (top < pad) top = pad;

        setStyle({ position: "fixed", left, top, zIndex: 100001, visibility: "visible" });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active, coordinate, children, variant]);

  if (!active) return null;

  const mod = variant === "multi" ? " chart-tooltip--multi" : "";

  return createPortal(
    <div
      ref={ref}
      className={`chart-tooltip chart-tooltip--bayes chart-tooltip--floated${mod}`}
      style={style ?? { position: "fixed", left: -9999, top: -9999, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body
  );
}
