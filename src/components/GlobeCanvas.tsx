"use client";
import { useEffect, useRef } from "react";
import { initGlobe, type GlobeOptions } from "@/lib/motion/globe";

export function GlobeCanvas({ options, className }: { options?: GlobeOptions; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return initGlobe(ref.current, options);
    // options are static per placement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className={`globe-cv ${className ?? ""}`} aria-hidden="true" />;
}
