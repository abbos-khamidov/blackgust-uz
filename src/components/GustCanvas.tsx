"use client";
import { useEffect, useRef } from "react";
import { initGust, type GustOptions } from "@/lib/motion/gust";

export function GustCanvas({ options, className }: { options?: GustOptions; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return initGust(ref.current, options);
    // options are static per placement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
