/* RADMEHR GROUP — small, optional confirmation-page motion */
(() => {
  "use strict";

  const gsap = window.gsap;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Content remains visible if GSAP is unavailable or motion is reduced.
  if (!gsap || reduceMotion) return;

  const items = gsap.utils.toArray("[data-thank-you-item]");
  const mark = document.querySelector("[data-thank-you-mark]");

  if (items.length) {
    gsap.from(items, {
      autoAlpha: 0,
      y: 14,
      duration: 0.65,
      stagger: 0.09,
      ease: "power2.out",
      clearProps: "all"
    });
  }

  if (mark) {
    gsap.from(mark, {
      scale: 0.82,
      autoAlpha: 0,
      duration: 0.72,
      delay: 0.12,
      ease: "back.out(1.5)",
      clearProps: "all"
    });

    const check = mark.querySelector(".thank-you-mark__check");
    if (check && typeof check.getTotalLength === "function") {
      const length = check.getTotalLength();
      gsap.set(check, {
        strokeDasharray: length,
        strokeDashoffset: length
      });
      gsap.to(check, {
        strokeDashoffset: 0,
        duration: 0.62,
        delay: 0.33,
        ease: "power2.out",
        clearProps: "strokeDasharray,strokeDashoffset"
      });
    }
  }

  const glowOne = document.querySelector(".contact-backdrop__glow--one");
  const glowTwo = document.querySelector(".contact-backdrop__glow--two");

  if (glowOne) {
    gsap.to(glowOne, {
      x: 10,
      y: -8,
      opacity: 0.48,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  if (glowTwo) {
    gsap.to(glowTwo, {
      x: -8,
      y: 8,
      opacity: 0.62,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });
  }
})();
