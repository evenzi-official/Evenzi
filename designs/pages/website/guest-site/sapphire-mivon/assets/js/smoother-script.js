
$(function () {

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  ScrollTrigger.normalizeScroll(false);

  if (window.matchMedia("(min-width: 992px)").matches) {
    ScrollSmoother.create({
      smooth: 2,
      effects: true,
    });
  }

});