/**
 * Sapphire / Royal Aviation — guest wedding site (template #6)
 * Stack: Lenis + GSAP ScrollTrigger (vendored). No Three.js.
 */

const WEDDING_DATE = new Date("2027-01-26T00:00:00+05:30");
const UNLOCK_KEY = "evenzi-sp-unlocked-brindo-sree";
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;

const $ = (sel, root = document) => root.querySelector(sel);

const live = $("#sp-live");
function announce(msg) {
  if (live) live.textContent = msg;
}

/* -------------------------------------------------------------------------- */
/* Intro video — click to play; on ended → hero                               */
/* -------------------------------------------------------------------------- */
function initIntro(onReady) {
  const intro = $("#sp-intro");
  const video = $("#sp-intro-video");
  const playBtn = $("#sp-intro-play");
  const skipBtn = $("#sp-intro-skip");
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
      const hero = $("#sp-hero");
      if (hero) hero.scrollIntoView({ behavior: "auto", block: "start" });
      announce("Welcome aboard — you are at the boarding pass hero");
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
  video.addEventListener("error", () => {
    announce("Intro unavailable — continuing to boarding pass");
    finishIntro();
  });
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                  */
/* -------------------------------------------------------------------------- */
function initCountdown() {
  const root = $("#sp-countdown");
  if (!root) return;

  const daysEl = root.querySelector('[data-unit="days"]');
  const hoursEl = root.querySelector('[data-unit="hours"]');
  const minsEl = root.querySelector('[data-unit="mins"]');
  const secsEl = root.querySelector('[data-unit="secs"]');

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function tick() {
    let diff = WEDDING_DATE.getTime() - Date.now();
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
/* Unlock                                                                     */
/* -------------------------------------------------------------------------- */
function initUnlock() {
  const privateEl = $("#sp-private");
  const sticky = $("#sp-sticky-rsvp");
  const sheet = $("#sp-unlock-sheet");
  const scrim = $("#sp-unlock-scrim");
  const openBtn = $("#sp-unlock-open");
  const closeBtn = $("#sp-unlock-close");
  const skipBtn = $("#sp-unlock-skip");
  const form = $("#sp-unlock-form");
  const proceed = $("#sp-proceed");
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
    if (openBtn) openBtn.hidden = true;
    if (proceed) proceed.hidden = false;
    if (persist) {
      try {
        localStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    closeSheet();
    announce("Guest details unlocked — proceed to gate");
    if (ScrollTrigger) ScrollTrigger.refresh();
    window.requestAnimationFrame(() => {
      const el = $("#sp-announce");
      if (el) el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
    });
  }

  function openSheet() {
    if (!sheet || !scrim) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    scrim.hidden = false;
    const first = $("#sp-unlock-phone");
    if (first) first.focus();
  }

  function closeSheet() {
    if (!sheet || !scrim) return;
    sheet.hidden = true;
    scrim.hidden = true;
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

  if (isUnlocked()) setUnlocked(false);
}

/* -------------------------------------------------------------------------- */
/* Smooth scroll + light reveals                                              */
/* -------------------------------------------------------------------------- */
function initSmoothScroll() {
  if (REDUCE || !Lenis || !gsap || !ScrollTrigger) return null;
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const progress = $("#sp-scroll-progress");
  lenis.on("scroll", ({ progress: p }) => {
    if (progress) progress.style.width = `${Math.round(p * 10000) / 100}%`;
  });
  return lenis;
}

function initMotion() {
  if (!gsap || !ScrollTrigger || REDUCE) return;
  gsap.registerPlugin(ScrollTrigger);

  const ticket = $(".sp-ticket");
  if (ticket) {
    gsap.from(ticket, {
      y: 24,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
      delay: 0.1,
    });
  }

  document.querySelectorAll(".sp-section").forEach((section) => {
    const targets = section.querySelectorAll(
      ".sp-h2, .sp-story-copy, .sp-flight-stop, .sp-pass, .sp-venue-card, .sp-travel-card, .sp-hotel-card, .sp-person, .sp-acc-item, .sp-rsvp-card, .sp-schedule-lead"
    );
    if (!targets.length) return;
    gsap.from(targets, {
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        once: true,
      },
      opacity: 0,
      y: 28,
      duration: 0.8,
      stagger: 0.06,
      ease: "power2.out",
      immediateRender: false,
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Banner dismiss                                                             */
/* -------------------------------------------------------------------------- */
function initBanner() {
  const btn = $("#sp-banner-dismiss");
  const banner = $(".sp-banner");
  btn?.addEventListener("click", () => {
    if (banner) banner.hidden = true;
  });
}

/* -------------------------------------------------------------------------- */
/* Party tabs (mobile)                                                        */
/* -------------------------------------------------------------------------- */
function initPartyTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-party-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-party-panel]"));
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-party-tab");
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => {
        const on = p.getAttribute("data-party-panel") === key;
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
  document.querySelectorAll(".sp-acc-item").forEach((item) => {
    const btn = item.querySelector(".sp-acc-btn");
    const panel = item.querySelector(".sp-acc-panel");
    const icon = item.querySelector(".sp-acc-icon");
    if (!btn || !panel) return;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      if (icon) icon.textContent = open ? "+" : "−";
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Gallery lightbox                                                           */
/* -------------------------------------------------------------------------- */
function initGallery() {
  const items = Array.from(document.querySelectorAll("[data-gallery-i]"));
  const box = $("#sp-lightbox");
  const img = $("#sp-lightbox-img");
  const closeBtn = $("#sp-lightbox-close");
  const prevBtn = $("#sp-lightbox-prev");
  const nextBtn = $("#sp-lightbox-next");
  if (!items.length || !box || !img) return;

  let idx = 0;
  const srcs = items.map((el) => {
    const i = el.querySelector("img");
    return i ? i.src : "";
  });

  function show(i) {
    idx = (i + srcs.length) % srcs.length;
    img.src = srcs[idx];
    img.alt = `Gallery ${idx + 1}`;
    box.hidden = false;
  }
  function close() {
    box.hidden = true;
    img.removeAttribute("src");
  }

  items.forEach((el, i) => el.addEventListener("click", () => show(i)));
  closeBtn?.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(idx - 1);
  });
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(idx + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
}

/* -------------------------------------------------------------------------- */
/* RSVP mock                                                                  */
/* -------------------------------------------------------------------------- */
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
    announce("RSVP submitted — you’re cleared for boarding");
  });
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */
function boot() {
  if (REDUCE) document.body.classList.add("is-reduced");
  initCountdown();
  initUnlock();
  initBanner();
  initPartyTabs();
  initAccordion();
  initGallery();
  initRsvp();

  initIntro(() => {
    initSmoothScroll();
    initMotion();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
