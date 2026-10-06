/** Shared, mutable motion state (scroll velocity feeds the particle fields and the marquee). */
export const motionState = { boost: 0, velocity: 0, direction: 1 as 1 | -1 };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
