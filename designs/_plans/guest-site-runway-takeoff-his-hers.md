# Runway takeoff — HIS → HERS (sandbox A → mivon)

> **Status:** Plan locked for bake · 2026-07-22 evening  
> **Bake source:** `sapphire-sandbox.html#demo-a` (A Runway — taxi → climb + tangent nose)  
> **Live target:** `sapphire-mivon/` `#story` — between “How we took off.” copy and Route cards  
> **UI/UX plan:** [UI/UX agent](9d42a68c-061b-4166-bc30-7d63fa289cb3)  
> **Related:** [`guest-site-sapphire-floaters-kit.md`](guest-site-sapphire-floaters-kit.md) · [`guest-site-manifest-paper-plane-dodge.md`](guest-site-manifest-paper-plane-dodge.md) · [`guest-site-hero-glass-video.md`](guest-site-hero-glass-video.md)

---

## Founder locks

| # | Decision |
|---|----------|
| **R1** | Tied to **ROUTE HIS → HERS** (boarding journey metaphor) — not Manifest |
| **R2** | Scroll-driven |
| **R3** | Scrub **with reverse** (provisional — final after live feel) |
| **R4** | **Separate** from `#sp-mf-flight` (paper-plane dodge stays) |
| **R6** | Same smooth sandbox A motion (path sample + tangent nose + liftSoft) |
| **R7** | Same asset: `jet.png` |

---

## Agent call — R5 container

**Pinned scroll stage inside `#story`**, after the “How we took off.” intro body, **before** the “Route / His → Hers” section head + route cards.

```
#story
├── intro (“How we took off.” + body)
├── #sp-route-scroll          (~240–280vh)
│   └── .sp-route-sticky (100dvh pin)
│       └── .sp-route-scene   (sandbox A stage)
│           ├── guide SVG path
│           ├── runway + lights
│           └── #sp-route-jet (jet.png)
├── sec-head “Route / His → Hers”
└── route cards (MET · 1ST · FWD)
```

| Why |
|-----|
| Narrative: takeoff story → *watch the takeoff* → arrive at HIS→HERS gates |
| Hero stays ambient video + glass pass (no jet fight on boarding card) |
| Manifest `#sp-mf-flight` remains later (paper plane, different asset/timeline) |

**Reduced motion:** Match sandbox — no scrub; show static climb frame (~`t=0.7`); collapse track to ~100dvh.

---

## Motion port

Copy sandbox A defaults (`runwayY:79`, `p0x:8`, `p1x:42`, `p2x:100`, `p2y:28`, `taxiShare:63`, `liftSoft:92`, `levelRot`/`noseOffset`/`flipY` as baked). Wire to Lenis + ScrollTrigger like other mivon pins. Strip authoring sliders on live; keep sandbox controls for retune.

---

## Coexistence rules

| Feature | Asset | Zone |
|---------|-------|------|
| Hero countdown plane | Tiny SVG on progress fill | `.sp-ticket` |
| Runway takeoff | `jet.png` | `#sp-route-scroll` in `#story` |
| Manifest dodge | Paper-plane SVG | `#sp-mf-flight` `#schedule`→`#party` |

No shared timeline. No hero video under runway stage (page wash only).

---

## Acceptance

- [ ] Scroll taxi → climb → fly-off; scroll-up reverses
- [ ] Feel matches sandbox A smoothness
- [ ] Does not break / steal scroll from Manifest flight
- [ ] Reduced-motion: static climb, no scrub
- [ ] 360–1440: jet path readable; no H-scroll

---

## Open (founder after live)

- **R3** reverse scrub keep vs one-shot settle
- Scroll track height on short phones
- Exact static `t` for reduced-motion

---

## Built · 2026-07-22

- Ported sandbox A into mivon `#sp-route-scroll` inside `#story` (after “How we took off.”, before Route cards)
- Same jet.png + path sample / tangent / liftSoft defaults; ST `scrub: 0.85`
- Lives **behind Check In** with the rest of `#sp-private` (story content)
- Reduced-motion → static `t=0.7`
- Verified mobile: runway + jet at taxi 0% after unlock
