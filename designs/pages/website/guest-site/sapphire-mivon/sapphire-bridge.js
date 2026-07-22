/**
 * Sapphire × Mivon bridge — intro, countdown, unlock only.
 * Mivon scripts.js owns scroll/motion; do not init Lenis here.
 */
(function () {
  const WEDDING_DATE = new Date("2027-01-26T00:00:00+05:30");
  /** Placeholder until publish / first-invite date is locked */
  const COUNTDOWN_ORIGIN = new Date("2026-06-01T00:00:00+05:30");
  const UNLOCK_KEY = "evenzi-spm-unlocked-brindo-sree";
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);

  function announce(msg) {
    const live = $("#sp-live");
    if (live) live.textContent = msg;
  }

  const PRIVATE_SECTION_IDS = new Set(["#story", "#schedule", "#party", "#gallery", "#qa", "#rsvp", "#sp-announce"]);

  function setInertExcept(exceptEl, enabled) {
    const peers = [
      $("#sp-hero"),
      $(".sp-nav"),
      $("#smooth-wrapper"),
      $(".progress-wrap"),
      $("#sp-skip"),
    ];
    peers.forEach((el) => {
      if (!el || el === exceptEl) return;
      if (enabled) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function trapFocus(container, onEscape) {
    const focusable = () =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hidden && el.offsetParent !== null);

    function onKeyDown(e) {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }

  function isGuestUnlocked() {
    const privateEl = $("#sp-private");
    return (
      document.body.classList.contains("is-unlocked") ||
      (privateEl && !privateEl.hidden && !privateEl.classList.contains("is-locked"))
    );
  }

  function syncSkipLink() {
    const skip = $("#sp-skip");
    if (!skip) return;
    const unlocked = isGuestUnlocked();
    if (unlocked) {
      skip.href = "#story";
      skip.textContent = "Skip to story";
      return;
    }
    skip.href = "#sp-hero";
    skip.textContent = "Skip to boarding pass";
  }

  function syncNavGate() {
    const locked = !isGuestUnlocked();
    document.querySelectorAll(".sp-nav .nav-link[href^='#']").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || !PRIVATE_SECTION_IDS.has(href)) return;
      link.classList.toggle("is-gated", locked);
      link.setAttribute("aria-disabled", locked ? "true" : "false");
      if (locked) link.setAttribute("tabindex", "-1");
      else link.removeAttribute("tabindex");
    });
  }

  function refreshMivonScroll() {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    if (window.ScrollSmoother && window.ScrollSmoother.get) {
      const s = window.ScrollSmoother.get();
      if (s) s.refresh();
    }
  }

  function scheduleScrollRefresh() {
    refreshMivonScroll();
    window.requestAnimationFrame(() => {
      refreshMivonScroll();
      window.setTimeout(refreshMivonScroll, 120);
      window.setTimeout(refreshMivonScroll, 450);
    });
  }

  function scrollToEl(el) {
    if (!el) return;
    const navOffset = 88;
    const smoother = window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get();
    if (smoother && typeof smoother.scrollTo === "function") {
      smoother.scrollTo(el, !REDUCE, `top ${navOffset}px`);
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: REDUCE ? "auto" : "smooth" });
  }

  function initIntro(onReady) {
    const intro = $("#sp-intro");
    const video = $("#sp-intro-video");
    const playBtn = $("#sp-intro-play");
    const skipBtn = $("#sp-intro-skip");
    let finished = false;
    let releaseIntroTrap = () => {};

    function finishIntro() {
      if (finished) return;
      finished = true;
      document.body.classList.remove("is-intro-active");
      setInertExcept(intro, false);
      if (typeof releaseIntroTrap === "function") releaseIntroTrap();
      if (!intro) {
        onReady();
        return;
      }
      intro.classList.add("is-exiting");
      intro.setAttribute("aria-hidden", "true");
      const done = () => {
        intro.classList.add("is-done");
        intro.hidden = true;
        if (video) {
          try {
            video.pause();
          } catch (_) {}
        }
        announce("Welcome aboard");
        onReady();
        refreshMivonScroll();
        const hash = window.location.hash;
        const hashTarget = hash && hash !== "#" ? document.querySelector(hash) : null;
        if (hashTarget) {
          window.setTimeout(() => {
            scheduleScrollRefresh();
            scrollToEl(hashTarget);
          }, 80);
          return;
        }
        scheduleScrollRefresh();
        const hero = $("#sp-hero");
        const smoother = window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get();
        if (smoother && typeof smoother.scrollTo === "function") {
          smoother.scrollTo(0, false);
        } else if (hero) {
          hero.scrollIntoView({ behavior: "auto", block: "start" });
        }
      };
      if (REDUCE) {
        done();
        return;
      }
      window.setTimeout(done, 700);
    }

    if (!intro || !video || !playBtn) {
      onReady();
      return;
    }
    if (REDUCE) {
      finishIntro();
      return;
    }

    document.body.classList.add("is-intro-active");
    setInertExcept(intro, true);
    releaseIntroTrap = trapFocus(intro, () => finishIntro());
    playBtn.focus();

    function startPlayback() {
      intro.classList.add("is-playing");
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          intro.classList.remove("is-playing");
        });
      }
    }

    playBtn.addEventListener("click", startPlayback);
    intro.addEventListener("click", (e) => {
      if (finished || intro.classList.contains("is-playing")) return;
      if (skipBtn && (e.target === skipBtn || skipBtn.contains(e.target))) return;
      startPlayback();
    });
    skipBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      finishIntro();
    });
    video.addEventListener("ended", finishIntro);
    video.addEventListener("error", finishIntro);
  }

  function initCountdown() {
    const bar = $("#sp-countdown");
    const fill = $("#sp-ticket-fill");
    const days = $("#sp-ticket-days");
    const inflight = $("#sp-ticket-inflight");
    if (!bar || !fill || !days) return;

    const MS_DAY = 86400000;

    function clamp01(n) {
      return Math.min(1, Math.max(0, n));
    }

    function daysLeft(now) {
      return Math.max(0, Math.ceil((WEDDING_DATE.getTime() - now.getTime()) / MS_DAY));
    }

    function progressAt(now) {
      const span = WEDDING_DATE.getTime() - COUNTDOWN_ORIGIN.getTime();
      if (span <= 0) return 1;
      return clamp01((now.getTime() - COUNTDOWN_ORIGIN.getTime()) / span);
    }

    function render() {
      const now = new Date();
      const pct = Math.round(progressAt(now) * 100);
      const left = daysLeft(now);
      const arrived = now.getTime() >= WEDDING_DATE.getTime();

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

    render();

    if (REDUCE) return;

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

  function initUnlock() {
    const privateEl = $("#sp-private");
    const sheet = $("#sp-unlock-sheet");
    const scrim = $("#sp-unlock-scrim");
    const openBtn = $("#sp-unlock-open");
    const closeBtn = $("#sp-unlock-close");
    const skipBtn = $("#sp-unlock-skip");
    const form = $("#sp-unlock-form");
    const proceed = $("#sp-proceed");
    let lastFocus = null;
    let releaseSheetTrap = () => {};

    function isUnlocked() {
      try {
        return localStorage.getItem(UNLOCK_KEY) === "1";
      } catch (_) {
        return false;
      }
    }

    function setUnlocked(persist) {
      if (!privateEl) return;
      privateEl.hidden = false;
      privateEl.classList.remove("is-locked");
      privateEl.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-unlocked");
      if (openBtn) openBtn.hidden = true;
      if (proceed) proceed.hidden = false;
      syncSkipLink();
      syncNavGate();
      if (persist) {
        try {
          localStorage.setItem(UNLOCK_KEY, "1");
        } catch (_) {}
      }
      closeSheet();
      announce("Guest details unlocked");
      scheduleScrollRefresh();
      initManifestFlight();
      window.requestAnimationFrame(() => scrollToEl($("#sp-announce") || $("#story")));
    }

    function openSheet() {
      if (!sheet || !scrim) return;
      lastFocus = document.activeElement;
      sheet.hidden = false;
      scrim.hidden = false;
      setInertExcept(sheet, true);
      releaseSheetTrap = trapFocus(sheet, closeSheet);
      $("#sp-unlock-phone")?.focus();
    }

    function closeSheet() {
      if (!sheet || !scrim) return;
      sheet.hidden = true;
      scrim.hidden = true;
      setInertExcept(sheet, false);
      releaseSheetTrap();
      releaseSheetTrap = () => {};
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    openBtn?.addEventListener("click", openSheet);
    closeBtn?.addEventListener("click", closeSheet);
    scrim?.addEventListener("click", closeSheet);
    skipBtn?.addEventListener("click", () => setUnlocked(true));
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      setUnlocked(true);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheet && !sheet.hidden) closeSheet();
    });
    proceed?.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToEl($("#sp-announce") || $("#story"));
    });

    if (isUnlocked()) setUnlocked(false);
  }

  function initNavAnchors() {
    document.querySelectorAll('.sp-nav a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        if (link.classList.contains("is-gated") || link.getAttribute("aria-disabled") === "true") {
          e.preventDefault();
          $("#sp-unlock-open")?.focus();
          announce("Check in to view guest details");
          return;
        }
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        scrollToEl(target);
        const nav = document.getElementById("navbarSupportedContent");
        if (nav?.classList.contains("show")) {
          nav.classList.remove("show");
        }
      });
    });
  }

  function initThemeChrome() {
    const nav = document.querySelector(".sp-nav");
    const hero = document.getElementById("sp-hero");
    const themeBtn = document.querySelector(".theme-icon");
    if (!nav) return;

    function syncNavChrome() {
      const onHero = hero ? hero.getBoundingClientRect().bottom > 72 : false;
      nav.classList.toggle("sp-nav--on-hero", onHero);
    }

    syncNavChrome();
    window.addEventListener("scroll", syncNavChrome, { passive: true });
    themeBtn?.addEventListener("click", () => window.setTimeout(syncNavChrome, 0));

    if (hero && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        () => syncNavChrome(),
        { root: null, threshold: [0, 0.15, 0.5, 1] }
      );
      io.observe(hero);
    }

    window.setTimeout(syncLogo, 150);
  }

  function initRsvp() {
    const form = $("#sp-rsvp-form");
    const fields = $("#sp-rsvp-fields");
    const success = $("#sp-rsvp-success");
    const minus = $("#sp-plus-minus");
    const plus = $("#sp-plus-plus");
    const countEl = $("#sp-plus-count");
    if (!form) return;

    let plusOnes = 0;
    function setPlus(n) {
      plusOnes = Math.max(0, Math.min(2, n));
      if (countEl) countEl.textContent = String(plusOnes);
    }

    document.querySelectorAll(".sp-rsvp-toggle").forEach((group) => {
      group.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          group.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
        });
      });
    });

    minus?.addEventListener("click", () => setPlus(plusOnes - 1));
    plus?.addEventListener("click", () => setPlus(plusOnes + 1));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (fields) fields.hidden = true;
      if (success) success.hidden = false;
      announce("RSVP submitted — you're cleared for boarding");
      refreshMivonScroll();
    });
  }

  function initHashScroll() {
    const privateEl = $("#sp-private");
    if (!privateEl || privateEl.hidden || privateEl.classList.contains("is-locked")) return;
    const hash = window.location.hash;
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    window.setTimeout(() => {
      scheduleScrollRefresh();
      scrollToEl(target);
    }, 300);
  }

  let manifestFlightInited = false;

  function initManifestFlight() {
    if (manifestFlightInited) {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      return;
    }
    const schedule = $("#schedule");
    const track = $("#sp-mf-track") || schedule;
    const curve = $("#sp-mf-curve");
    const trail = $("#sp-mf-trail");
    const plane = $("#sp-mf-plane");
    const scaleEl = $("#sp-mf-plane-scale");
    const craft = $("#sp-mf-plane-craft");
    if (!schedule || !track || !curve || !trail || !plane) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    manifestFlightInited = true;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    /* Final founder bake 2026-07-22 — Manifest→Party track space */
    const POINTS = [
      { x: 49.3, y: 2.3 },
      { x: 76.5, y: 18.3 },
      { x: 16.9, y: 29.1 },
      { x: 80.5, y: 39.8 },
      { x: 21.7, y: 49.5 },
      { x: 79.3, y: 61.1 },
      { x: 16, y: 70.7 },
      { x: 77.8, y: 82.8 },
    ];
    const PLANE_SIZE = 0.1;
    const NOSE_OFFSET = 25;
    const ZOOM_UNTIL = 0.02;
    const SAMPLE = 2.4;
    const DASH_LIFE_MS = 1400;
    const MAX_TRAIL = 48;

    if (craft) craft.setAttribute("transform", `scale(${PLANE_SIZE}) translate(-48 -28)`);

    let totalLen = 0;
    let lastSampleLen = 0;
    let lastT = -1;
    const segments = [];

    function fmt(n) {
      return (Math.round(n * 100) / 100).toFixed(2);
    }

    function pointsToPath(pts) {
      if (pts.length < 2) return "";
      const p = pts.map((pt) => ({ x: pt.x, y: pt.y }));
      const cr = [p[0], ...p, p[p.length - 1]];
      let d = `M ${fmt(p[0].x)} ${fmt(p[0].y)}`;
      for (let i = 1; i < cr.length - 2; i += 1) {
        const p0 = cr[i - 1];
        const p1 = cr[i];
        const p2 = cr[i + 1];
        const p3 = cr[i + 2];
        d += ` C ${fmt(p1.x + (p2.x - p0.x) / 6)} ${fmt(p1.y + (p2.y - p0.y) / 6)}, ${fmt(p2.x - (p3.x - p1.x) / 6)} ${fmt(p2.y - (p3.y - p1.y) / 6)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
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

    function measure() {
      try {
        totalLen = curve.getTotalLength();
      } catch {
        totalLen = 0;
      }
      return totalLen;
    }

    curve.setAttribute("d", pointsToPath(POINTS));
    measure();

    function tangentAt(len) {
      if (totalLen <= 0) return 0;
      const a = Math.max(0, len - 1);
      const b = Math.min(totalLen, len + 1);
      const p0 = curve.getPointAtLength(a);
      const p1 = curve.getPointAtLength(b);
      return Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
    }

    function zoomScale(t) {
      if (t <= 0) return 0.35;
      if (t >= ZOOM_UNTIL) return 1;
      return 0.35 + (0.65 * t) / ZOOM_UNTIL;
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

    function pruneTrail() {
      while (segments.length > MAX_TRAIL) {
        const seg = segments.shift();
        seg.el.remove();
      }
    }

    function spawnDashesToward(targetLen, now) {
      if (REDUCE || totalLen <= 0 || targetLen <= lastSampleLen + 0.35) return;
      let from = lastSampleLen;
      while (from < targetLen) {
        const to = Math.min(from + SAMPLE, targetLen);
        const p0 = curve.getPointAtLength(from);
        const p1 = curve.getPointAtLength(to);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "sp-mf-trail-seg");
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
      pruneTrail();
    }

    function ageTrail(now) {
      if (REDUCE) return;
      for (let i = 0; i < segments.length; i += 1) {
        const seg = segments[i];
        const life = 1 - (now - seg.born) / DASH_LIFE_MS;
        seg.el.style.opacity = life <= 0 ? "0.35" : String(Math.max(0.35, Math.min(1, life)));
      }
    }

    function applyProgress(t) {
      if (totalLen <= 0) measure();
      if (totalLen <= 0) return;
      const clamped = Math.min(Math.max(t, 0), 1);
      if (Math.abs(clamped - lastT) < 0.0008) return;
      lastT = clamped;
      const now = performance.now();
      const len = clamped * totalLen;
      const pt = curve.getPointAtLength(len);
      const rot = tangentAt(len) + NOSE_OFFSET;
      plane.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${rot})`);
      if (scaleEl) scaleEl.setAttribute("transform", `scale(${zoomScale(clamped)})`);
      if (len < lastSampleLen - 0.5) trimTrailTo(len);
      else spawnDashesToward(len, now);
      ageTrail(now);
    }

    if (REDUCE) {
      applyProgress(1);
      return;
    }

    /* Single driver: ST scrub lag = fluid with ScrollSmoother; no parallel rAF */
    ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.85,
      invalidateOnRefresh: true,
      onRefresh() {
        measure();
        clearTrail();
        lastT = -1;
      },
      onUpdate(self) {
        applyProgress(self.progress);
      },
    });

    applyProgress(0);

    window.addEventListener(
      "load",
      () => {
        measure();
        lastT = -1;
        applyProgress(0);
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  }

  function initHeroVideo() {
    const hero = $("#sp-hero");
    const video = $("#sp-hero-video");
    if (!hero || !video) return;

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = !!(conn && conn.saveData);
    const slowNet = !!(conn && (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g"));
    const posterOnly = REDUCE || saveData || slowNet;

    if (posterOnly) {
      hero.classList.add("is-poster-only");
      return;
    }

    let playing = false;

    function tryPlay() {
      if (posterOnly || document.hidden) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          playing = true;
          video.classList.add("is-ready");
        }).catch(() => {
          hero.classList.add("is-poster-only");
        });
      } else {
        playing = true;
        video.classList.add("is-ready");
      }
    }

    function tryPause() {
      if (!playing) return;
      try {
        video.pause();
      } catch (_) {}
      playing = false;
    }

    video.addEventListener("loadeddata", () => {
      video.classList.add("is-ready");
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e) return;
          if (e.isIntersecting && e.intersectionRatio >= 0.1) tryPlay();
          else tryPause();
        },
        { threshold: [0, 0.1, 0.25] }
      );
      io.observe(hero);
    } else {
      tryPlay();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) tryPause();
      else if (hero.getBoundingClientRect().bottom > 40) tryPlay();
    });

    const unlockSheet = $("#sp-unlock-sheet");
    if (unlockSheet && "MutationObserver" in window) {
      const mo = new MutationObserver(() => {
        const open = !unlockSheet.hidden && unlockSheet.getAttribute("aria-hidden") !== "true";
        if (open) tryPause();
        else if (hero.getBoundingClientRect().bottom > 40) tryPlay();
      });
      mo.observe(unlockSheet, { attributes: true, attributeFilter: ["hidden", "aria-hidden", "class"] });
    }
  }

  function initRouteTakeoff() {
    const root = $("#sp-route-scroll");
    const jet = $("#sp-route-jet");
    const status = $("#sp-route-status");
    if (!root || !jet) return;

    const cfg = {
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
    };

    function lerp(a, b, s) {
      return a + (b - a) * s;
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
      return {
        x: lerp(p1x, p2x, 0.35 + soft * 0.35),
        y: lerp(runwayY, p2y, 0.08 + (1 - soft) * 0.35),
      };
    }

    function sample(t) {
      const clamped = Math.min(Math.max(t, 0), 1);
      const taxiShare = cfg.taxiShare / 100;
      const soft = cfg.liftSoft / 100;
      let x;
      let y;
      let rot;
      let climbU = 0;

      if (clamped <= taxiShare) {
        const s = taxiShare === 0 ? 0 : clamped / taxiShare;
        x = lerp(cfg.p0x, cfg.p1x, s);
        y = cfg.runwayY;
        rot = cfg.levelRot;
      } else {
        const s = (clamped - taxiShare) / (1 - taxiShare);
        climbU = s;
        const p1 = { x: cfg.p1x, y: cfg.runwayY };
        const p2 = { x: cfg.p2x, y: cfg.p2y };
        const ctrl = climbControl(cfg.p1x, cfg.runwayY, cfg.p2x, cfg.p2y, soft);
        const pt = quadPoint(p1, ctrl, p2, s);
        x = pt.x;
        y = pt.y;
        const climbTan = quadTangentDeg(p1, ctrl, p2, s);
        const climbRot = climbTan + cfg.noseOffset;
        const rotBlendLen = 0.25 + soft * 0.45;
        const blend = Math.min(s / rotBlendLen, 1);
        const ease = blend * blend * (3 - 2 * blend);
        rot = lerp(cfg.levelRot, climbRot, ease);
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
      jet.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})${flip}`;
      jet.style.opacity = String(opacity);
      if (status) {
        const pct = Math.round(Math.min(Math.max(t, 0), 1) * 100);
        const phase = t <= taxiShare ? "taxi" : "climb";
        status.textContent =
          t >= 0.99
            ? "His → Hers · cleared"
            : "His → Hers · " + phase + " " + pct + "%";
        status.dataset.done = t >= 0.99 ? "1" : "0";
      }
    }

    if (REDUCE || !window.gsap || !window.ScrollTrigger) {
      place(0.7);
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.85,
      onUpdate(self) {
        place(self.progress);
      },
    });

    place(0);
  }

  syncSkipLink();
  syncNavGate();

  initIntro(() => {
    initCountdown();
    initUnlock();
    initHeroVideo();
    initRouteTakeoff();
    initManifestFlight();
    syncSkipLink();
    syncNavGate();
    initNavAnchors();
    initThemeChrome();
    initRsvp();
    initHashScroll();
    scheduleScrollRefresh();
    window.addEventListener("load", scheduleScrollRefresh, { once: true });
  });
})();
