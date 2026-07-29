# Vendored runtime libs for designs/ (no CDN)

| Package | Path | Notes |
|---------|------|-------|
| GSAP 3.15 | `gsap/gsap.min.js` | Core |
| ScrollTrigger | `gsap/ScrollTrigger.min.js` | Scroll-driven timelines |
| SplitText | `gsap/SplitText.min.js` | Char/word splits (free) |
| ScrollSmoother | `gsap/ScrollSmoother.min.js` | Vendored; Midnight Elegant uses Lenis instead |
| Lenis | `lenis/lenis.min.js` + `lenis.css` | Smooth scroll |
| Three.js | `three/three.module.min.js` + `three.core.min.js` | ES module pair — use import map; module imports `./three.core.min.js` |

Refresh by copying from `node_modules` after `npm install`.
