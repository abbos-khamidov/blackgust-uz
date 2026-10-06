/* eslint-disable */
// @ts-nocheck — ported canvas engine; logic is pure math on (progress, time).
/* BlackGust — "Как это работает" live model.
   One canvas (3D point-sphere ontology, particle streams, agent orbits, query arcs)
   + HTML layers (source system cards, HUD, answer panel). Everything is a pure function of
   (scroll progress, time), with inertial smoothing so scrubbing feels heavy and smooth. */
export type FlowConfig = {
  titles: string[]; captions: string[]; entities: string[]; agents: string[];
  num: (n: number) => string; money: (n: number) => string; total: number;
};
export type FlowApi = { progress: number; render: (p: number, time: number, still?: boolean) => void; destroy: () => void };

export function createFlow(sec, cfg: FlowConfig): FlowApi | null {
  var viz = sec.querySelector('.viz'); if (!viz) return null;
  var cv = viz.querySelector('canvas'), ctx = cv.getContext('2d');
  var cards = [].slice.call(viz.querySelectorAll('.vc'));
  var ans = viz.querySelector('.viz-ans'), vaNum = viz.querySelector('#vaNum');
  var bars = [].slice.call(viz.querySelectorAll('.vb i'));
  var hO = viz.querySelector('#hO'), hL = viz.querySelector('#hL'), hA = viz.querySelector('#hA'), hC = viz.querySelector('#hC');
  var steps = sec.querySelector('.flow-steps'), stepEls = sec.querySelectorAll('.fstep');
  var lbl = sec.querySelector('#flowLbl'), bar = sec.querySelector('#flowBar');
  var titles = cfg.titles;
  var captions = cfg.captions;

  var MONO = (getComputedStyle(document.documentElement).getPropertyValue('--f-mono') || 'ui-monospace, monospace').trim();
  var clamp=function(v,a,b){return v<a?a:v>b?b:v};
  var E=function(x){x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
  var Eo=function(x){x=clamp(x,0,1);return 1-Math.pow(1-x,3)};
  var lerp=function(a,b,t){return a+(b-a)*t};
  var seed=7; function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}

  /* ---------- geometry ---------- */
  var N = 460, pts = [], i, j;
  var GA = Math.PI*(3-Math.sqrt(5));
  for (i=0;i<N;i++){
    var y = 1 - (i/(N-1))*2, r = Math.sqrt(1-y*y), th = GA*i;
    var u = rnd()*2*Math.PI, v = Math.acos(2*rnd()-1), rr = 1.6 + rnd()*1.4;
    pts.push({x:Math.cos(th)*r, y:y, z:Math.sin(th)*r,
      cx:Math.sin(v)*Math.cos(u)*rr, cy:Math.cos(v)*rr*0.7, cz:Math.sin(v)*Math.sin(u)*rr,
      d:rnd(), sx:0, sy:0, sz:0, k:1});
  }
  var edges = [];
  for (i=0;i<N;i++){
    var best=[[9,-1],[9,-1],[9,-1]];
    for (j=0;j<N;j++){ if(i===j)continue;
      var dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, dz=pts[i].z-pts[j].z, dd=dx*dx+dy*dy+dz*dz;
      if (dd<best[2][0]){ best[2]=[dd,j]; best.sort(function(a,b){return a[0]-b[0]}); } }
    for (j=0;j<3;j++) if (best[j][1]>i) edges.push([i,best[j][1]]);
  }
  var ENT = [.16,.31,.47,.62,.78,.9].map(function(f,k){return {name:cfg.entities[k], i:Math.round(f*(N-1))}});
  var CHAIN = [0,1,2,3];
  var AG = [{name:cfg.agents[0], r:1.24, tx:.35, tz:.25, sp:.42, ph:0},
            {name:cfg.agents[1], r:1.36, tx:-.5, tz:-.35, sp:.33, ph:2.1},
            {name:cfg.agents[2], r:1.48, tx:.95, tz:.15, sp:.27, ph:4.2}];

  /* ---------- particles ---------- */
  var P = [], PMAX = 420;
  for (i=0;i<PMAX;i++) P.push({on:false});
  var spawnAcc = 0;

  /* ---------- state ---------- */
  var W=0,H=0,DPR=1, cur=0, mx=0, my=0, tmx=0, tmy=0, last=null, api;
  function size(){
    var r = viz.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio||1, 2);
    W = r.width; H = r.height; if (!W||!H) return;
    cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
    cards.forEach(function(c){ c._x = parseFloat(c.dataset.x)/100; c._y = parseFloat(c.dataset.y)/100; c._z = parseFloat(c.dataset.z||0); c._ph = rnd()*6.28; c.style.left = (c._x*100)+'%'; c.style.top = (c._y*100)+'%'; });
  }
  size();
  var ro = null; if ('ResizeObserver' in window){ ro = new ResizeObserver(function(){ size(); if(api && api.still) api.render(1,0,true); }); ro.observe(viz); } else addEventListener('resize', size);
  if (matchMedia('(pointer:fine)').matches){
    viz.addEventListener('pointermove', function(e){ var r=viz.getBoundingClientRect(); tmx=((e.clientX-r.left)/r.width-.5)*2; tmy=((e.clientY-r.top)/r.height-.5)*2; });
    viz.addEventListener('pointerleave', function(){ tmx=0; tmy=0; });
  }

  /* ---------- projection ---------- */
  var cam = {ay:0, ax:.32, cx:0, cy:0, U:1, D:3.6};
  function proj(x,y,z,o){
    var ca=Math.cos(cam.ay), sa=Math.sin(cam.ay), cb=Math.cos(cam.ax), sb=Math.sin(cam.ax);
    var x1 = x*ca - z*sa, z1 = x*sa + z*ca;
    var y2 = y*cb - z1*sb, z2 = y*sb + z1*cb;
    var k = cam.D/(cam.D+z2);
    o.sx = cam.cx + x1*cam.U*k; o.sy = cam.cy + y2*cam.U*k; o.sz = z2; o.k = k; return o;
  }
  function slerp(a,b,t){
    var d = clamp(a.x*b.x+a.y*b.y+a.z*b.z,-1,1), om = Math.acos(d), so = Math.sin(om)||1e-6;
    var w1 = Math.sin((1-t)*om)/so, w2 = Math.sin(t*om)/so, lift = 1 + .28*Math.sin(Math.PI*t);
    return {x:(a.x*w1+b.x*w2)*lift, y:(a.y*w1+b.y*w2)*lift, z:(a.z*w1+b.z*w2)*lift};
  }
  var tmp = {}, tmp2 = {};
  function cardXY(c){ return {x:c._sx, y:c._sy}; }

  function pill(x, y, text, a, strong){
    ctx.font = '500 ' + (strong?11.5:10.5) + 'px ' + MONO;
    var w = ctx.measureText(text).width + 16, h = 20;
    ctx.globalAlpha = a; ctx.fillStyle = strong ? 'rgba(14,16,19,.92)' : 'rgba(7,8,10,.78)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y-h/2, w, h, 10); else ctx.rect(x, y-h/2, w, h); ctx.fill();
    ctx.strokeStyle = strong ? 'rgba(201,168,106,.85)' : 'rgba(236,233,226,.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = strong ? '#ECE9E2' : 'rgba(236,233,226,.86)'; ctx.fillText(text, x+8, y+3.8);
    ctx.globalAlpha = 1;
  }

  api = {section:sec, steps:steps, progress:0, still:false, destroy:function(){ if(ro) ro.disconnect(); removeEventListener('resize', size); }, render:function(p, time, still){
    if (!W) size(); if (!W) return;
    var dt = last===null ? 1/60 : clamp(time-last, 0, .05); last = time;
    api.still = !!still;
    if (still){ cur = 1; } else { cur = lerp(cur, p, 1 - Math.pow(.0009, dt)); if (Math.abs(cur-p)<1e-4) cur=p; }
    mx = lerp(mx, tmx, 1-Math.pow(.02, dt)); my = lerp(my, tmy, 1-Math.pow(.02, dt));
    var s = cur*4;
    var mv = E((s-.55)/1.0),       // cards retreat
        fm = E((s-.85)/1.0),       // sphere forms
        en = Eo((s-1.35)/.6),      // entities labelled
        ag = Eo((s-2)/.6),         // agents online
        ch = clamp((s-2.25)/.75,0,1), // query chain draws
        an = E((s-3)/.65),         // answer panel
        ba = Eo((s-3.25)/.6);      // bars grow
    if (still){ mv=fm=en=ag=ch=an=ba=1; }

    cam.ay = (still?0.9:time*.12) + cur*2.6 + mx*.35;
    cam.ax = .3 + my*.18 - an*.05;
    cam.U = Math.min(W,H) * (.3 - .1*an) * (.86 + .14*fm);
    cam.cx = W*.5 + mx*6; cam.cy = H*(.5 - .25*an) + my*6;

    /* ---------- HTML layers ---------- */
    cards.forEach(function(c, idx){
      var bx = c._x*W, by = c._y*H, ox = bx - W/2, oy = by - H/2;
      var spread = 1 + .16*mv, z = c._z;
      var fx = Math.sin(time*.7 + c._ph)*4*(1-mv*.5), fy = Math.cos(time*.55 + c._ph)*5*(1-mv*.5);
      var px = W/2 + ox*spread + fx + mx*(10+z*16), py = H/2 + oy*spread + fy + my*(8+z*12);
      var sc = (1 - .4*mv - .2*an) * (1 + z*.08);
      var op = clamp(1 - .5*mv - .25*ag - .6*an, 0, 1);
      c._sx = px; c._sy = py;
      c.style.transform = 'translate3d(' + (px - bx).toFixed(1) + 'px,' + (py - by).toFixed(1) + 'px,0) translate(-50%,-50%) rotateY(' + (mx*10 + ox/W*14).toFixed(2) + 'deg) rotateX(' + (-my*8 - oy/H*10).toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.opacity = op.toFixed(3);
    });
    if (ans){
      ans.style.opacity = an.toFixed(3);
      ans.style.transform = 'translate(-50%,' + ((1-an)*34).toFixed(1) + 'px) scale(' + (.965 + .035*an).toFixed(3) + ')';
      ans.style.pointerEvents = an > .5 ? 'auto' : 'none';
    }
    if (vaNum) vaNum.textContent = cfg.money(cfg.total*Eo((s-3.05)/.8));
    bars.forEach(function(b){ b.style.transform = 'scaleX(' + (parseFloat(b.dataset.v)*ba).toFixed(3) + ')'; });
    if (hO) hO.textContent = cfg.num(Math.round(12480*Eo((s-.9)/1.3)));
    if (hL) hL.textContent = cfg.num(Math.round(41902*Eo((s-1.1)/1.3)));
    if (hA) hA.textContent = String(Math.round(3*ag));
    var idx = still ? 3 : clamp(Math.floor(s+.02), 0, 3);
    if (api._idx !== idx){
      api._idx = idx;
      stepEls.forEach(function(e, k){ e.classList.toggle('on', k===idx); });
      if (lbl) lbl.textContent = '0' + (idx+1) + ' / 04 · ' + titles[idx];
      if (hC){ hC.classList.remove('in'); void hC.offsetWidth; hC.textContent = captions[idx]; hC.classList.add('in'); }
      viz.setAttribute('data-step', idx);
    }
    if (bar) bar.style.transform = 'scaleX(' + (still?1:clamp(cur,0,1)).toFixed(4) + ')';

    /* ---------- canvas ---------- */
    ctx.clearRect(0,0,W,H);

    // ambient: faint radial + scanline grid
    var g = ctx.createRadialGradient(cam.cx, cam.cy, 0, cam.cx, cam.cy, cam.U*2.2);
    g.addColorStop(0, 'rgba(201,168,106,' + (.05 + .07*fm) + ')'); g.addColorStop(1, 'rgba(201,168,106,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // empty-centre marker before the model exists
    if (fm < 1){
      var ea = (1-fm)*.9;
      ctx.save(); ctx.translate(cam.cx, cam.cy); ctx.rotate(time*.15);
      ctx.strokeStyle = 'rgba(236,233,226,' + (.16*ea) + ')'; ctx.setLineDash([3,7]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0,0,cam.U*.72,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.rotate(-time*.3);
      for (var q=0;q<4;q++){ ctx.rotate(Math.PI/2); ctx.strokeStyle='rgba(201,168,106,'+(.35*ea)+')'; ctx.beginPath(); ctx.moveTo(cam.U*.78,0); ctx.lineTo(cam.U*.9,0); ctx.stroke(); }
      ctx.restore();
    }

    // project sphere points (cloud → sphere)
    for (i=0;i<N;i++){
      var pt = pts[i], f = E((fm*1.25) - pt.d*.25);
      proj(lerp(pt.cx,pt.x,f), lerp(pt.cy,pt.y,f), lerp(pt.cz,pt.z,f), pt);
    }

    ctx.globalCompositeOperation = 'lighter';
    // mesh edges
    if (fm > .02){
      ctx.lineWidth = 1;
      for (i=0;i<edges.length;i++){
        var A = pts[edges[i][0]], B = pts[edges[i][1]];
        var dep = 1 - ((A.sz + B.sz)/2 + 1)/2; // 1 = front
        var al = fm*fm*(.03 + .16*dep*dep) * (1 - .35*an);
        if (al < .006) continue;
        ctx.strokeStyle = 'rgba(236,233,226,' + al.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
      }
    }
    // points
    var pa = clamp((s-.6)/.6, 0, 1);
    for (i=0;i<N;i++){
      var p0 = pts[i], dp = 1 - (p0.sz+1)/2;
      var a0 = pa * (.18 + .7*dp*dp) * (.55 + .45*fm);
      if (a0 < .01) continue;
      var rad = (.55 + 1.1*dp) * p0.k;
      ctx.fillStyle = 'rgba(236,233,226,' + a0.toFixed(3) + ')';
      ctx.fillRect(p0.sx - rad/2, p0.sy - rad/2, rad, rad);
    }

    // agent orbits + comets
    if (ag > .01){
      AG.forEach(function(o, k){
        var base = time*o.sp + o.ph, cosT=Math.cos(o.tx), sinT=Math.sin(o.tx), cosZ=Math.cos(o.tz), sinZ=Math.sin(o.tz);
        function orb(th, out){
          var x = Math.cos(th)*o.r, y = 0, z = Math.sin(th)*o.r;
          var y1 = y*cosT - z*sinT, z1 = y*sinT + z*cosT;
          var x2 = x*cosZ - y1*sinZ, y2 = x*sinZ + y1*cosZ;
          return proj(x2, y2, z1, out);
        }
        // ring
        ctx.strokeStyle = 'rgba(201,168,106,' + (.12*ag) + ')'; ctx.lineWidth = 1; ctx.beginPath();
        for (var t=0;t<=64;t++){ orb(t/64*Math.PI*2, tmp); if(!t) ctx.moveTo(tmp.sx,tmp.sy); else ctx.lineTo(tmp.sx,tmp.sy); }
        ctx.stroke();
        // trail
        var prev = null;
        for (var tr=0; tr<34; tr++){
          orb(base - tr*.035, tmp2);
          if (prev){ var ta = ag*(1-tr/34); ctx.strokeStyle='rgba(201,168,106,'+(.75*ta).toFixed(3)+')'; ctx.lineWidth = 2.2*(1-tr/34)+.3; ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(tmp2.sx,tmp2.sy); ctx.stroke(); }
          prev = {x:tmp2.sx, y:tmp2.sy};
        }
        orb(base, tmp);
        var hg = ctx.createRadialGradient(tmp.sx,tmp.sy,0,tmp.sx,tmp.sy,16*tmp.k);
        hg.addColorStop(0,'rgba(255,236,190,'+(.95*ag)+')'); hg.addColorStop(.25,'rgba(201,168,106,'+(.5*ag)+')'); hg.addColorStop(1,'rgba(201,168,106,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(tmp.sx,tmp.sy,16*tmp.k,0,Math.PI*2); ctx.fill();
        o._x = tmp.sx; o._y = tmp.sy; o._z = tmp.sz;
      });
    }

    // query chain arcs: Контрагент → Договор → Счёт → Платёж
    if (ch > 0){
      var segs = CHAIN.length-1, prog = ch*segs;
      for (var sgi=0; sgi<segs; sgi++){
        var fr = clamp(prog - sgi, 0, 1); if (fr<=0) break;
        var a1 = pts[ENT[CHAIN[sgi]].i], b1 = pts[ENT[CHAIN[sgi+1]].i];
        var steps2 = 28, end = Math.max(1, Math.round(steps2*fr));
        for (var pass=0; pass<2; pass++){
          ctx.strokeStyle = pass ? 'rgba(255,230,180,'+(.9*(1-.3*an))+')' : 'rgba(201,168,106,'+(.22*(1-.3*an))+')';
          ctx.lineWidth = pass ? 1.4 : 5;
          ctx.beginPath();
          for (var st=0; st<=end; st++){ var v3 = slerp(a1,b1,st/steps2); proj(v3.x,v3.y,v3.z,tmp); if(!st) ctx.moveTo(tmp.sx,tmp.sy); else ctx.lineTo(tmp.sx,tmp.sy); }
          ctx.stroke();
        }
      }
      if (ch >= 1){ // pulse running along the full chain
        var pt2 = (time*.45) % 1, gl = pt2*segs, si = Math.min(segs-1, Math.floor(gl));
        var v4 = slerp(pts[ENT[CHAIN[si]].i], pts[ENT[CHAIN[si+1]].i], gl-si); proj(v4.x,v4.y,v4.z,tmp);
        var pg = ctx.createRadialGradient(tmp.sx,tmp.sy,0,tmp.sx,tmp.sy,12); pg.addColorStop(0,'rgba(255,240,205,.95)'); pg.addColorStop(1,'rgba(201,168,106,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(tmp.sx,tmp.sy,12,0,Math.PI*2); ctx.fill();
      }
    }

    /* ---------- particles ---------- */
    var rate, mode;
    if (still){ rate = 0; mode = 0; }
    else if (s < 2.9){ mode = 0; rate = s < .5 ? 26 : s < 2 ? lerp(60, 190, E((s-.5)/1)) : lerp(190, 30, E((s-2)/.8)); }
    else { mode = 1; rate = 110*an; }
    spawnAcc += rate*dt;
    while (spawnAcc >= 1){
      spawnAcc -= 1;
      for (i=0;i<PMAX;i++) if (!P[i].on){
        var q2 = P[i]; q2.on = true; q2.t = 0; q2.mode = mode; q2.sp = .45 + rnd()*.5; q2.tgt = Math.floor(rnd()*N);
        q2.src = Math.floor(rnd()*cards.length); q2.bend = (rnd()-.5)*.9; q2.b = rnd() < .45; q2.px = null; q2.lane = rnd();
        break;
      }
    }
    var panelX = W*.5, panelY = H*.6;
    if (ans && an > .01){ panelY = ans.offsetTop; }
    for (i=0;i<PMAX;i++){
      var q3 = P[i]; if (!q3.on) continue;
      q3.t += q3.sp*dt*(q3.mode ? 1.1 : .75);
      if (q3.t >= 1){ q3.on = false; continue; }
      var x0, y0, x1, y1;
      if (q3.mode === 0){ var cc = cards[q3.src]; x0 = cc._sx; y0 = cc._sy; var tp = pts[q3.tgt]; x1 = tp.sx; y1 = tp.sy; if (fm < .2){ x1 = lerp(cam.cx, tp.sx, fm*5); y1 = lerp(cam.cy, tp.sy, fm*5); } }
      else { var tp2 = pts[q3.tgt]; x0 = tp2.sx; y0 = tp2.sy; x1 = W*(.2 + .6*q3.lane); y1 = panelY + 2; }
      var mxp = (x0+x1)/2, myp = (y0+y1)/2, nx = -(y1-y0), ny = (x1-x0);
      var cxp = mxp + nx*q3.bend*.35, cyp = myp + ny*q3.bend*.35;
      var tt = Eo(q3.t), it = 1-tt;
      var X = it*it*x0 + 2*it*tt*cxp + tt*tt*x1, Y = it*it*y0 + 2*it*tt*cyp + tt*tt*y1;
      if (q3.px !== null){
        var fa = Math.sin(Math.PI*q3.t);
        ctx.strokeStyle = q3.b ? 'rgba(201,168,106,'+(.85*fa).toFixed(3)+')' : 'rgba(236,233,226,'+(.55*fa).toFixed(3)+')';
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(q3.px, q3.py); ctx.lineTo(X, Y); ctx.stroke();
      }
      q3.px = X; q3.py = Y;
    }
    ctx.globalCompositeOperation = 'source-over';

    // entity nodes + labels (front-facing only)
    if (en > .01){
      ENT.forEach(function(e, k){
        var pe = pts[e.i], dep = 1 - (pe.sz+1)/2, inChain = CHAIN.indexOf(k) >= 0 && ch*(CHAIN.length-1) >= CHAIN.indexOf(k) - .001 && ch > 0;
        var a2 = en * clamp((dep-.25)/.4, .12, 1);
        var rr2 = (inChain ? 5 : 3.5) * pe.k;
        ctx.globalAlpha = a2;
        ctx.fillStyle = inChain ? '#FFE6B4' : '#C9A86A'; ctx.fillRect(pe.sx-rr2/2, pe.sy-rr2/2, rr2, rr2);
        ctx.strokeStyle = 'rgba(201,168,106,.8)'; ctx.lineWidth = 1; var rq = (9 + (inChain ? 3*Math.sin(time*4)+3 : 0))*pe.k; ctx.strokeRect(pe.sx-rq/2, pe.sy-rq/2, rq, rq);
        ctx.beginPath(); ctx.moveTo(pe.sx + rq/2, pe.sy); ctx.lineTo(pe.sx + rq/2 + 10, pe.sy); ctx.stroke();
        ctx.globalAlpha = 1;
        pill(pe.sx + rq/2 + 10, pe.sy, e.name, a2*(1-.25*an), inChain);
      });
    }
    // agent labels
    if (ag > .01){
      AG.forEach(function(o){ if (o._x == null) return; var front = clamp((-o._z+.9)/1.2, .35, 1); pill(o._x + 12, o._y - 14, o.name, ag*front, true); });
    }
  }};
  return api;
}
