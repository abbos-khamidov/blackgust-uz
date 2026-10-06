import { LAND } from "./land";
import { prefersReducedMotion } from "./state";

/**
 * Dot-matrix globe centred on Central Asia: land points, graticule, Tashkent beacon,
 * great-circle data arcs to Asian hubs with travelling packets, orbit ring and HUD.
 * Orthographic projection on a 2D canvas; no WebGL needed. Returns a cleanup function.
 */
export type GlobeOptions = {
  variant?: "hero" | "sub";
  lon?: number; // view centre longitude
  lat?: number; // view tilt
  seed?: number;
};

type Hub = { n: string; lat: number; lon: number; lbl?: boolean };
const HQ: Hub = { n: "TASHKENT", lat: 41.31, lon: 69.28 };
const HUBS: Hub[] = [
  { n: "SAMARKAND", lat: 39.65, lon: 66.96 },
  { n: "ALMATY", lat: 43.24, lon: 76.89, lbl: true },
  { n: "ASTANA", lat: 51.17, lon: 71.45, lbl: true },
  { n: "BISHKEK", lat: 42.87, lon: 74.59 },
  { n: "DUSHANBE", lat: 38.56, lon: 68.77 },
  { n: "ASHGABAT", lat: 37.95, lon: 58.38 },
  { n: "BAKU", lat: 40.41, lon: 49.87, lbl: true },
  { n: "ISTANBUL", lat: 41.01, lon: 28.98, lbl: true },
  { n: "DUBAI", lat: 25.2, lon: 55.27, lbl: true },
  { n: "RIYADH", lat: 24.71, lon: 46.68 },
  { n: "DELHI", lat: 28.61, lon: 77.21, lbl: true },
  { n: "URUMQI", lat: 43.83, lon: 87.62 },
  { n: "BEIJING", lat: 39.9, lon: 116.4, lbl: true },
  { n: "SHANGHAI", lat: 31.23, lon: 121.47, lbl: true },
  { n: "SEOUL", lat: 37.57, lon: 126.98 },
  { n: "SINGAPORE", lat: 1.35, lon: 103.82, lbl: true },
  { n: "MOSCOW", lat: 55.75, lon: 37.62, lbl: true },
  { n: "NOVOSIBIRSK", lat: 55.03, lon: 82.92 },
];

const D = Math.PI / 180;
type V3 = [number, number, number];
const toV = (lat: number, lon: number): V3 => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)];

let landCache: Float32Array | null = null;
function landPoints(): Float32Array {
  if (landCache) return landCache;
  const bin = atob(LAND);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const raw = new Int16Array(bytes.buffer);
  const n = raw.length / 2;
  // per point: X, Y, Z (world), central-asia weight
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const lat = raw[i * 2] / 100, lon = raw[i * 2 + 1] / 100;
    const v = toV(lat, lon);
    const dLat = (lat - 41) / 7, dLon = (lon - 66) / 14;
    const ca = Math.max(0, 1 - Math.sqrt(dLat * dLat + dLon * dLon));
    out.set([v[0], v[1], v[2], ca], i * 4);
  }
  landCache = out;
  return out;
}

function slerp(a: V3, b: V3, t: number): V3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-4) return a;
  const s = Math.sin(om), k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

export function initGlobe(cv: HTMLCanvasElement, opt: GlobeOptions = {}): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  const hero = (opt.variant ?? "hero") === "hero";
  const reduce = prefersReducedMotion();
  const pts = landPoints();
  const N = pts.length / 4;
  const hq = toV(HQ.lat, HQ.lon);
  const hubs = (hero ? HUBS : HUBS.filter((_, i) => i % 2 === 0)).map((h, i) => {
    const v = toV(h.lat, h.lon);
    const dist = Math.acos(Math.min(1, hq[0] * v[0] + hq[1] * v[1] + hq[2] * v[2]));
    return { ...h, v, dist, born: 0.3 + i * 0.12, speed: 0.16 + ((i * 37) % 11) / 60, phase: ((i * 53) % 17) / 17 };
  });
  // secondary links between hubs (mesh)
  const mesh: [number, number][] = hero ? [[1, 11], [11, 12], [12, 13], [13, 14], [8, 10], [7, 16], [6, 7], [10, 15], [2, 17], [9, 8]] : [];

  let W = 0, H = 0, DPR = 1, raf = 0, running = false, t0 = performance.now();
  let cx = 0, cy = 0, R = 0;
  const baseLon = opt.lon ?? (hero ? 72 : 60 + ((opt.seed ?? 3) * 23) % 70);
  const baseLat = opt.lat ?? (hero ? 30 : 24);
  const view = { lon: baseLon, lat: baseLat, tlon: baseLon, tlat: baseLat };
  const ptr = { x: 0, y: 0, drag: false, lx: 0, dl: 0 };

  function size() {
    const r = cv.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    if (!W || !H) return;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    const wide = W > 900;
    const VH = Math.min(H, window.innerHeight || H);
    if (hero) {
      R = wide ? Math.min(W * 0.27, VH * 0.4) : Math.min(W * 0.5, VH * 0.27);
      cx = wide ? W * 0.73 : W * 0.6;
      cy = wide ? Math.min(H * 0.5, VH * 0.55) : VH * 0.33;
    } else {
      R = wide ? Math.min(W * 0.21, H * 0.46) : W * 0.42;
      cx = wide ? W * 0.83 : W * 0.86;
      cy = wide ? H * 0.5 : H * 0.26;
    }
  }

  // projection state per frame
  let sl = 0, cl = 0, sp = 0, cp = 0;
  const proj = (v: V3 | Float32Array, o = 0, k = 1) => {
    const X = v[o] * k, Y = v[o + 1] * k, Z = v[o + 2] * k;
    const x = X * cl - Z * sl;
    const z0 = X * sl + Z * cl;
    const y = Y * cp - z0 * sp;
    const z = Y * sp + z0 * cp;
    return [cx + x * R, cy - y * R, z] as const;
  };

  function frame(now: number) {
    const t = (now - t0) / 1000;
    const scrollP = hero ? Math.min(1, Math.max(0, window.scrollY / Math.max(1, H))) : 0;
    // idle drift around Central Asia + pointer parallax + scroll
    if (!ptr.drag) {
      view.tlon = baseLon + Math.sin(t * 0.07) * 14 + ptr.x * 10 + scrollP * 38 + ptr.dl;
      view.tlat = baseLat + ptr.y * 6 - scrollP * 10;
      ptr.dl *= 0.995;
    }
    view.lon += (view.tlon - view.lon) * 0.05;
    view.lat += (view.tlat - view.lat) * 0.05;
    const lon0 = view.lon * D, lat0 = view.lat * D;
    sl = Math.sin(lon0); cl = Math.cos(lon0); sp = Math.sin(lat0); cp = Math.cos(lat0);
    const zoom = hero ? 1 + scrollP * 0.18 : 1;
    const R0 = R;
    R = R0 * zoom;

    const c = ctx!;
    c.clearRect(0, 0, W, H);

    // atmosphere
    const halo = c.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.35);
    halo.addColorStop(0, "rgba(201,168,106,0.16)");
    halo.addColorStop(0.25, "rgba(201,168,106,0.05)");
    halo.addColorStop(1, "rgba(201,168,106,0)");
    c.fillStyle = halo;
    c.beginPath(); c.arc(cx, cy, R * 1.35, 0, Math.PI * 2); c.fill();
    // body
    const body = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, "#14161A");
    body.addColorStop(1, "#08090B");
    c.fillStyle = body;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(201,168,106,0.28)";
    c.lineWidth = 1;
    c.stroke();

    // graticule
    c.strokeStyle = "rgba(236,233,226,0.06)";
    c.beginPath();
    for (let la = -60; la <= 75; la += 15) {
      let pen = false;
      for (let lo = -180; lo <= 180; lo += 4) {
        const [x, y, z] = proj(toV(la, lo));
        if (z > 0) { if (pen) c.lineTo(x, y); else c.moveTo(x, y); pen = true; } else pen = false;
      }
    }
    for (let lo = -180; lo < 180; lo += 15) {
      let pen = false;
      for (let la = -80; la <= 80; la += 4) {
        const [x, y, z] = proj(toV(la, lo));
        if (z > 0) { if (pen) c.lineTo(x, y); else c.moveTo(x, y); pen = true; } else pen = false;
      }
    }
    c.stroke();

    // scan meridian position (world longitude sweeping)
    const scanLon = ((t * 22) % 360) * D;
    const ssx = Math.sin(scanLon), scx = Math.cos(scanLon);

    // land dots
    const ds = Math.max(1.1, R / 260);
    for (let i = 0; i < N; i++) {
      const o = i * 4;
      const X = pts[o], Y = pts[o + 1], Z = pts[o + 2], ca = pts[o + 3];
      const x = X * cl - Z * sl;
      const z0 = X * sl + Z * cl;
      const y = Y * cp - z0 * sp;
      const z = Y * sp + z0 * cp;
      const sx = cx + x * R, sy = cy - y * R;
      if (z <= 0) {
        if (hero && z > -0.9) { c.fillStyle = "rgba(236,233,226,0.035)"; c.fillRect(sx, sy, 1, 1); }
        continue;
      }
      // proximity to scan meridian
      const cosd = (X * ssx + Z * scx) / Math.max(1e-3, Math.hypot(X, Z));
      const scan = cosd > 0.985 ? (cosd - 0.985) / 0.015 : 0;
      const wave = 0.5 + 0.5 * Math.sin(t * 1.4 + X * 9 + Y * 7);
      const a = (0.2 + z * 0.62) * (0.7 + wave * 0.3);
      const s = ds * (0.6 + z * 0.6);
      if (ca > 0.01) {
        c.fillStyle = `rgba(222,190,128,${Math.min(1, a * 0.7 + ca * 0.9 + scan * 0.5)})`;
        c.fillRect(sx - s / 2, sy - s / 2, s * 1.15, s * 1.15);
      } else {
        c.fillStyle = scan > 0 ? `rgba(233,207,151,${Math.min(1, a + scan * 0.6)})` : `rgba(236,233,226,${a})`;
        c.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
    }

    // limb highlight
    const limb = c.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    limb.addColorStop(0, "rgba(7,8,10,0)");
    limb.addColorStop(1, "rgba(7,8,10,0.55)");
    c.fillStyle = limb;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();

    // arcs
    const drawArc = (a: V3, b: V3, dist: number, prog: number, alpha: number, packets: number[], width: number) => {
      const lift = 0.06 + dist * 0.42;
      const steps = 48;
      const pts2: [number, number, number][] = [];
      const end = Math.max(0, Math.min(1, prog));
      for (let k = 0; k <= steps; k++) {
        const u = (k / steps) * end;
        const v = slerp(a, b, u);
        const h = 1 + lift * Math.sin(Math.PI * u);
        const p = proj(v, 0, h);
        const r2 = ((p[0] - cx) ** 2 + (p[1] - cy) ** 2) / (R * R);
        pts2.push([p[0], p[1], p[2] > 0 || r2 > 1 ? 1 : 0]);
      }
      c.lineWidth = width;
      const g = c.createLinearGradient(pts2[0][0], pts2[0][1], pts2[pts2.length - 1][0], pts2[pts2.length - 1][1]);
      g.addColorStop(0, `rgba(242,223,180,${alpha})`);
      g.addColorStop(1, `rgba(201,168,106,${alpha * 0.45})`);
      c.strokeStyle = g;
      c.beginPath();
      let pen = false;
      for (const [x, y, vis] of pts2) {
        if (vis) { if (pen) c.lineTo(x, y); else c.moveTo(x, y); pen = true; } else pen = false;
      }
      c.stroke();
      if (end < 1) return;
      for (const pk of packets) {
        const tail = 0.12;
        for (let j = 0; j < 8; j++) {
          const u = pk - (j / 8) * tail;
          if (u < 0 || u > 1) continue;
          const v = slerp(a, b, u);
          const p = proj(v, 0, 1 + lift * Math.sin(Math.PI * u));
          const r2 = ((p[0] - cx) ** 2 + (p[1] - cy) ** 2) / (R * R);
          if (p[2] <= 0 && r2 <= 1) continue;
          const s = (j === 0 ? 2.6 : 2 - j * 0.2) * (R / 300 + 0.5);
          c.fillStyle = j === 0 ? "rgba(255,240,205,0.95)" : `rgba(201,168,106,${0.7 - j * 0.08})`;
          c.beginPath(); c.arc(p[0], p[1], Math.max(0.6, s), 0, Math.PI * 2); c.fill();
        }
      }
    };

    for (const hb of hubs) {
      const prog = reduce ? 1 : (t - hb.born) / 1.1;
      if (prog <= 0) continue;
      const pk = (t * hb.speed + hb.phase) % 1;
      const back = (t * hb.speed * 0.8 + hb.phase + 0.5) % 1;
      drawArc(hq, hb.v, hb.dist, prog, 0.62, [pk, 1 - back], 1.2);
    }
    for (const [i, j] of mesh) {
      const a = hubs[i], b = hubs[j];
      if (!a || !b) continue;
      const prog = reduce ? 1 : (t - Math.max(a.born, b.born) - 1.2) / 1.4;
      if (prog <= 0) continue;
      const d = Math.acos(Math.min(1, a.v[0] * b.v[0] + a.v[1] * b.v[1] + a.v[2] * b.v[2]));
      drawArc(a.v, b.v, d, prog, 0.24, [(t * 0.12 + i * 0.13) % 1], 0.8);
    }

    // hubs
    c.font = `500 ${hero ? 10 : 9}px "IBM Plex Mono", ui-monospace, monospace`;
    c.textBaseline = "middle";
    for (const hb of hubs) {
      if (t < hb.born + 0.9 && !reduce) continue;
      const [x, y, z] = proj(hb.v);
      if (z <= 0.05) continue;
      const a = Math.min(1, z * 1.4);
      c.fillStyle = `rgba(236,233,226,${a})`;
      c.fillRect(x - 1.5, y - 1.5, 3, 3);
      c.strokeStyle = `rgba(201,168,106,${a * 0.5})`;
      c.strokeRect(x - 4.5, y - 4.5, 9, 9);
      if (hero && hb.lbl && W > 700) {
        c.fillStyle = `rgba(190,188,180,${a})`;
        c.fillText(hb.n, x + 9, y);
      }
    }

    // Tashkent beacon
    {
      const [x, y, z] = proj(hq);
      if (z > 0) {
        const [bx, by] = proj(hq, 0, 1.16);
        const beam = c.createLinearGradient(x, y, bx, by);
        beam.addColorStop(0, "rgba(233,207,151,0.95)");
        beam.addColorStop(1, "rgba(233,207,151,0)");
        c.strokeStyle = beam; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(bx, by); c.stroke();
        for (let k = 0; k < 3; k++) {
          const ph = ((t * 0.55 + k / 3) % 1);
          c.strokeStyle = `rgba(201,168,106,${(1 - ph) * 0.8})`;
          c.lineWidth = 1;
          c.beginPath(); c.ellipse(x, y, 4 + ph * R * 0.16, (4 + ph * R * 0.16) * (0.35 + z * 0.55), 0, 0, Math.PI * 2); c.stroke();
        }
        c.fillStyle = "#F2DFB4";
        c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fill();
        c.shadowColor = "rgba(201,168,106,.9)"; c.shadowBlur = 18;
        c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
        if (hero) {
          // tag
          const tx = bx + 10, ty = by - 6;
          c.strokeStyle = "rgba(201,168,106,0.6)";
          c.beginPath(); c.moveTo(bx, by); c.lineTo(tx - 2, ty); c.stroke();
          const label = "TASHKENT · HQ";
          const sub = "41.31°N  69.28°E";
          c.font = `500 11px "IBM Plex Mono", ui-monospace, monospace`;
          const w = Math.max(c.measureText(label).width, c.measureText(sub).width) + 20;
          c.fillStyle = "rgba(10,12,15,0.86)";
          c.fillRect(tx, ty - 17, w, 36);
          c.strokeRect(tx + 0.5, ty - 16.5, w, 36);
          c.fillStyle = "#ECE9E2";
          c.fillText(label, tx + 10, ty - 6);
          c.fillStyle = "rgba(201,168,106,0.9)";
          c.font = `400 10px "IBM Plex Mono", ui-monospace, monospace`;
          c.fillText(sub, tx + 10, ty + 9);
        }
      }
    }

    // orbit ring with satellite
    if (hero) {
      const tilt = -0.32, rx = R * 1.16, ry = R * 0.3;
      c.save();
      c.translate(cx, cy); c.rotate(tilt);
      c.setLineDash([2, 6]);
      c.strokeStyle = "rgba(236,233,226,0.14)";
      c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      for (let k = 0; k < 72; k++) {
        const an = (k / 72) * Math.PI * 2;
        const x = Math.cos(an) * rx, y = Math.sin(an) * ry;
        if (y < 0 && Math.hypot(x / R, y / R) < 1) continue;
        const L = k % 6 === 0 ? 6 : 2.5;
        c.strokeStyle = k % 6 === 0 ? "rgba(201,168,106,0.5)" : "rgba(236,233,226,0.12)";
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + L); c.stroke();
      }
      const sa = t * 0.35;
      const sx = Math.cos(sa) * rx, sy = Math.sin(sa) * ry;
      if (!(sy < 0 && Math.hypot(sx, sy) < R)) {
        c.fillStyle = "#ECE9E2";
        c.fillRect(sx - 2.5, sy - 2.5, 5, 5);
        c.strokeStyle = "rgba(201,168,106,0.7)";
        c.strokeRect(sx - 6, sy - 6, 12, 12);
      }
      c.restore();
    }

    // HUD
    if (hero && W > 900) {
      c.font = `400 10px "IBM Plex Mono", ui-monospace, monospace`;
      c.fillStyle = "rgba(140,142,138,0.9)";
      const lx = cx + R * 0.86, ly = cy + R * 1.02;
      const live = hubs.filter((h) => t > h.born + 0.9).length;
      c.fillText(`NODES ${String(live + 1).padStart(2, "0")} / ${hubs.length + 1}`, lx - 150, ly);
      c.fillText(`LON ${view.lon.toFixed(2)}°  LAT ${view.lat.toFixed(2)}°`, lx - 150, ly + 15);
      c.fillStyle = "rgba(201,168,106,0.9)";
      c.fillText(`● LINK ${(98.2 + Math.sin(t) * 0.6).toFixed(1)}%`, lx - 150, ly + 30);
      // corner brackets around globe
      c.strokeStyle = "rgba(201,168,106,0.45)";
      const b = R * 1.22, L = 14;
      c.beginPath();
      for (const [sxn, syn] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = cx + sxn * b, y = cy + syn * b;
        c.moveTo(x, y + -syn * L); c.lineTo(x, y); c.lineTo(x + -sxn * L, y);
      }
      c.stroke();
    }

    R = R0;
  }

  const loop = (now: number) => {
    frame(now);
    raf = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent) => {
    ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    if (ptr.drag) {
      const dx = e.clientX - ptr.lx;
      ptr.lx = e.clientX;
      view.tlon -= dx * 0.25;
      ptr.dl -= dx * 0.25;
    }
  };
  const onDown = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    const dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy;
    if (dx * dx + dy * dy < R * R) { ptr.drag = true; ptr.lx = e.clientX; }
  };
  const onUp = () => { ptr.drag = false; };
  let rt: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (!running) frame(performance.now()); }, 150); };

  size();
  window.addEventListener("resize", onResize);
  const fine = window.matchMedia("(pointer:fine)").matches;
  if (fine && !reduce) {
    window.addEventListener("pointermove", onMove, { passive: true });
    if (hero) { window.addEventListener("pointerdown", onDown); window.addEventListener("pointerup", onUp); }
  }

  let io: IntersectionObserver | null = null;
  if (reduce) {
    t0 = performance.now() - 30000;
    frame(performance.now());
  } else {
    io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
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
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
  };
}
