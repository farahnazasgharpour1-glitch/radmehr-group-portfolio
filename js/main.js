document.documentElement.classList.add("js-ready");

// Register this handler before initializing Lenis or other optional libraries.
// Capture phase + stopImmediatePropagation keep smooth-scroll plugins from
// intercepting the footer link before the native scroll fallback can run.
document.addEventListener("click", function (event) {
  var clickedElement = event.target;

  if (clickedElement && clickedElement.nodeType !== 1) {
    clickedElement = clickedElement.parentElement;
  }

  if (!clickedElement || typeof clickedElement.closest !== "function") return;

  var backToTopLink = clickedElement.closest(
    '.site-footer__bottom a[data-scroll-top]'
  );

  if (!backToTopLink) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  window.scrollTo(0, 0);
}, true);

/* =========================================
   RADMEHR GROUP — MAIN JAVASCRIPT
   Theme, project card, Lenis + GSAP
========================================= */

// -----------------------------------------
// 1. Theme: light / dark
// -----------------------------------------

const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-toggle-label");
const themeIcon = document.querySelector(".theme-toggle__icon");
const themeQuery = window.matchMedia("(prefers-color-scheme: light)");
const storageKey = "radmehr-theme";

let savedTheme = null;

try {
  savedTheme = localStorage.getItem(storageKey);
} catch (error) {
  // Storage may be unavailable; theme switching still works for this visit.
}

let userHasChosenTheme = savedTheme === "light" || savedTheme === "dark";

const initialTheme = userHasChosenTheme
  ? savedTheme
  : themeQuery.matches
    ? "light"
    : "dark";

function applyTheme(theme) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  const isLight = normalizedTheme === "light";

  document.documentElement.dataset.theme = normalizedTheme;

  const brandLogo = document.querySelector(".brand img[data-light-src][data-dark-src]");
  if (brandLogo) {
    brandLogo.src = isLight ? brandLogo.dataset.lightSrc : brandLogo.dataset.darkSrc;
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", isLight ? "#F7F4ED" : "#111310");
  }

  if (themeIcon) {
    themeIcon.textContent = isLight ? "☾" : "☼";
  }

  if (themeLabel) {
    themeLabel.textContent = isLight ? "حالت تیره" : "حالت روشن";
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "تغییر به حالت تیره" : "تغییر به حالت روشن"
    );
  }
}

applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    userHasChosenTheme = true;

    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      // A failed save must not break the theme toggle.
    }
  });
}

function handleSystemThemeChange(event) {
  if (!userHasChosenTheme) {
    applyTheme(event.matches ? "light" : "dark");
  }
}

if (typeof themeQuery.addEventListener === "function") {
  themeQuery.addEventListener("change", handleSystemThemeChange);
} else if (typeof themeQuery.addListener === "function") {
  // Compatibility fallback for older Safari versions.
  themeQuery.addListener(handleSystemThemeChange);
}

// Keep the copyright year current without requiring a backend.
const footerYear = document.getElementById("footer-year");
if (footerYear) footerYear.textContent = String(new Date().getFullYear());

// -----------------------------------------
// 2. Expandable project cards
// Only one project can be expanded at a time.
// -----------------------------------------

const projectCards = document.querySelectorAll(".project-card");

function setProjectCardState(projectCard, isOpen) {
  const toggleButton = projectCard.querySelector(".project-card__toggle");
  const toggleLabel = projectCard.querySelector(".project-card__toggle-label");
  const toggleIcon = projectCard.querySelector(".project-card__toggle-icon");
  const content = projectCard.querySelector(".project-card__content");

  if (!toggleButton || !toggleLabel || !toggleIcon || !content) return;

  projectCard.classList.toggle("is-open", isOpen);
  const projectGrid = projectCard.closest(".projects-grid");
  if (projectGrid) {
    projectGrid.classList.toggle("has-open-card", isOpen);
    projectGrid.querySelectorAll(".project-card").forEach((card) => {
      const isCurrentCard = card === projectCard;
      card.classList.toggle("is-collapsed", isOpen && !isCurrentCard);
      if (!isCurrentCard) {
        const otherContent = card.querySelector(".project-card__content");
        if (otherContent) otherContent.setAttribute("aria-hidden", "true");
      }
    });
  }
  toggleButton.setAttribute("aria-expanded", String(isOpen));
  toggleLabel.textContent = isOpen ? "بستن جزئیات" : "جزئیات بیشتر";
  toggleIcon.textContent = isOpen ? "↙" : "↗";
  content.setAttribute("aria-hidden", String(!isOpen));
}

projectCards.forEach((projectCard) => {
  const toggleButton = projectCard.querySelector(".project-card__toggle");

  if (!toggleButton || !projectCard.querySelector(".project-card__content")) return;

  toggleButton.addEventListener("click", () => {
    const shouldOpen = !projectCard.classList.contains("is-open");

    if (shouldOpen) {
      projectCards.forEach((otherCard) => {
        if (otherCard !== projectCard) setProjectCardState(otherCard, false);
      });
    }

    setProjectCardState(projectCard, shouldOpen);
  });

  // Escape closes the current details panel and returns focus to its button.
  projectCard.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !projectCard.classList.contains("is-open")) return;

    setProjectCardState(projectCard, false);
    toggleButton.focus();
  });
});

// -----------------------------------------
// 3. Register GSAP plugins once
// -----------------------------------------

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const hasScrollTrigger = Boolean(gsap && ScrollTrigger);

if (hasScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

// -----------------------------------------
// 4. Lenis + GSAP ticker integration
// -----------------------------------------

let lenisInstance = null;

if (typeof window.Lenis === "function") {
  const lenisOptions = {
    anchors: true,
    lerp: 0.08,
    respectReducedMotion: true
  };

  if (hasScrollTrigger) {
    // GSAP's ticker is the single animation loop when both libraries exist.
    lenisInstance = new window.Lenis(lenisOptions);

    lenisInstance.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenisInstance.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  } else {
    // Native page scrolling remains available if GSAP or ScrollTrigger fails.
    lenisInstance = new window.Lenis({
      ...lenisOptions,
      autoRaf: true
    });
  }
}


// -----------------------------------------
// 5. Featured project — pinned cinematic scroll
// -----------------------------------------

if (hasScrollTrigger) {
  const section = document.querySelector(".featured-project");
  const visual = section?.querySelector(".featured-project__visual");
  const image = visual?.querySelector("img");
  const intro = section?.querySelector(".featured-project__intro");
  const caption = visual?.querySelector(".featured-project__caption");

  if (section && visual && image && intro && caption) {
    const motionModes = gsap.matchMedia();

    motionModes.add(
      {
        desktop: "(min-width: 761px)",
        mobile: "(max-width: 760px)",
        reduceMotion: "(prefers-reduced-motion: reduce)"
      },
      (context) => {
        const { desktop, mobile, reduceMotion } = context.conditions;

        // Lenis respects reduced motion; custom GSAP effects must too.
        if (reduceMotion) return;

        if (desktop) {
          const getVisualGeometry = () => {
            const sectionRect = section.getBoundingClientRect();
            const visualRect = visual.getBoundingClientRect();

            return {
              x: window.innerWidth / 2 - (
                visualRect.left - sectionRect.left + visualRect.width / 2
              ),
              y: window.innerHeight / 2 - (
                visualRect.top - sectionRect.top + visualRect.height / 2
              ),
              scale: Math.max(
                window.innerWidth / visual.offsetWidth,
                window.innerHeight / visual.offsetHeight
              ) * 1.05
            };
          };

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${Math.round(window.innerHeight * 1.65)}`,
              pin: true,
              pinSpacing: true,
              scrub: 0.7,
              anticipatePin: 1,
              invalidateOnRefresh: true
            }
          });

          timeline.to(intro, {
            autoAlpha: 0,
            y: -28,
            duration: 0.22,
            ease: "none"
          }, 0);

          timeline.to(visual, {
            x: () => getVisualGeometry().x,
            y: () => getVisualGeometry().y,
            scale: () => getVisualGeometry().scale,
            borderRadius: 0,
            borderColor: "rgba(0, 0, 0, 0)",
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
            duration: 0.78,
            ease: "none"
          }, 0);

          timeline.to(caption, {
            autoAlpha: 0,
            duration: 0.12,
            ease: "none"
          }, 0);

          timeline.to(image, {
            xPercent: -16.6667,
            duration: 0.45,
            ease: "none"
          }, 0.48);
        }

        if (mobile) {
          const mobileTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: visual,
              start: "top 92%",
              end: "bottom 30%",
              scrub: 0.45,
              invalidateOnRefresh: true
            }
          });

          mobileTimeline.fromTo(visual, {
            y: 28,
            scale: 0.97,
            autoAlpha: 0.88
          }, {
            y: 0,
            scale: 1,
            autoAlpha: 1,
            ease: "none"
          }, 0);

          mobileTimeline.fromTo(image, {
            xPercent: 4,
            scale: 1.14
          }, {
            xPercent: -4,
            scale: 1.04,
            ease: "none"
          }, 0);

          mobileTimeline.fromTo(caption, {
            y: 10,
            autoAlpha: 0.7
          }, {
            y: 0,
            autoAlpha: 1,
            ease: "none"
          }, 0.2);

          gsap.fromTo(intro, {
            y: 12,
            autoAlpha: 0.9
          }, {
            y: 0,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: intro,
              start: "top 88%",
              end: "top 65%",
              scrub: 0.25
            }
          });
        }
      }
    );

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  }
}

// ==========================================
// PROJECT SHOWCASE — AUTO MARQUEE
// حرکت پیوسته، توقف روی موس و پیمایش دستی
// ==========================================

(() => {
  const gsap = window.gsap;
  const section = document.querySelector(".project-showcase");

  if (!gsap || !section) return;

  const viewport = section.querySelector(
    ".project-showcase__viewport"
  );

  const track = section.querySelector(
    ".project-showcase__track"
  );

  const pauseButton = section.querySelector(
    "#project-showcase-motion-toggle"
  );

  if (!viewport || !track) return;

  // پنل‌های اصلی؛ کپی‌های نمایشی شمرده نمی‌شوند.
  const originalPanels = Array.from(track.children).filter(
    (panel) => !panel.hasAttribute("data-marquee-clone")
  );

  if (originalPanels.length < 2) return;

  const galleryMotion = gsap.matchMedia();

  galleryMotion.add(
    {
      desktop: "(min-width: 761px)",
      reduceMotion: "(prefers-reduced-motion: reduce)"
    },
    (context) => {
      const { desktop, reduceMotion } = context.conditions;

      // موبایل و حالت کاهش حرکت:
      // حرکت خودکار اجرا نمی‌شود.
      if (!desktop || reduceMotion) return;

      let clones = [];
      let animation = null;
      let observer = null;
      let cycleDistance = 0;
      let resizeFrame = 0;

      let isVisible = false;
      let isHovered = viewport.matches(":hover");
      let isFocused = viewport.contains(document.activeElement);
      let isDragging = false;
      let userPaused = false;

      const hadLenisPrevent =
        viewport.hasAttribute("data-lenis-prevent");

      viewport.setAttribute("data-lenis-prevent", "");

      const updatePlayback = () => {
        if (!animation) return;

        const shouldPlay =
          isVisible &&
          !isHovered &&
          !isFocused &&
          !isDragging &&
          !userPaused &&
          document.visibilityState === "visible";

        if (shouldPlay) {
          animation.play();
        } else {
          animation.pause();
        }
      };

      const clearClones = () => {
        clones.forEach((clone) => clone.remove());
        clones = [];
      };

      const createClone = (panel) => {
        const clone = panel.cloneNode(true);

        // کپی‌ها فقط برای نمایش هستند و نباید
        // دوباره توسط صفحه‌خوان خوانده شوند.
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("inert", "");
        clone.setAttribute("data-marquee-clone", "");
        clone.inert = true;

        // کپی‌های بصری نباید متن جایگزین تصاویر اصلی را تکرار کنند.
        clone.querySelectorAll("img").forEach((image) => {
          image.setAttribute("alt", "");
        });

        // جلوگیری از تکرار احتمالی شناسه‌های HTML
        clone.querySelectorAll("[id]").forEach((element) => {
          element.removeAttribute("id");
        });

        return clone;
      };

      const buildAnimation = () => {
        if (animation) {
          animation.kill();
          animation = null;
        }

        clearClones();
        section.classList.remove("is-enhanced");
        section.classList.remove("is-dragging");

        // هنگام تغییر اندازه، اندازه‌گیری از موقعیت اولیه انجام شود.
        gsap.set(track, { x: 0 });

        const styles = window.getComputedStyle(track);
        const gap =
          parseFloat(styles.columnGap) ||
          parseFloat(styles.gap) ||
          0;

        const panelsWidth = originalPanels.reduce(
          (total, panel) =>
            total + panel.getBoundingClientRect().width,
          0
        );

        // فاصله یک دور کامل، همراه با فاصله اتصال دو مجموعه
        cycleDistance = panelsWidth + gap * originalPanels.length;

        if (cycleDistance <= viewport.clientWidth + 1) {
          if (pauseButton) pauseButton.hidden = true;
          return;
        }

        // یک مجموعه کپی می‌سازیم تا پایان و آغاز حرکت
        // بدون پرش به هم متصل شوند.
        clones = originalPanels.map(createClone);
        clones.forEach((clone) => track.appendChild(clone));

        section.classList.add("is-enhanced");

        if (pauseButton) pauseButton.hidden = false;

        // سرعت ثابت برحسب پیکسل در ثانیه؛ عدد کمتر یعنی حرکت کندتر.
        const speed = 40;

        animation = gsap.to(track, {
          x: -cycleDistance,
          duration: cycleDistance / speed,
          ease: "none",
          repeat: -1,
          paused: true
        });

        updatePlayback();
      };

      // توقف هنگام ورود موس
      const onPointerEnter = () => {
        isHovered = true;
        updatePlayback();
      };

      // ادامه هنگام خروج موس؛ مگر کاربر توقف دائمی را انتخاب کرده باشد.
      const onPointerLeave = () => {
        if (!isDragging) {
          isHovered = false;
          updatePlayback();
        }
      };

      // کنترل دستی با چرخ موس یا ترک‌پد
      const onWheel = (event) => {
        if (!animation || isDragging) return;

        let delta =
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;

        if (event.deltaMode === 1) {
          delta *= 16;
        } else if (event.deltaMode === 2) {
          delta *= viewport.clientWidth;
        }

        if (!delta) return;

        event.preventDefault();
        animation.pause();

        const nextProgress = gsap.utils.wrap(
          0,
          1,
          animation.progress() + delta / cycleDistance
        );

        animation.progress(nextProgress);
      };

      // کنترل دستی با کشیدن کارت‌ها
      let dragStartX = 0;
      let dragStartProgress = 0;

      const onPointerDown = (event) => {
        if (!animation) return;

        // کلیک روی لینک‌ها باید همچنان طبیعی کار کند.
        if (event.target.closest("a, button")) return;

        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        isDragging = true;
        isHovered = true;

        dragStartX = event.clientX;
        dragStartProgress = animation.progress();

        animation.pause();
        section.classList.add("is-dragging");

        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
      };

      const onPointerMove = (event) => {
        if (!isDragging || !animation) return;

        const distance = event.clientX - dragStartX;

        const nextProgress = gsap.utils.wrap(
          0,
          1,
          dragStartProgress - distance / cycleDistance
        );

        animation.progress(nextProgress);
      };

      const stopDragging = (event) => {
        if (!isDragging) return;

        isDragging = false;
        section.classList.remove("is-dragging");

        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }

        isHovered = viewport.matches(":hover");
        updatePlayback();
      };

      // پیمایش با صفحه‌کلید
      const onKeyDown = (event) => {
        if (!animation) return;

        let nextProgress;

        if (event.key === "ArrowLeft") {
          nextProgress = animation.progress() + 0.04;
        } else if (event.key === "ArrowRight") {
          nextProgress = animation.progress() - 0.04;
        } else if (event.key === "Home") {
          nextProgress = 0;
        } else if (event.key === "End") {
          nextProgress = 0.999;
        } else {
          return;
        }

        event.preventDefault();
        animation.pause();

        animation.progress(
          gsap.utils.wrap(0, 1, nextProgress)
        );
      };

      // توقف خودکار هنگام ورود فوکوس صفحه‌کلید
      const onFocusIn = () => {
        isFocused = true;
        updatePlayback();
      };

      const onFocusOut = (event) => {
        isFocused = viewport.contains(event.relatedTarget);
        updatePlayback();
      };

      // دکمه توقف و ادامه حرکت
      const onMotionToggle = () => {
        userPaused = !userPaused;

        pauseButton.setAttribute(
          "aria-pressed",
          String(userPaused)
        );

        pauseButton.textContent = userPaused
          ? "ادامه حرکت گالری"
          : "توقف حرکت گالری";

        updatePlayback();
      };

      // حرکت فقط وقتی بخش نزدیک محدوده دید است اجرا می‌شود.
      const onVisibilityChange = () => updatePlayback();

      buildAnimation();

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            isVisible = entries.some(
              (entry) => entry.isIntersecting
            );

            updatePlayback();
          },
          { threshold: 0.01 }
        );

        observer.observe(section);
      } else {
        isVisible = true;
        updatePlayback();
      }

      viewport.addEventListener("pointerenter", onPointerEnter);
      viewport.addEventListener("pointerleave", onPointerLeave);

      viewport.addEventListener("wheel", onWheel, {
        passive: false
      });

      viewport.addEventListener("pointerdown", onPointerDown);
      viewport.addEventListener("pointermove", onPointerMove);
      viewport.addEventListener("pointerup", stopDragging);
      viewport.addEventListener("pointercancel", stopDragging);

      viewport.addEventListener("keydown", onKeyDown);
      viewport.addEventListener("focusin", onFocusIn);
      viewport.addEventListener("focusout", onFocusOut);

      if (pauseButton) {
        pauseButton.hidden = !animation;
        pauseButton.setAttribute("aria-pressed", "false");
        pauseButton.addEventListener("click", onMotionToggle);
      }

      document.addEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      // اگر عرض پنجره تغییر کند، ابعاد دور کامل دوباره محاسبه شود.
      const onResize = () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(buildAnimation);
      };

      window.addEventListener("resize", onResize, {
        passive: true
      });

      // پاک‌سازی هنگام تغییر breakpoint یا فعال‌شدن کاهش حرکت
      return () => {
        if (observer) observer.disconnect();

        window.cancelAnimationFrame(resizeFrame);
        window.removeEventListener("resize", onResize);
        document.removeEventListener(
          "visibilitychange",
          onVisibilityChange
        );

        viewport.removeEventListener("pointerenter", onPointerEnter);
        viewport.removeEventListener("pointerleave", onPointerLeave);
        viewport.removeEventListener("wheel", onWheel);
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointermove", onPointerMove);
        viewport.removeEventListener("pointerup", stopDragging);
        viewport.removeEventListener("pointercancel", stopDragging);
        viewport.removeEventListener("keydown", onKeyDown);
        viewport.removeEventListener("focusin", onFocusIn);
        viewport.removeEventListener("focusout", onFocusOut);

        if (pauseButton) {
          pauseButton.removeEventListener("click", onMotionToggle);
          pauseButton.hidden = false;
          pauseButton.setAttribute("aria-pressed", "false");
          pauseButton.textContent = "توقف حرکت گالری";
        }

        if (animation) animation.kill();

        clearClones();

        section.classList.remove("is-enhanced");
        section.classList.remove("is-dragging");

        if (!hadLenisPrevent) {
          viewport.removeAttribute("data-lenis-prevent");
        }

        gsap.set(track, { clearProps: "transform" });
      };
    }
  );
})();
// =========================================
// منوی همبرگری رادمهر گروپ
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("#nav-toggle");
  const mainNav = document.querySelector("#main-nav");

  // اگر عناصر منو در صفحه وجود نداشتند، متوقف شو.
  if (!navToggle || !mainNav) return;

  function setMenuOpen(isOpen) {
    mainNav.classList.toggle("is-open", isOpen);
    navToggle.classList.toggle("is-open", isOpen);

    navToggle.setAttribute("aria-expanded", String(isOpen));

    navToggle.setAttribute(
      "aria-label",
      isOpen ? "بستن منو" : "باز کردن منو"
    );
  }

  // باز و بسته شدن با کلیک روی همبرگری
  navToggle.addEventListener("click", () => {
    const isOpen =
      navToggle.getAttribute("aria-expanded") === "true";

    setMenuOpen(!isOpen);
  });

  // بستن منو بعد از انتخاب یک لینک
  mainNav.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a")
    ) {
      setMenuOpen(false);
    }
  });

  // بستن منو با کلیک بیرون از آن
  document.addEventListener("click", (event) => {
    if (
      !navToggle.contains(event.target) &&
      !mainNav.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });

  // بستن منو با کلید Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  // هنگام بازگشت به دسکتاپ، منو بسته شود.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setMenuOpen(false);
    }
  });
});