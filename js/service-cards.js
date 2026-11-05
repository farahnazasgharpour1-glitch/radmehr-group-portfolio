/* Expandable premium service cards with graceful fallbacks. */
(() => {
  "use strict";

  const grid = document.querySelector(".service-grid--accordion");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".service-accordion"));
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (!reduceMotion) {
      const motion = gsap.matchMedia();
      motion.add(
        {
          desktop: "(min-width: 761px)",
          mobile: "(max-width: 760px)",
          reduceMotion: "(prefers-reduced-motion: reduce)"
        },
        (context) => {
          const { desktop, mobile, reduceMotion: prefersLessMotion } = context.conditions;
          if (prefersLessMotion) return;

          cards.forEach((card, index) => {
            gsap.fromTo(
              card,
              { autoAlpha: 0, y: mobile ? 16 : 26 },
              {
                autoAlpha: 1,
                y: 0,
                duration: desktop ? 0.68 : 0.48,
                delay: (index % (desktop ? 3 : 2)) * 0.055,
                ease: "power3.out",
                clearProps: "transform,opacity,visibility",
                scrollTrigger: {
                  trigger: card,
                  start: "top 88%",
                  once: true
                }
              }
            );
          });
        }
      );
    }
  }

  function setExpandedState(card, expanded) {
    const summary = card.querySelector(".service-accordion__summary");
    if (summary) summary.setAttribute("aria-expanded", String(expanded));
  }

  function openCard(card) {
    const panel = card.querySelector(".service-accordion__panel");
    card.open = true;
    setExpandedState(card, true);
    if (!panel || !gsap || reduceMotion) return;

    card.dataset.animating = "true";
    gsap.killTweensOf(panel);
    gsap.fromTo(
      panel,
      { height: 0, autoAlpha: 0, y: -9 },
      {
        height: "auto",
        autoAlpha: 1,
        y: 0,
        duration: 0.48,
        ease: "power3.out",
        onComplete: () => {
          gsap.set(panel, { clearProps: "height,opacity,visibility,transform" });
          delete card.dataset.animating;
          if (ScrollTrigger) ScrollTrigger.refresh();
        }
      }
    );
  }

  function closeCard(card) {
    const panel = card.querySelector(".service-accordion__panel");
    if (!card.open) return;
    if (!panel || !gsap || reduceMotion) {
      card.open = false;
      setExpandedState(card, false);
      return;
    }

    card.dataset.animating = "true";
    gsap.killTweensOf(panel);
    gsap.to(panel, {
      height: 0,
      autoAlpha: 0,
      y: -7,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        card.open = false;
        setExpandedState(card, false);
        delete card.dataset.animating;
        if (ScrollTrigger) ScrollTrigger.refresh();
      }
    });
  }

  cards.forEach((card) => {
    const summary = card.querySelector(".service-accordion__summary");
    if (!summary) return;
    setExpandedState(card, card.open);

    // Keep native <details> behavior as the fallback when this script is unavailable.
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (card.dataset.animating === "true") return;

      if (card.open) {
        closeCard(card);
        return;
      }

      cards.forEach((otherCard) => {
        if (otherCard !== card && otherCard.open) {
          closeCard(otherCard);
        }
      });
      openCard(card);
    });

    summary.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && card.open) {
        event.preventDefault();
        closeCard(card);
        summary.focus();
      }
    });
  });
})();
