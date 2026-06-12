"use client";

import { useEffect } from "react";

// Adds a subtle cursor-following glow to any `.card` the pointer is over by
// writing --mx/--my CSS variables the stylesheet reads. One delegated listener,
// rAF-throttled, and disabled under prefers-reduced-motion. Renders nothing.
export default function CardSpotlight() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pending: { card: HTMLElement; x: number; y: number } | null = null;

    function flush() {
      raf = 0;
      if (!pending) return;
      pending.card.style.setProperty("--mx", `${pending.x}px`);
      pending.card.style.setProperty("--my", `${pending.y}px`);
    }

    function onMove(e: PointerEvent) {
      const card = (e.target as HTMLElement | null)?.closest?.(
        ".card",
      ) as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      pending = { card, x: e.clientX - r.left, y: e.clientY - r.top };
      if (!raf) raf = requestAnimationFrame(flush);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
