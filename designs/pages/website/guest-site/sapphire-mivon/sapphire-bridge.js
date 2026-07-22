/**
 * Sapphire × Mivon bridge — intro, countdown, unlock only.
 * Mivon scripts.js owns scroll/motion; do not init Lenis here.
 */
(function () {
  const WEDDING_DATE = new Date("2027-01-26T00:00:00+05:30");
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
        const hero = $("#sp-hero");
        if (hero) hero.scrollIntoView({ behavior: "auto", block: "start" });
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
    const root = $("#sp-countdown");
    if (!root) return;
    const daysEl = root.querySelector('[data-unit="days"]');
    const hoursEl = root.querySelector('[data-unit="hours"]');
    const minsEl = root.querySelector('[data-unit="mins"]');
    const secsEl = root.querySelector('[data-unit="secs"]');
    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
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
    const logo = document.querySelector(".sp-nav .logo img[data-sp-logo], .sp-nav .logo img");
    const hero = document.getElementById("sp-hero");
    const themeBtn = document.querySelector(".theme-icon");
    if (!nav || !logo) return;

    const LOGO_DARK = "assets/imgs/logo-dark.svg";
    const LOGO_LIGHT = "assets/imgs/logo-light.svg";

    function syncLogo() {
      const onHero = hero ? hero.getBoundingClientRect().bottom > 72 : false;
      nav.classList.toggle("sp-nav--on-hero", onHero);
      if (onHero || document.body.classList.contains("light")) {
        logo.src = LOGO_DARK;
        return;
      }
      logo.src = LOGO_LIGHT;
    }

    syncLogo();
    window.addEventListener("scroll", syncLogo, { passive: true });
    themeBtn?.addEventListener("click", () => window.setTimeout(syncLogo, 0));

    if (hero && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        () => syncLogo(),
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

  syncSkipLink();
  syncNavGate();

  initIntro(() => {
    initCountdown();
    initUnlock();
    syncSkipLink();
    syncNavGate();
    initNavAnchors();
    initThemeChrome();
    initRsvp();
    initHashScroll();
  });
})();
