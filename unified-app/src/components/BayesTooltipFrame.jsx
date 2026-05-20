import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_LAYER_ID = "bayes-tooltip-layer";

function getTooltipLayer() {
  let el = document.getElementById(TOOLTIP_LAYER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = TOOLTIP_LAYER_ID;
    el.className = "bayes-tooltip-layer";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
  }
  return el;
}

function plotRect() {
  const el = document.querySelector(".panel-embed .recharts-wrapper, .recharts-wrapper");
  return el?.getBoundingClientRect() ?? null;
}

function estimateSize(variant) {
  return variant === "multi" ? { w: 200, h: 120 } : { w: 148, h: 72 };
}

function computeTooltipStyle({ coordinate, variant, plot, node }) {
  if (!coordinate || !plot) return null;

  const pad = 8;
  const est = estimateSize(variant);
  const w = node?.offsetWidth || est.w;
  const h = node?.offsetHeight || est.h;
  const cx = plot.left + coordinate.x;
  const cy = plot.top + coordinate.y;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const plotMid = plot.left + plot.width * 0.5;

  let left = cx > plotMid ? cx - w - 12 : cx + 12;
  let top = cy - h * 0.5;

  left = Math.min(Math.max(left, pad), Math.max(pad, vw - w - pad));
  top = Math.min(Math.max(top, pad), Math.max(pad, vh - h - pad));

  return {
    position: "fixed",
    left,
    top,
    zIndex: 1,
    visibility: node ? "visible" : "hidden",
  };
}

/** Rendert Tooltip in fixer Overlay-Schicht — ohne Scrollbar-Jitter im Embed. */
export default function BayesTooltipFrame({ active, coordinate, children, variant = "single" }) {
  const ref = useRef(null);
  const [measured, setMeasured] = useState(false);

  const draftStyle = useMemo(() => {
    if (!active || !coordinate) return null;
    const plot = plotRect();
    return computeTooltipStyle({ coordinate, variant, plot, node: measured ? ref.current : null });
  }, [active, coordinate, variant, measured]);

  useLayoutEffect(() => {
    if (!active || !coordinate) {
      setMeasured(false);
      return undefined;
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setMeasured(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active, coordinate, children, variant]);

  if (!active || !coordinate || !draftStyle) return null;

  const mod = variant === "multi" ? " chart-tooltip--multi" : "";

  return createPortal(
    <div
      ref={ref}
      className={`chart-tooltip chart-tooltip--bayes chart-tooltip--floated${mod}`}
      style={draftStyle}
    >
      {children}
    </div>,
    getTooltipLayer()
  );
}
