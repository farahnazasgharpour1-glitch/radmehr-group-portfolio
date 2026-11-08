"use strict";

(() => {
  const grid = document.querySelector(".service-grid--accordion");
  if (!grid) return;

  const serviceIds = new Set([
    "architecture", "interior", "facade", "construction",
    "renovation", "management", "landscape"
  ]);
  const cards = Array.from(grid.querySelectorAll(".service-accordion"));

  function updateSummary(card) {
    const summary = card.querySelector(".service-accordion__summary");
    if (summary) summary.setAttribute("aria-expanded", String(card.open));
  }

  cards.forEach((card) => {
    card.addEventListener("toggle", () => {
      updateSummary(card);
      if (card.open) {
        cards.forEach((other) => {
          if (other !== card && other.open) other.open = false;
        });
      }
    });
    updateSummary(card);
  });

  function scrollTo(target) {
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => target.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth"
    }));
  }

  function syncServiceHash() {
    let hash;
    try {
      hash = decodeURIComponent(window.location.hash.slice(1));
    } catch (_) {
      return;
    }
    if (!hash) return;

    // Links to the detailed copy should always land on that copy.
    if (hash.startsWith("service-details-")) {
      scrollTo(document.getElementById(hash));
      return;
    }

    // Legacy service hashes open the relevant accordion and bring it into view.
    if (!serviceIds.has(hash)) return;
    const targetCard = document.getElementById(`service-card-${hash}`);
    if (!targetCard || !grid.contains(targetCard)) return;

    cards.forEach((card) => {
      card.open = card === targetCard;
      updateSummary(card);
    });
    scrollTo(targetCard);
  }

  if (window.location.hash) syncServiceHash();
  window.addEventListener("hashchange", syncServiceHash);
})();
