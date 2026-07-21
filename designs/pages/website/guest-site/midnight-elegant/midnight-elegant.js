/**
 * Midnight Elegant — immersive guest wedding site
 * Stack: Lenis + GSAP ScrollTrigger + SplitText + Three.js (vendored, no CDN)
 * ScrollSmoother is vendored but unused — Lenis owns smooth scroll + ST sync.
 * Three.js is imported dynamically so unlock/countdown still run if WebGL fails.
 */

const WEDDING_DATE = new Date("2027-01-26T00:00:00+05:30");
const UNLOCK_KEY = "evenzi-me-unlocked-brindo-sree";
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_COARSE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const IS_NARROW = () => window.matchMedia("(max-width: 767px)").matches;

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const SplitText = window.SplitText;
const Lenis = window.Lenis;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const live = $("#me-live");
function announce(msg) {
  if (live) live.textContent = msg;
}

/* -------------------------------------------------------------------------- */
/* Intro video — click to play; on ended → hero                               */
/* -------------------------------------------------------------------------- */
function initIntro(onReady) {
  const intro = $("#me-intro");
  const video = $("#me-intro-video");
  const playBtn = $("#me-intro-play");
  const skipBtn = $("#me-intro-skip");
  let finished = false;

  function finishIntro() {
    if (finished) return;
    finished = true;
    document.body.classList.remove("is-intro-active");
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
        } catch {
          /* ignore */
        }
      }
      const hero = $("#me-hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "auto", block: "start" });
      }
      announce("Welcome — you are at the invitation hero");
      onReady();
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

  /* Reduced motion: skip cinematic; land on hero immediately */
  if (REDUCE) {
    finishIntro();
    return;
  }

  document.body.classList.add("is-intro-active");
  playBtn.focus();

  function startPlayback() {
    intro.classList.add("is-playing");
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => {
        intro.classList.remove("is-playing");
        announce("Tap again to play the intro");
      });
    }
  }

  playBtn.addEventListener("click", startPlayback);
  /* Whole stage is also a play target (common cinematic UX) */
  intro.addEventListener("click", (e) => {
    if (finished || intro.classList.contains("is-playing")) return;
    if (e.target === skipBtn || skipBtn.contains(e.target)) return;
    startPlayback();
  });

  skipBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    finishIntro();
  });

  video.addEventListener("ended", finishIntro);
  video.addEventListener("error", () => {
    announce("Intro unavailable — continuing to invitation");
    finishIntro();
  });
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                  */
/* -------------------------------------------------------------------------- */
function initCountdown() {
  const root = $("#me-countdown");
  if (!root) return;

  const daysEl = root.querySelector('[data-unit="days"]');
  const hoursEl = root.querySelector('[data-unit="hours"]');
  const minsEl = root.querySelector('[data-unit="mins"]');
  const secsEl = root.querySelector('[data-unit="secs"]');

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function tick() {
    const now = Date.now();
    let diff = WEDDING_DATE.getTime() - now;
    if (diff < 0) diff = 0;

    const secs = Math.floor(diff / 1000);
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minsEl) minsEl.textContent = pad(mins);
    if (secsEl) secsEl.textContent = pad(remSecs);
  }

  tick();
  window.setInterval(tick, 1000);
}

/* -------------------------------------------------------------------------- */
/* Unlock gate                                                                */
/* -------------------------------------------------------------------------- */
function initUnlock() {
  const privateEl = $("#me-private");
  const sticky = $("#me-sticky-rsvp");
  const sheet = $("#me-unlock-sheet");
  const scrim = $("#me-unlock-scrim");
  const openBtn = $("#me-unlock-open");
  const closeBtn = $("#me-unlock-close");
  const skipBtn = $("#me-unlock-skip");
  const form = $("#me-unlock-form");
  let lastFocus = null;

  function isUnlocked() {
    try {
      return localStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setUnlocked(persist) {
    if (!privateEl) return;
    privateEl.hidden = false;
    privateEl.classList.remove("is-locked");
    privateEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-unlocked");
    if (sticky) sticky.hidden = false;
    if (persist) {
      try {
        localStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    closeSheet();
    announce("Guest details unlocked");
    if (ScrollTrigger) ScrollTrigger.refresh();
    window.requestAnimationFrame(() => {
      const announceEl = $("#me-announce");
      if (announceEl) {
        announceEl.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
      }
    });
  }

  function openSheet() {
    if (!sheet || !scrim) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    scrim.hidden = false;
    const first = $("#me-unlock-phone");
    if (first) first.focus();
  }

  function closeSheet() {
    if (!sheet || !scrim) return;
    sheet.hidden = true;
    scrim.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  if (isUnlocked()) setUnlocked(false);

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

  $("#me-announce-dismiss")?.addEventListener("click", () => {
    const a = $("#me-announce");
    if (a) a.hidden = true;
  });
}

/* -------------------------------------------------------------------------- */
/* Party tabs                                                                 */
/* -------------------------------------------------------------------------- */
function initPartyTabs() {
  const seg = $("#me-party-seg");
  if (!seg) return;
  const items = $$(".me-seg-item", seg);
  const panels = $$(".me-party-panel");

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-side");
      items.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      panels.forEach((p) => {
        const on = p.getAttribute("data-side") === side;
        p.classList.toggle("is-active", on);
        p.hidden = !on;
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Accordion                                                                  */
/* -------------------------------------------------------------------------- */
function initAccordion() {
  $$(".me-acc-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      $$(".me-acc-trigger").forEach((other) => {
        if (other === btn) return;
        other.setAttribute("aria-expanded", "false");
        const oid = other.getAttribute("aria-controls");
        const op = oid ? document.getElementById(oid) : null;
        if (op) op.hidden = true;
      });

      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (panel) panel.hidden = expanded;
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Gallery lightbox                                                           */
/* -------------------------------------------------------------------------- */
function initGallery() {
  const items = $$(".me-gallery-item");
  const lightbox = $("#me-lightbox");
  const scrim = $("#me-lightbox-scrim");
  const img = $("#me-lightbox-img");
  const caption = $("#me-lightbox-caption");
  const closeBtn = $("#me-lightbox-close");
  const prevBtn = $("#me-lightbox-prev");
  const nextBtn = $("#me-lightbox-next");
  let index = 0;
  let lastFocus = null;

  const slides = items.map((btn) => {
    const el = btn.querySelector("img");
    return {
      src: el?.currentSrc || el?.src || "",
      alt: el?.alt || "",
    };
  });

  function show(i) {
    if (!slides.length || !img) return;
    index = (i + slides.length) % slides.length;
    img.src = slides[index].src;
    img.alt = slides[index].alt;
    if (caption) caption.textContent = slides[index].alt;
  }

  function open(i) {
    lastFocus = document.activeElement;
    if (lightbox) lightbox.hidden = false;
    if (scrim) scrim.hidden = false;
    show(i);
    closeBtn?.focus();
  }

  function close() {
    if (lightbox) lightbox.hidden = true;
    if (scrim) scrim.hidden = true;
    if (img) img.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  items.forEach((btn, i) => btn.addEventListener("click", () => open(i)));
  closeBtn?.addEventListener("click", close);
  scrim?.addEventListener("click", close);
  prevBtn?.addEventListener("click", () => show(index - 1));
  nextBtn?.addEventListener("click", () => show(index + 1));

  document.addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}

/* -------------------------------------------------------------------------- */
/* RSVP mock                                                                  */
/* -------------------------------------------------------------------------- */
function initRsvp() {
  const form = $("#me-rsvp-form");
  const success = $("#me-rsvp-success");
  const hidden = $("#me-plus-ones");
  const display = $("#me-plus-ones-display");
  const minus = $("#me-plus-minus");
  const plus = $("#me-plus-plus");
  let plusOnes = 0;

  function setPlus(n) {
    plusOnes = Math.max(0, Math.min(2, n));
    if (hidden) hidden.value = String(plusOnes);
    if (display) display.textContent = String(plusOnes);
    if (minus) minus.disabled = plusOnes <= 0;
    if (plus) plus.disabled = plusOnes >= 2;
  }

  setPlus(0);
  minus?.addEventListener("click", () => setPlus(plusOnes - 1));
  plus?.addEventListener("click", () => setPlus(plusOnes + 1));

  $$(".me-toggle").forEach((group) => {
    const buttons = $$(".me-toggle-btn", group);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
    });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    form.hidden = true;
    if (success) success.hidden = false;
    announce("RSVP submitted successfully");
  });

  $("#me-download-card")?.addEventListener("click", () => {
    announce("Invitation card download is a demo action");
  });
}

/* -------------------------------------------------------------------------- */
/* Lenis + ScrollTrigger                                                      */
/* -------------------------------------------------------------------------- */
function initSmoothScroll() {
  if (REDUCE || !Lenis || !gsap || !ScrollTrigger) {
    document.body.classList.add("is-reduced");
    return null;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    touchMultiplier: 1.35,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const progress = $("#me-scroll-progress");
  lenis.on("scroll", ({ progress: p }) => {
    if (progress) progress.style.width = `${Math.min(100, p * 100)}%`;
  });

  return lenis;
}

/* -------------------------------------------------------------------------- */
/* Hero SplitText + scroll cinematics                                         */
/* -------------------------------------------------------------------------- */
function initMotion(lenis) {
  if (!gsap || !ScrollTrigger) return;

  /* Name reveal */
  if (!REDUCE && SplitText) {
    const names = $$("[data-split]");
    names.forEach((el) => {
      const split = new SplitText(el, { type: "chars" });
      gsap.from(split.chars, {
        opacity: 0,
        y: 28,
        rotateX: -40,
        duration: 0.85,
        stagger: 0.035,
        ease: "power3.out",
        delay: 0.25,
      });
    });
    gsap.from(".me-hero-amp, .me-hero-date, .me-hero-tagline, .me-countdown, #me-unlock-open", {
      opacity: 0,
      y: 18,
      duration: 0.8,
      stagger: 0.08,
      delay: 0.7,
      ease: "power2.out",
    });
  }

  if (REDUCE) return;

  /* Section reveals — avoid opacity:0 on interactive gallery tiles */
  $$(".me-section").forEach((section) => {
    const targets = section.querySelectorAll(
      ".me-section-head, .me-story-copy, .me-story-fig, .me-flight-stop, .me-event-card, .me-travel-card, .me-hotel-card, .me-person, .me-acc-item, .me-rsvp-form, .me-map-placeholder, .me-venue-address"
    );
    if (!targets.length) return;
    gsap.from(targets, {
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        toggleActions: "play none none none",
        once: true,
      },
      opacity: 0,
      y: 36,
      duration: 0.9,
      stagger: 0.06,
      ease: "power2.out",
      immediateRender: false,
    });
  });

  /* Gallery items: light scale-in only (stay clickable / visible) */
  const galleryItems = $$(".me-gallery-item");
  if (galleryItems.length) {
    gsap.from(galleryItems, {
      scrollTrigger: {
        trigger: ".me-gallery",
        start: "top 80%",
        once: true,
      },
      scale: 0.96,
      duration: 0.7,
      stagger: 0.05,
      ease: "power2.out",
      immediateRender: false,
    });
  }

  /* Story parallax on images */
  $$(".me-story-fig img").forEach((img, i) => {
    gsap.to(img, {
      yPercent: i % 2 === 0 ? -8 : 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".me-story",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  /* Schedule pin reveal on desktop */
  if (!IS_NARROW() && !IS_COARSE) {
    const days = $$(".me-schedule-day");
    days.forEach((day) => {
      gsap.from(day.querySelectorAll(".me-event-card"), {
        scrollTrigger: {
          trigger: day,
          start: "top 70%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: -24,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });
    });
  }

  /* Gallery horizontal pin (desktop immersive) */
  const gallery = $(".me-gallery");
  const track = $("#me-gallery-track");
  if (gallery && track && window.matchMedia("(min-width: 1024px)").matches && !IS_COARSE) {
    gallery.classList.add("is-immersive");
    const totalScroll = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
    gsap.to(track, {
      x: () => -totalScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: gallery,
        start: "top top",
        end: () => `+=${totalScroll()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /* Flight path draw */
  const flight = $(".me-flight-path");
  if (flight) {
    gsap.from(".me-flight-stop", {
      scrollTrigger: {
        trigger: flight,
        start: "top 75%",
      },
      opacity: 0,
      y: 20,
      stagger: 0.15,
      duration: 0.7,
      ease: "power2.out",
    });
  }

  void lenis;
}

/* -------------------------------------------------------------------------- */
/* Three.js hero — golden particles / diya glow                               */
/* -------------------------------------------------------------------------- */
async function initHeroWebGL() {
  if (REDUCE) return;

  const canvas = $("#me-hero-canvas");
  const hero = $("#me-hero");
  if (!canvas || !hero) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.warn("[midnight-elegant] Three.js failed to load; poster-only hero.", err);
    return;
  }

  const mobile = IS_COARSE || IS_NARROW();
  const particleCount = mobile ? 80 : 220;
  const dprCap = mobile ? 1.25 : Math.min(window.devicePixelRatio || 1, 1.75);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !mobile,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(dprCap);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  /* Soft ambient gold glow spheres (diya-like) */
  const glowGeo = new THREE.SphereGeometry(0.35, mobile ? 12 : 24, mobile ? 12 : 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xc9a24b,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const glows = [];
  for (let i = 0; i < (mobile ? 3 : 5); i++) {
    const mesh = new THREE.Mesh(glowGeo, glowMat.clone());
    mesh.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2);
    mesh.scale.setScalar(0.6 + Math.random() * 1.4);
    scene.add(mesh);
    glows.push({ mesh, speed: 0.15 + Math.random() * 0.25, phase: Math.random() * Math.PI * 2 });
  }

  /* Particle field */
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xe7c878,
    size: mobile ? 0.045 : 0.055,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let running = true;
  let raf = 0;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    points.rotation.y = t * 0.04;
    points.rotation.x = Math.sin(t * 0.12) * 0.05;

    const pos = geo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.4 + i) * 0.0012;
    }
    geo.attributes.position.needsUpdate = true;

    glows.forEach((g) => {
      g.mesh.position.y += Math.sin(t * g.speed + g.phase) * 0.002;
      g.mesh.material.opacity = 0.12 + Math.sin(t * g.speed + g.phase) * 0.06;
    });

    camera.position.x = Math.sin(t * 0.08) * 0.25;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  /* Progressive: paint poster first, then fade WebGL in */
  window.setTimeout(() => {
    canvas.classList.add("is-ready");
    frame();
  }, 180);

  /* Pause when off-screen / tab hidden */
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      running = visible && !document.hidden;
      if (running && !raf) frame();
      if (!running && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.05 }
  );
  io.observe(hero);

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden && hero.getBoundingClientRect().bottom > 0;
    if (running && !raf) frame();
    if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Ambient particle canvas between sections (cheap CSS-free accent via Three) */
/* -------------------------------------------------------------------------- */
function initAmbientAccent() {
  if (REDUCE || IS_COARSE) return;
  /* Intentionally light — hero WebGL carries the immersive weight.
     Extra canvases on mobile hurt; skip ambient WebGL on coarse pointers. */
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */
function boot() {
  if (REDUCE) document.body.classList.add("is-reduced");

  initCountdown();
  initUnlock();
  initPartyTabs();
  initAccordion();
  initGallery();
  initRsvp();

  /* Intro first — hero SplitText / Lenis / WebGL start after video ends (or skip) */
  initIntro(() => {
    const lenis = initSmoothScroll();
    initMotion(lenis);

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => initHeroWebGL(), { timeout: 1200 });
    } else {
      window.setTimeout(initHeroWebGL, 200);
    }
    initAmbientAccent();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
