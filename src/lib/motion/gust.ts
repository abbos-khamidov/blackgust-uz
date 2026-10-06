import { motionState, prefersReducedMotion } from "./state";

export type GustOptions = {
  density?: number; // px² per particle (lower = denser)
  brass?: number; // share of brass particles
  seed?: number;
  warm?: number; // pre-simulated steps so the first frame is already full
  scale?: number;
  tilt?: number;
  nodes?: [number, number][]; // brass "data source" markers, relative coords
};

/** Wind-like flow field. Returns a cleanup function. */
export function initGust(cv: HTMLCanvasElement, opt: GustOptions = {}): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  let W = 0, H = 0, t = 0, raf = 0, running = false;
  const M = { x: 0, y: 0, on: false };
  type P = { x: number; y: number; life: number; b: boolean };
  let P: P[] = [];
  const reduce = prefersReducedMotion();

  const perm = new Uint8Array(512);
  {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = opt.seed ?? 7;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }
  const fade = (x: number) => x * x * (3 - 2 * x);
  const h = (x: number, y: number) => perm[(perm[x & 255] + y) & 255] / 255;
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const u = fade(xf), v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const spawn = (any: boolean): P => ({ x: any ? Math.random() * W : -10, y: Math.random() * H, life: 200 + Math.random() * 400, b: Math.random() < (opt.brass ?? 0.09) });

  function step(clear: number) {
    ctx!.fillStyle = `rgba(7,8,10,${clear})`;
    ctx!.fillRect(0, 0, W, H);
    t += 0.0025;
    ctx!.lineWidth = 1;
    const boost = motionState.boost;
    const sc = opt.scale ?? 0.0019;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      const n = noise(p.x * sc + t * 0.6, p.y * sc * 1.4 - t * 0.3);
      let ang = (n - 0.5) * 2.4 + Math.sin(p.y * 0.004 + t * 2) * 0.25 + (opt.tilt ?? -0.08);
      const sp = (1.1 + n * 1.8) * (1 + boost * 2.2);
      if (M.on) {
        const dx = p.x - M.x, dy = p.y - M.y, d2 = dx * dx + dy * dy;
        if (d2 < 22500) {
          const f = (1 - d2 / 22500) * 1.4;
          ang += Math.atan2(dy, dx) > Math.atan2(Math.sin(ang), Math.cos(ang)) ? f : -f;
        }
      }
      const nx = p.x + Math.cos(ang) * sp, ny = p.y + Math.sin(ang) * sp;
      const a = Math.min(1, (0.18 + n * 0.5) * (1 + boost * 0.8));
      ctx!.strokeStyle = p.b ? `rgba(201,168,106,${a + 0.15})` : `rgba(236,233,226,${a * 0.55})`;
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
      ctx!.lineTo(nx, ny);
      ctx!.stroke();
      p.x = nx; p.y = ny; p.life--;
      if (p.x > W + 10 || p.y < -10 || p.y > H + 10 || p.life < 0) P[i] = spawn(false);
    }
    if (opt.nodes && W > 900) {
      for (const [qx, qy] of opt.nodes) {
        const x = qx * W, y = qy * H;
        ctx!.fillStyle = "rgba(201,168,106,.9)";
        ctx!.fillRect(x - 2, y - 2, 4, 4);
        ctx!.strokeStyle = "rgba(201,168,106,.35)";
        ctx!.strokeRect(x - 7, y - 7, 14, 14);
      }
    }
  }

  function size() {
    const r = cv.getBoundingClientRect();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    if (!W || !H) return;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(1400, (W * H) / (opt.density ?? 900)));
    P = Array.from({ length: n }, () => spawn(true));
    ctx!.fillStyle = "#07080A";
    ctx!.fillRect(0, 0, W, H);
    const warm = opt.warm ?? 140;
    for (let k = 0; k < warm; k++) step(k < 20 ? 1 : 0.07);
  }

  const loop = () => { step(0.07); raf = requestAnimationFrame(loop); };
  const onMove = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    M.x = e.clientX - r.left; M.y = e.clientY - r.top;
    M.on = M.x > 0 && M.y > 0 && M.x < r.width && M.y < r.height;
  };
  let rt: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 200); };

  size();
  window.addEventListener("resize", onResize);
  if (window.matchMedia("(pointer:fine)").matches) window.addEventListener("pointermove", onMove, { passive: true });

  let io: IntersectionObserver | null = null;
  if (!reduce) {
    io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.isIntersecting && !running) { running = true; loop(); }
        else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      }
    });
    io.observe(cv);
  }

  return () => {
    cancelAnimationFrame(raf);
    io?.disconnect();
    clearTimeout(rt);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
  };
}
