/* ════════════════════════════════════════════════════════════════════
   Evenzi · Auth flow script
   Shared by auth.html, verify-otp.html, role-select.html.
   Generic behaviors (radio-pill keyboard nav, pin-input auto-advance,
   toast helper) live in shell.js.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  var page = document.body.dataset.page || '';

  /* ── Shared helpers ─────────────────────────────── */
  function toast(msg) {
    if (window.evenzi && window.evenzi.showToast) {
      window.evenzi.showToast(msg);
    }
  }
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }
  }
  function showError(el, msg) {
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }
  function clearError(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  /* ════════════════════════════════════════════════════════════════════
     auth.html — Login / Sign Up
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'auth') {
    var titleEl = document.querySelector('[data-title]');
    var leadEl  = document.querySelector('[data-lead]');
    var phoneInput = document.getElementById('phone');
    var phoneErr   = document.getElementById('phone-err');
    var sendBtn    = document.querySelector('[data-send-otp]');
    var googleBtn  = document.querySelector('[data-google]');

    var COPY = {
      login:  { title: 'Log in to your Evenzi account',  lead: 'Welcome back. Enter your number to continue.' },
      signup: { title: 'Create your Evenzi account',     lead: 'Get started with your free event website and shared memories.' }
    };

    /* Tab toggle — Sign Up / Log In */
    function setMode(mode) {
      var tabs = document.querySelectorAll('.auth-tabs .nav-tab');
      tabs.forEach(function (t) {
        var active = t.getAttribute('data-auth-mode') === mode;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-checked', active ? 'true' : 'false');
      });
      if (titleEl) titleEl.textContent = COPY[mode].title;
      if (leadEl)  leadEl.textContent  = COPY[mode].lead;
    }
    document.addEventListener('click', function (e) {
      var tab = e.target.closest && e.target.closest('.auth-tabs .nav-tab[data-auth-mode]');
      if (!tab) return;
      setMode(tab.getAttribute('data-auth-mode'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var tab = e.target.closest && e.target.closest('.auth-tabs .nav-tab');
      if (!tab) return;
      e.preventDefault();
      var siblings = Array.prototype.slice.call(document.querySelectorAll('.auth-tabs .nav-tab'));
      var idx = siblings.indexOf(tab);
      var next = e.key === 'ArrowLeft'
        ? siblings[(idx - 1 + siblings.length) % siblings.length]
        : siblings[(idx + 1) % siblings.length];
      next.focus();
      setMode(next.getAttribute('data-auth-mode'));
    });

    /* +91 prefix click forwards focus to the field */
    document.addEventListener('click', function (e) {
      var prefix = e.target.closest && e.target.closest('[data-prefix-focus]');
      if (!prefix) return;
      var id = prefix.getAttribute('data-prefix-focus');
      var field = document.getElementById(id);
      if (field) field.focus();
    });

    /* Sync JS state to markup default on load — prevents desync if markup defaults change */
    var initialTab = document.querySelector('.auth-tabs .nav-tab.is-active');
    if (initialTab) setMode(initialTab.getAttribute('data-auth-mode'));

    /* Sanitize phone input to digits only as user types */
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var cleaned = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
        clearError(phoneErr);
      });
    }

    /* Send OTP — validate, simulate, navigate */
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        var v = (phoneInput && phoneInput.value || '').trim();
        if (!v) {
          showError(phoneErr, 'Enter your phone number');
          phoneInput.focus();
          return;
        }
        if (v.length !== 10) {
          showError(phoneErr, 'Phone number must be 10 digits');
          phoneInput.focus();
          return;
        }
        clearError(phoneErr);
        setLoading(sendBtn, true);
        try { sessionStorage.setItem('evz-phone', v); } catch (e) {}
        setTimeout(function () {
          setLoading(sendBtn, false);
          toast('OTP SENT');
          setTimeout(function () { window.location.href = 'verify-otp.html'; }, 350);
        }, 1100);
      });
    }

    /* Google — simulate, navigate to role-select */
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        setLoading(googleBtn, true);
        setTimeout(function () {
          setLoading(googleBtn, false);
          toast('OPENING GOOGLE');
          setTimeout(function () { window.location.href = 'role-select.html'; }, 350);
        }, 900);
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     verify-otp.html — 6-digit code entry
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'verify-otp') {
    var phoneEl  = document.querySelector('[data-verify-phone]');
    var verifyBtn = document.querySelector('[data-verify-otp]');
    var otpErr   = document.getElementById('otp-err');
    var cells    = document.querySelectorAll('.pin-input-cell');
    var resendBtn = document.querySelector('[data-resend]');
    var resendCountEl = document.querySelector('[data-resend-count]');
    var resendActiveEl = document.querySelector('[data-resend-active]');
    var resendCounterEl = document.querySelector('[data-resend-counter]');

    /* Display the phone number entered on the previous screen */
    try {
      var saved = sessionStorage.getItem('evz-phone');
      if (saved && phoneEl) phoneEl.textContent = '+91 ' + saved.slice(0,5) + ' ' + saved.slice(5);
    } catch (e) {}

    /* Resend countdown */
    var seconds = 30;
    function tick() {
      seconds--;
      if (resendCountEl) resendCountEl.textContent = String(seconds);
      if (seconds <= 0) {
        if (resendBtn) resendBtn.disabled = false;
        if (resendCounterEl) resendCounterEl.hidden = true;
        if (resendActiveEl) resendActiveEl.hidden = false;
        return;
      }
      setTimeout(tick, 1000);
    }
    function startResendCountdown() {
      seconds = 30;
      if (resendBtn) resendBtn.disabled = true;
      if (resendCountEl) resendCountEl.textContent = '30';
      if (resendCounterEl) resendCounterEl.hidden = false;
      if (resendActiveEl) resendActiveEl.hidden = true;
      setTimeout(tick, 1000);
    }
    if (resendBtn && resendCountEl) startResendCountdown();
    if (resendBtn) {
      resendBtn.addEventListener('click', function () {
        if (resendBtn.disabled) return;
        toast('OTP RESENT');
        startResendCountdown();
      });
    }

    /* Verify */
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function () {
        var code = Array.prototype.map.call(cells, function (c) { return c.value; }).join('');
        if (code.length !== 6) {
          showError(otpErr, 'Enter the 6-digit code');
          if (cells[code.length]) cells[code.length].focus();
          var pin = document.querySelector('.pin-input');
          if (pin) pin.setAttribute('aria-invalid', 'true');
          return;
        }
        clearError(otpErr);
        var pin2 = document.querySelector('.pin-input');
        if (pin2) pin2.removeAttribute('aria-invalid');
        setLoading(verifyBtn, true);
        setTimeout(function () {
          setLoading(verifyBtn, false);
          toast('VERIFIED');
          setTimeout(function () { window.location.href = 'role-select.html'; }, 350);
        }, 1100);
      });
    }

    /* Clear error as user types into pin */
    cells.forEach(function (c) {
      c.addEventListener('input', function () {
        if (otpErr && !otpErr.hidden) {
          clearError(otpErr);
          var pin3 = document.querySelector('.pin-input');
          if (pin3) pin3.removeAttribute('aria-invalid');
        }
      });
    });
  }

  /* ════════════════════════════════════════════════════════════════════
     role-select.html — Host / Vendor radio-pill + Continue
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'role-select') {
    var continueBtn = document.querySelector('[data-role-continue]');
    var selected = null;

    function setSelected(pill) {
      var pills = document.querySelectorAll('.role-grid .radio-pill');
      pills.forEach(function (p) {
        p.setAttribute('aria-checked', 'false');
        p.classList.remove('is-checked');
      });
      pill.setAttribute('aria-checked', 'true');
      pill.classList.add('is-checked');
      selected = pill.getAttribute('data-role');
      if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.removeAttribute('aria-disabled');
      }
    }
    document.addEventListener('click', function (e) {
      var pill = e.target.closest && e.target.closest('.role-grid .radio-pill');
      if (!pill) return;
      if (pill.getAttribute('aria-disabled') === 'true') {
        toast('VENDOR COMING SOON');
        return;
      }
      setSelected(pill);
    });

    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        if (continueBtn.disabled) return;
        if (!selected) return;
        setLoading(continueBtn, true);
        setTimeout(function () {
          setLoading(continueBtn, false);
          toast(selected === 'host' ? 'CONTINUE AS HOST' : 'CONTINUE AS VENDOR');
          setTimeout(function () {
            if (selected === 'host') window.location.href = '../../index.html';
          }, 600);
        }, 900);
      });
    }
  }
})();
