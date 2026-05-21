import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_LAYER_ID = "chart-tooltip-layer";

function getTooltipLayer() {
  let el = document.getElementById(TOOLTIP_LAYER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = TOOLTIP_LAYER_ID;
    el.className = "chart-tooltip-layer";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
  }
  return el;
}

function plotRect() {
  const el = document.querySelector(
    ".wrap-embed-year .recharts-wrapper, .panel-embed .recharts-wrapper, .recharts-wrapper"
  );
  return el?.getBoundingClientRect() ?? null;
}

function estimateSize(variant, itemCount = 0) {
  if (variant === "multi") return { w: 200, h: 120 };
  if (variant === "list") {
    const rows = Math.max(1, Math.min(itemCount, 8));
    return { w: 260, h: 44 + rows * 22 };
  }
  return { w: 148, h: 72 };
}

function computeTooltipStyle({ coordinate, variant, plot, node, itemCount = 0 }) {
  if (!coordinate || !plot) return null;

  const pad = 8;
  const est = estimateSize(variant, itemCount);
  const w = node?.offsetWidth || est.w;
  const h = node?.offsetHeight || est.h;
  const cx = plot.left + coordinate.x;
  const cy = plot.top + coordinate.y;
  const plotMid = plot.left + plot.width * 0.5;
  const minX = plot.left + pad;
  const maxX = plot.right - w - pad;
  const minY = plot.top + pad;
  const maxY = plot.bottom - h - pad;

  let left = cx > plotMid ? cx - w - 12 : cx + 12;
  let top = cy - h * 0.5;

  if (maxX >= minX) left = Math.min(Math.max(left, minX), maxX);
  if (maxY >= minY) top = Math.min(Math.max(top, minY), maxY);

  return {
    position: "fixed",
    left,
    top,
    zIndex: 1,
    visibility: node ? "visible" : "hidden",
  };
}

/** Rendert Tooltip in fixer Overlay-Schicht — ohne Scrollbar-Jitter im Embed. */
export default function BayesTooltipFrame({
  active,
  coordinate,
  children,
  variant = "single",
  itemCount = 0,
}) {
  const ref = useRef(null);
  const [measured, setMeasured] = useState(false);

  const draftStyle = useMemo(() => {
    if (!active || !coordinate) return null;
    const plot = plotRect();
    return computeTooltipStyle({
      coordinate,
      variant,
      plot,
      node: measured ? ref.current : null,
      itemCount,
    });
  }, [active, coordinate, variant, measured, itemCount]);

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

  const mod =
    variant === "multi"
      ? " chart-tooltip--multi"
      : variant === "list"
        ? " chart-tooltip--list"
        : "";

  return createPortal(
    <div
      ref={ref}
      className={`chart-tooltip chart-tooltip--floated${variant === "single" || variant === "multi" ? " chart-tooltip--bayes" : ""}${mod}`}
      style={draftStyle}
    >
      {children}
    </div>,
    getTooltipLayer()
  );
}
