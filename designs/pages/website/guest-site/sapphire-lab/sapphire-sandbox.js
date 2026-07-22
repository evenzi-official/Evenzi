/**
 * Sapphire sandbox — jet demos A/C/D + paper-plane M1–M4
 */

(function () {
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DASH_LIFE_MS = 1800;
  const SAMPLE_STEP = 10;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const Lenis = window.Lenis;

  function $(id) {
    return document.getElementById(id);
  }

  function scrollProgress(root) {
    const scrollable = root.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    const top = root.getBoundingClientRect().top;
    return Math.min(Math.max(-top, 0), scrollable) / scrollable;
  }

  /* ---------- A Runway takeoff (path sample + tangent nose) ---------- */
  function initA() {
    const root = $("a-scroll");
    const jet = $("a-jet");
    const status = $("a-status");
    const panel = $("a-controls");
    const guide = $("a-guide-path");
    if (!root || !jet || !panel) return;

    const STORE_KEY = "evenzi-sb-a-flight-cfg";
    const DEFAULTS = {
      previewT: 0,
      levelRot: 154,
      noseOffset: 161,
      runwayY: 79,
      p0x: 8,
      p1x: 42,
      p2x: 100,
      p2y: 28,
      taxiShare: 63,
      jetSize: 23,
      liftSoft: 92,
      flipY: true,
      scrubScroll: true,
    };

    let cfg = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) cfg = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }

    function lerp(a, b, s) {
      return a + (b - a) * s;
    }

    function persist() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
      } catch {
        /* ignore */
      }
    }

    function syncOutputs() {
      panel.querySelectorAll("[data-o]").forEach((el) => {
        const k = el.getAttribute("data-o");
        if (k && k in cfg) el.textContent = String(cfg[k]);
      });
      panel.querySelectorAll("input[data-k]").forEach((input) => {
        const k = input.getAttribute("data-k");
        if (!k || !(k in cfg)) return;
        if (input.type === "checkbox") input.checked = !!cfg[k];
        else input.value = String(cfg[k]);
      });
      jet.style.width = cfg.jetSize + "vw";
      if (guide) {
        const soft = (cfg.liftSoft ?? 70) / 100;
        const cx = lerp(cfg.p1x, cfg.p2x, 0.35 + soft * 0.35);
        const cy = lerp(cfg.runwayY, cfg.p2y, 0.08 + (1 - soft) * 0.35);
        guide.setAttribute(
          "d",
          `M ${cfg.p0x} ${cfg.runwayY} H ${cfg.p1x} Q ${cx} ${cy} ${cfg.p2x} ${cfg.p2y}`
        );
      }
    }

    function quadPoint(a, b, c, s) {
      const u = 1 - s;
      return {
        x: u * u * a.x + 2 * u * s * b.x + s * s * c.x,
        y: u * u * a.y + 2 * u * s * b.y + s * s * c.y,
      };
    }

    function quadTangentDeg(a, b, c, s) {
      const dx = 2 * (1 - s) * (b.x - a.x) + 2 * s * (c.x - b.x);
      const dy = 2 * (1 - s) * (b.y - a.y) + 2 * s * (c.y - b.y);
      return (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    function climbControl(p1x, runwayY, p2x, p2y, soft) {
      /* Higher soft → control point stays nearer runway longer (gradual lift) */
      return {
        x: lerp(p1x, p2x, 0.35 + soft * 0.35),
        y: lerp(runwayY, p2y, 0.08 + (1 - soft) * 0.35),
      };
    }

    function sample(t) {
      const clamped = Math.min(Math.max(t, 0), 1);
      const taxiShare = cfg.taxiShare / 100;
      const levelRot = cfg.levelRot;
      const noseOffset = cfg.noseOffset;
      const runwayY = cfg.runwayY;
      const p0x = cfg.p0x;
      const p1x = cfg.p1x;
      const p2x = cfg.p2x;
      const p2y = cfg.p2y;
      const soft = (cfg.liftSoft ?? 70) / 100;

      let x;
      let y;
      let rot;
      let climbU = 0;

      if (clamped <= taxiShare) {
        const s = taxiShare === 0 ? 0 : clamped / taxiShare;
        x = lerp(p0x, p1x, s);
        y = runwayY;
        rot = levelRot;
      } else {
        const s = (clamped - taxiShare) / (1 - taxiShare);
        climbU = s;
        const p1 = { x: p1x, y: runwayY };
        const p2 = { x: p2x, y: p2y };
        const ctrl = climbControl(p1x, runwayY, p2x, p2y, soft);
        const pt = quadPoint(p1, ctrl, p2, s);
        x = pt.x;
        y = pt.y;
        const climbTan = quadTangentDeg(p1, ctrl, p2, s);
        const climbRot = climbTan + noseOffset;
        /* Rotate gradually with softness (longer blend when softer) */
        const rotBlendLen = 0.25 + soft * 0.45;
        const blend = Math.min(s / rotBlendLen, 1);
        const ease = blend * blend * (3 - 2 * blend); /* smoothstep */
        rot = lerp(levelRot, climbRot, ease);
      }

      const scale = 1 - climbU * 0.28;
      const opacity = clamped < 0.9 ? 1 : Math.max(0, 1 - (clamped - 0.9) / 0.1);
      return { x, y, rot, scale, opacity, taxiShare };
    }

    function place(t) {
      const { x, y, rot, scale, opacity, taxiShare } = sample(t);
      const flip = cfg.flipY ? " scaleY(-1)" : "";
      jet.style.left = x + "%";
      jet.style.top = y + "%";
      jet.style.right = "auto";
      jet.style.bottom = "auto";
      jet.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})${flip}`;
      jet.style.opacity = String(opacity);
      if (status) {
        const pct = Math.round(Math.min(Math.max(t, 0), 1) * 100);
        const phase = t <= taxiShare ? "taxi" : "climb";
        status.textContent =
          t >= 0.99
            ? "Fly-off · scroll up to reverse"
            : "Scroll · " + phase + " " + pct + "% ↔";
        status.dataset.done = t >= 0.99 ? "1" : "0";
      }
    }

    function currentT() {
      if (cfg.scrubScroll && !REDUCE) return scrollProgress(root);
      return cfg.previewT / 100;
    }

    panel.addEventListener("input", (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      const k = input.getAttribute("data-k");
      if (!k) return;
      if (input.type === "checkbox") cfg[k] = input.checked;
      else cfg[k] = Number(input.value);
      persist();
      syncOutputs();
      place(currentT());
    });

    $("a-copy-cfg")?.addEventListener("click", async () => {
      const text = JSON.stringify(cfg, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = "Copied alignment JSON";
      } catch {
        window.prompt("Copy flight cfg:", text);
      }
    });

    $("a-reset-cfg")?.addEventListener("click", () => {
      cfg = { ...DEFAULTS };
      persist();
      syncOutputs();
      place(currentT());
    });

    syncOutputs();

    if (REDUCE) {
      place(0.7);
      return;
    }

    function tick() {
      place(currentT());
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- C Soar ---------- */
  function initC() {
    const root = $("c-scroll");
    const jet = $("c-jet");
    const status = $("c-status");
    if (!root || !jet) return;

    function place(t) {
      const x = -10 + t * 120;
      const y = 10 - t * 35;
      const rot = -12 - t * 8;
      jet.style.transform = `translate(${x}%, ${y}%) rotate(${rot}deg)`;
      jet.style.left = "0";
      jet.style.bottom = "30%";
      if (status) {
        const pct = Math.round(t * 100);
        status.textContent =
          t >= 0.99 ? "Soar 100% · scroll up to reverse" : "Scroll · soar " + pct + "% ↔";
        status.dataset.done = t >= 0.99 ? "1" : "0";
      }
    }

    if (REDUCE) {
      place(0.4);
      return;
    }

    function tick() {
      place(scrollProgress(root));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- D Markers ---------- */
  function initD() {
    const stops = document.querySelectorAll("#d-scroll .sb-landmark");
    const status = $("d-status");
    if (!stops.length) return;

    if (REDUCE) {
      stops[0].classList.add("is-active");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          stops.forEach((el) => el.classList.remove("is-active"));
          entry.target.classList.add("is-active");
          const n = String(Number(entry.target.getAttribute("data-stop") || 0) + 1).padStart(2, "0");
          if (status) {
            status.textContent = "Active stop · " + n;
            status.dataset.done = "0";
          }
        });
      },
      { root: null, threshold: 0.55 }
    );
    stops.forEach((el) => io.observe(el));
  }

  /* ---------- Paper plane flight helper (M1–M4) — bidirectional scrub ---------- */
  function createFlight(opts) {
    const { curve, trail, plane, status, label } = opts;
    if (!curve || !trail || !plane) return null;

    const totalLen = curve.getTotalLength();
    const segments = [];
    let lastSampleLen = 0;

    function setStatus(text, done) {
      if (!status) return;
      status.textContent = text;
      status.dataset.done = done ? "1" : "0";
    }

    function pointAt(t) {
      const len = Math.min(Math.max(t, 0), 1) * totalLen;
      return { pt: curve.getPointAtLength(len), len };
    }

    function tangentAt(len) {
      const a = Math.max(0, len - 1);
      const b = Math.min(totalLen, len + 1);
      const p0 = curve.getPointAtLength(a);
      const p1 = curve.getPointAtLength(b);
      return Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
    }

    function placePlane(t) {
      const { pt, len } = pointAt(t);
      plane.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${tangentAt(len)})`);
    }

    function spawnDashesToward(targetLen, now) {
      if (REDUCE || targetLen <= lastSampleLen + 0.5) return;
      let from = lastSampleLen;
      while (from < targetLen) {
        const to = Math.min(from + SAMPLE_STEP, targetLen);
        const p0 = curve.getPointAtLength(from);
        const p1 = curve.getPointAtLength(to);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "sb-trail-seg");
        line.setAttribute("x1", String(p0.x));
        line.setAttribute("y1", String(p0.y));
        line.setAttribute("x2", String(p1.x));
        line.setAttribute("y2", String(p1.y));
        line.dataset.endLen = String(to);
        line.style.opacity = "1";
        trail.appendChild(line);
        segments.push({ el: line, born: now, endLen: to });
        from = to;
      }
      lastSampleLen = targetLen;
    }

    /** Scroll-up: trim trail past current progress so plane + dashes reverse together */
    function trimTrailTo(targetLen) {
      for (let i = segments.length - 1; i >= 0; i -= 1) {
        const seg = segments[i];
        if (seg.endLen > targetLen + 0.5) {
          seg.el.remove();
          segments.splice(i, 1);
        }
      }
      lastSampleLen = Math.min(lastSampleLen, targetLen);
      if (segments.length) {
        lastSampleLen = Math.max(...segments.map((s) => s.endLen));
      } else {
        lastSampleLen = 0;
      }
    }

    function ageTrail(now) {
      if (REDUCE) return;
      for (let i = segments.length - 1; i >= 0; i -= 1) {
        const seg = segments[i];
        const life = 1 - (now - seg.born) / DASH_LIFE_MS;
        if (life <= 0) {
          /* keep path history for reverse scrub — soft fade only, don't remove by age */
          seg.el.style.opacity = "0.2";
        } else {
          seg.el.style.opacity = String(Math.max(0.2, Math.min(1, life)));
        }
      }
    }

    function drawStaticTrail() {
      const dash = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dash.setAttribute("class", "sb-trail-seg");
      dash.setAttribute("d", curve.getAttribute("d") || "");
      dash.style.opacity = "0.45";
      trail.appendChild(dash);
    }

    function applyProgress(t, now) {
      const clamped = Math.min(Math.max(t, 0), 1);
      placePlane(clamped);
      const { len } = pointAt(clamped);

      if (len < lastSampleLen - 0.5) {
        trimTrailTo(len);
      } else {
        spawnDashesToward(len, now);
      }
      ageTrail(now);

      const pct = Math.round(clamped * 100);
      if (clamped >= 0.995) {
        setStatus((label || "Flight") + " · 100% · scroll up to reverse", true);
      } else {
        setStatus((label || "Scroll") + " · " + pct + "% ↔", false);
      }
    }

    placePlane(0);
    setStatus((label || "Scroll") + " · 0% ↔", false);

    return {
      applyProgress,
      bootReduced() {
        placePlane(1);
        drawStaticTrail();
        setStatus("Reduced motion · static", true);
      },
    };
  }

  function initM1() {
    const flight = createFlight({
      curve: $("m1-curve"),
      trail: $("m1-trail"),
      plane: $("m1-plane"),
      status: $("m1-status"),
      label: "M1",
    });
    const root = $("m1-scroll");
    if (!flight || !root) return;
    if (REDUCE) {
      flight.bootReduced();
      return;
    }
    function tick(now) {
      flight.applyProgress(scrollProgress(root), now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initM2() {
    const flight = createFlight({
      curve: $("m2-curve"),
      trail: $("m2-trail"),
      plane: $("m2-plane"),
      status: $("m2-status"),
      label: "M2",
    });
    const root = $("m2-scroll");
    if (!flight || !root || !gsap || !ScrollTrigger) return;
    if (REDUCE) {
      flight.bootReduced();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const state = { t: 0 };
    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate(self) {
        state.t = self.progress;
      },
    });
    function tick(now) {
      flight.applyProgress(state.t, now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initM3() {
    const flight = createFlight({
      curve: $("m3-curve"),
      trail: $("m3-trail"),
      plane: $("m3-plane"),
      status: $("m3-status"),
      label: "M3",
    });
    const root = $("m3-scroll");
    if (!flight || !root || !gsap || !ScrollTrigger) return;
    if (REDUCE) {
      flight.bootReduced();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    let lenis = null;
    const state = { t: 0 };
    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onEnter() {
        if (lenis || !Lenis) return;
        lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => {
          if (lenis) lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      },
      onLeave() {
        if (!lenis) return;
        lenis.destroy();
        lenis = null;
      },
      onLeaveBack() {
        if (!lenis) return;
        lenis.destroy();
        lenis = null;
      },
      onUpdate(self) {
        state.t = self.progress;
      },
    });
    function tick(now) {
      flight.applyProgress(state.t, now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initM4() {
    const flight = createFlight({
      curve: $("m4-curve"),
      trail: $("m4-trail"),
      plane: $("m4-plane"),
      status: $("m4-status"),
      label: "M4",
    });
    const root = $("m4-scroll");
    const layer = $("m4-layer");
    if (!flight || !root || !layer || !gsap || !ScrollTrigger) return;
    if (REDUCE) {
      flight.bootReduced();
      layer.classList.add("is-front");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const state = { t: 0 };
    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate(self) {
        state.t = self.progress;
        if (self.progress < 0.35) {
          layer.classList.add("is-behind");
          layer.classList.remove("is-front");
        } else {
          layer.classList.add("is-front");
          layer.classList.remove("is-behind");
        }
      },
    });
    function tick(now) {
      flight.applyProgress(state.t, now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /**
   * Manifest dodge — Option 1: drag-handle waypoints on stage.
   */
  function initManifestFlight() {
    const root = $("mf-scroll");
    const stage = $("mf-stage");
    const layer = $("mf-layer");
    const svg = $("mf-svg");
    const curve = $("mf-curve");
    const trail = $("mf-trail");
    const plane = $("mf-plane");
    const scaleEl = $("mf-plane-scale");
    const craft = $("mf-plane-craft");
    const status = $("mf-status");
    const panel = $("mf-controls");
    const overlay = $("mf-edit-overlay");
    if (!root || !stage || !layer || !svg || !curve || !trail || !plane || !panel || !overlay) return;

    const STORE_KEY = "evenzi-sb-mf-flight-cfg-v9";
    const MF_SAMPLE = 1.25;
    const LABELS = ["Eye", "01", "02", "03", "04", "05", "06", "Park"];
    const IDS = ["eye", "c0", "c1", "c2", "c3", "c4", "c5", "park"];

    function defaultPoints() {
      return [
        { x: 49.3, y: 3.1 },
        { x: 76.5, y: 24.6 },
        { x: 16, y: 36.3 },
        { x: 81.5, y: 53 },
        { x: 18.2, y: 63.8 },
        { x: 76.5, y: 81 },
        { x: 17.2, y: 94 },
        { x: 79, y: 98 },
      ];
    }

    const DEFAULTS = {
      previewT: 0,
      planeSize: 10,
      noseOffset: 25,
      zoomUntil: 2,
      flipY: false,
      showGuide: true,
      showHandles: true,
      scrubScroll: true,
      points: defaultPoints(),
    };

    const segments = [];
    let lastSampleLen = 0;
    let totalLen = 0;
    let scrollST = null;
    let dragIndex = -1;
    const state = { t: 0, cfg: { ...DEFAULTS, points: defaultPoints() } };
    const handleEls = [];

    function loadCfg() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return { ...DEFAULTS, points: defaultPoints() };
        const parsed = JSON.parse(raw);
        const points =
          Array.isArray(parsed.points) && parsed.points.length === 8
            ? parsed.points.map((p) => ({
                x: Number(p.x),
                y: Number(p.y),
              }))
            : defaultPoints();
        return { ...DEFAULTS, ...parsed, points };
      } catch {
        return { ...DEFAULTS, points: defaultPoints() };
      }
    }

    function saveCfg() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state.cfg));
      } catch {
        /* ignore */
      }
    }

    function fmt(n) {
      return (Math.round(n * 100) / 100).toFixed(2);
    }

    function pointsToPath(pts) {
      if (pts.length < 2) return "";
      if (pts.length === 2) {
        return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} L ${fmt(pts[1].x)} ${fmt(pts[1].y)}`;
      }
      const p = pts.map((pt) => ({ x: pt.x, y: pt.y }));
      const cr = [p[0], ...p, p[p.length - 1]];
      let d = `M ${fmt(p[0].x)} ${fmt(p[0].y)}`;
      for (let i = 1; i < cr.length - 2; i += 1) {
        const p0 = cr[i - 1];
        const p1 = cr[i];
        const p2 = cr[i + 1];
        const p3 = cr[i + 2];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
      }
      return d;
    }

    function clearTrail() {
      lastSampleLen = 0;
      while (segments.length) {
        const seg = segments.pop();
        seg.el.remove();
      }
    }

    function rebuildCurve() {
      const d = pointsToPath(state.cfg.points);
      curve.setAttribute("d", d);
      try {
        totalLen = curve.getTotalLength();
      } catch {
        totalLen = 0;
      }
      clearTrail();
      return totalLen;
    }

    function tangentAt(len) {
      if (totalLen <= 0) return 0;
      const a = Math.max(0, len - 1);
      const b = Math.min(totalLen, len + 1);
      const p0 = curve.getPointAtLength(a);
      const p1 = curve.getPointAtLength(b);
      return Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
    }

    function zoomScale(t) {
      const until = Math.max(0.001, state.cfg.zoomUntil / 100);
      if (t <= 0) return 0.35;
      if (t >= until) return 1;
      return 0.35 + (0.65 * t) / until;
    }

    function trimTrailTo(targetLen) {
      for (let i = segments.length - 1; i >= 0; i -= 1) {
        if (segments[i].endLen > targetLen + 0.5) {
          segments[i].el.remove();
          segments.splice(i, 1);
        }
      }
      if (segments.length) lastSampleLen = Math.max(...segments.map((s) => s.endLen));
      else lastSampleLen = 0;
    }

    function spawnDashesToward(targetLen, now) {
      if (REDUCE || totalLen <= 0 || targetLen <= lastSampleLen + 0.15) return;
      let from = lastSampleLen;
      while (from < targetLen) {
        const to = Math.min(from + MF_SAMPLE, targetLen);
        const p0 = curve.getPointAtLength(from);
        const p1 = curve.getPointAtLength(to);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "sb-trail-seg");
        line.setAttribute("x1", String(p0.x));
        line.setAttribute("y1", String(p0.y));
        line.setAttribute("x2", String(p1.x));
        line.setAttribute("y2", String(p1.y));
        line.style.opacity = "1";
        trail.appendChild(line);
        segments.push({ el: line, born: now, endLen: to });
        from = to;
      }
      lastSampleLen = targetLen;
    }

    function ageTrail(now) {
      if (REDUCE) return;
      for (let i = 0; i < segments.length; i += 1) {
        const seg = segments[i];
        const life = 1 - (now - seg.born) / DASH_LIFE_MS;
        seg.el.style.opacity = life <= 0 ? "0.45" : String(Math.max(0.45, Math.min(1, life)));
      }
    }

    function setStatus(text, done) {
      if (!status) return;
      status.textContent = text;
      status.dataset.done = done ? "1" : "0";
    }

    function applyCraftSize() {
      const s = Math.max(0.08, state.cfg.planeSize / 100);
      const sy = state.cfg.flipY ? -s : s;
      // SVG applies right→left: scale after translate(-pivot) so craft centers on path point
      if (craft) craft.setAttribute("transform", `scale(${s} ${sy}) translate(-48 -28)`);
    }

    function syncHandles() {
      state.cfg.points.forEach((pt, i) => {
        const el = handleEls[i];
        if (!el) return;
        el.style.left = pt.x + "%";
        el.style.top = pt.y + "%";
      });
      overlay.classList.toggle("is-hidden", !state.cfg.showHandles);
    }

    function applyProgress(t, now) {
      const clamped = Math.min(Math.max(t, 0), 1);
      if (totalLen <= 0) rebuildCurve();
      if (totalLen <= 0) return;

      const len = clamped * totalLen;
      const pt = curve.getPointAtLength(len);
      const rot = tangentAt(len) + Number(state.cfg.noseOffset || 0);
      plane.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${rot})`);
      if (scaleEl) scaleEl.setAttribute("transform", `scale(${zoomScale(clamped)})`);

      if (len < lastSampleLen - 0.5) trimTrailTo(len);
      else spawnDashesToward(len, now);
      ageTrail(now);

      layer.classList.add("is-front");
      layer.classList.remove("is-behind");

      const pct = Math.round(clamped * 100);
      if (clamped >= 0.995) setStatus("Manifest · parked · scroll up ↔", true);
      else setStatus("Manifest flight · " + pct + "% ↔", false);
    }

    function syncGuide() {
      svg.classList.toggle("is-guide", !!state.cfg.showGuide);
    }

    function syncOutputs() {
      panel.querySelectorAll("[data-o]").forEach((out) => {
        const k = out.getAttribute("data-o");
        const v = state.cfg[k];
        out.textContent = typeof v === "number" ? String(Math.round(v)) : "";
      });
      panel.querySelectorAll("input[data-k]").forEach((input) => {
        const k = input.getAttribute("data-k");
        if (!(k in state.cfg) || k === "points") return;
        if (input.type === "checkbox") input.checked = !!state.cfg[k];
        else input.value = String(state.cfg[k]);
      });
    }

    function setupScroll() {
      if (!gsap || !ScrollTrigger) return;
      if (scrollST) {
        scrollST.kill();
        scrollST = null;
      }
      if (!state.cfg.scrubScroll) return;
      /* Pin stage: path + cards stay; only plane scrubs with scroll */
      scrollST = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * 2.6),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate(self) {
          state.t = self.progress;
          const preview = panel.querySelector('input[data-k="previewT"]');
          if (preview) {
            preview.value = String(Math.round(self.progress * 100));
            const out = panel.querySelector('[data-o="previewT"]');
            if (out) out.textContent = preview.value;
            state.cfg.previewT = Number(preview.value);
          }
        },
      });
    }

    function exportPayload() {
      return {
        mode: "drag-waypoints",
        points: state.cfg.points.map((p, i) => ({
          id: IDS[i],
          label: LABELS[i],
          x: Math.round(p.x * 10) / 10,
          y: Math.round(p.y * 10) / 10,
        })),
        planeSize: state.cfg.planeSize,
        noseOffset: state.cfg.noseOffset,
        zoomUntil: state.cfg.zoomUntil,
        flipY: !!state.cfg.flipY,
        pathD: pointsToPath(state.cfg.points),
      };
    }

    function applyCfg(partial, persist) {
      Object.assign(state.cfg, partial);
      if (!state.cfg.scrubScroll) state.t = state.cfg.previewT / 100;
      rebuildCurve();
      applyCraftSize();
      syncGuide();
      syncHandles();
      setupScroll();
      if (ScrollTrigger) ScrollTrigger.refresh();
      syncOutputs();
      if (persist) saveCfg();
    }

    function clientToPct(clientX, clientY) {
      const rect = overlay.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
      return {
        x: Math.min(98, Math.max(2, x)),
        y: Math.min(98, Math.max(2, y)),
      };
    }

    function buildHandleDom() {
      overlay.innerHTML = "";
      handleEls.length = 0;
      state.cfg.points.forEach((pt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mf-handle";
        btn.dataset.id = IDS[i];
        btn.dataset.index = String(i);
        btn.textContent = LABELS[i];
        btn.setAttribute("aria-label", "Drag waypoint " + LABELS[i]);
        btn.style.left = pt.x + "%";
        btn.style.top = pt.y + "%";
        overlay.appendChild(btn);
        handleEls.push(btn);

        btn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragIndex = i;
          btn.classList.add("is-dragging");
          btn.setPointerCapture(e.pointerId);
        });
      });
    }

    function onPointerMove(e) {
      if (dragIndex < 0) return;
      const pct = clientToPct(e.clientX, e.clientY);
      state.cfg.points[dragIndex] = pct;
      handleEls[dragIndex].style.left = pct.x + "%";
      handleEls[dragIndex].style.top = pct.y + "%";
      rebuildCurve();
      applyProgress(state.t, performance.now());
    }

    function onPointerUp(e) {
      if (dragIndex < 0) return;
      const btn = handleEls[dragIndex];
      if (btn) {
        btn.classList.remove("is-dragging");
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      dragIndex = -1;
      saveCfg();
      setStatus("Waypoint saved · Copy JSON when ready", false);
    }

    state.cfg = loadCfg();
    buildHandleDom();
    syncOutputs();
    rebuildCurve();
    applyCraftSize();
    syncGuide();
    syncHandles();

    if (REDUCE) {
      state.t = 1;
      applyProgress(1, performance.now());
      setStatus("Reduced motion · parked", true);
      return;
    }

    if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    setupScroll();
    if (!state.cfg.scrubScroll) state.t = state.cfg.previewT / 100;

    panel.addEventListener("input", (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || !input.dataset.k) return;
      const k = input.dataset.k;
      let v;
      if (input.type === "checkbox") v = input.checked;
      else v = Number(input.value);
      const patch = { [k]: v };
      if (k === "previewT") state.t = v / 100;
      applyCfg(patch, true);
    });

    $("mf-copy-cfg")?.addEventListener("click", async () => {
      const text = JSON.stringify(exportPayload(), null, 2);
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Waypoints copied", false);
      } catch {
        setStatus("Copy failed — see console", false);
        console.log(text);
      }
    });

    $("mf-reset-cfg")?.addEventListener("click", () => {
      state.cfg = { ...DEFAULTS, points: defaultPoints() };
      buildHandleDom();
      applyCfg({}, true);
      state.t = 0;
    });

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    function tick(now) {
      if (!state.cfg.scrubScroll) {
        state.t = state.cfg.previewT / 100;
      } else if (!gsap || !ScrollTrigger) {
        state.t = scrollProgress(root);
      }
      applyProgress(state.t, now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  initA();
  initC();
  initD();
  initM1();
  initM2();
  initM3();
  initM4();
  initManifestFlight();
  initTheme();
  initBoardingPass();
  initStitchPass();
})();

/**
 * Theme toggle — light / dark for pass card bake
 */
function initTheme() {
  const btn = document.getElementById("sb-theme-toggle");
  const live = document.getElementById("sb-live");
  if (!btn) return;

  const KEY = "evenzi-sb-theme";
  function apply(dark) {
    document.body.classList.toggle("is-dark", dark);
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.textContent = dark ? "Theme: Dark" : "Theme: Light";
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  let dark = false;
  try {
    dark = localStorage.getItem(KEY) === "dark";
  } catch {
    dark = false;
  }
  apply(dark);

  btn.addEventListener("click", () => {
    apply(!document.body.classList.contains("is-dark"));
    if (live) live.textContent = document.body.classList.contains("is-dark") ? "Dark theme" : "Light theme";
  });
}

/** Shared countdown math for pass card bakes */
function createCountdownClock() {
  const COUNTDOWN_ORIGIN = new Date("2026-06-01T00:00:00+05:30");
  const WEDDING = new Date("2027-01-26T00:00:00+05:30");
  const MS_DAY = 86400000;

  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }

  function daysLeft(now) {
    return Math.max(0, Math.ceil((WEDDING.getTime() - now.getTime()) / MS_DAY));
  }

  function progressAt(now) {
    const span = WEDDING.getTime() - COUNTDOWN_ORIGIN.getTime();
    if (span <= 0) return 1;
    return clamp01((now.getTime() - COUNTDOWN_ORIGIN.getTime()) / span);
  }

  return { WEDDING, daysLeft, progressAt };
}

function bindCountdownTick(render) {
  render();
  let timer = window.setInterval(render, 60000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = 0;
      return;
    }
    render();
    if (!timer) timer = window.setInterval(render, 60000);
  });
}

/**
 * Boarding pass — live progress toward wedding day.
 * COUNTDOWN_ORIGIN placeholder until founder locks publish / first-invite date.
 */
function initBoardingPass() {
  const fill = document.getElementById("sb-pass-fill");
  const eta = document.getElementById("sb-pass-eta");
  const bar = document.getElementById("sb-pass-progress");
  const checkin = document.getElementById("sb-pass-checkin");
  const live = document.getElementById("sb-live");
  if (!fill || !eta || !bar) return;

  const { daysLeft, progressAt } = createCountdownClock();

  function render() {
    const now = new Date();
    const p = progressAt(now);
    const pct = Math.round(p * 100);
    const left = daysLeft(now);
    const arrived = left === 0 && now.getTime() >= new Date("2027-01-26T00:00:00+05:30").getTime();

    fill.style.width = `${pct}%`;
    bar.setAttribute("aria-valuenow", String(pct));

    if (arrived) {
      eta.textContent = "ARRIVED · 26 JAN";
      bar.setAttribute("aria-valuetext", "Arrived 26 January");
    } else {
      eta.textContent = `ETA 26 JAN · ${left}d left`;
      bar.setAttribute("aria-valuetext", `${left} days until 26 January`);
    }
  }

  bindCountdownTick(render);

  checkin?.addEventListener("click", () => {
    if (live) live.textContent = "Check In — sandbox stub (unlock not wired here)";
  });
}

/**
 * Stitch boarding-pass bake — label/value layout + watermark + status.
 */
function initStitchPass() {
  const fill = document.getElementById("sb-st-fill");
  const days = document.getElementById("sb-st-days");
  const bar = document.getElementById("sb-st-progress");
  const inflight = document.getElementById("sb-st-inflight");
  const checkin = document.getElementById("sb-st-checkin");
  const live = document.getElementById("sb-live");
  if (!fill || !days || !bar) return;

  const { WEDDING, daysLeft, progressAt } = createCountdownClock();

  function render() {
    const now = new Date();
    const p = progressAt(now);
    const pct = Math.round(p * 100);
    const left = daysLeft(now);
    const arrived = now.getTime() >= WEDDING.getTime();

    fill.style.width = `${pct}%`;
    bar.setAttribute("aria-valuenow", String(pct));

    if (arrived) {
      days.textContent = "Arrived";
      if (inflight) inflight.hidden = true;
      bar.setAttribute("aria-valuetext", "Arrived 26 January");
    } else {
      days.textContent = `${left}d left`;
      if (inflight) inflight.hidden = pct <= 0;
      bar.setAttribute("aria-valuetext", `${left} days until 26 January`);
    }
  }

  bindCountdownTick(render);

  checkin?.addEventListener("click", () => {
    if (live) live.textContent = "Check In — Stitch bake stub (unlock not wired here)";
  });
}