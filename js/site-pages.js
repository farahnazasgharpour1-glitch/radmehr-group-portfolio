/* Small shared enhancements for inner pages. No framework dependency. */
(() => {
  "use strict";
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (
      href === currentFile ||
      (currentFile === "index.html" && href === "#home") ||
      (currentFile.startsWith("project-") && href === "projects.html")
    ) {
      link.setAttribute("aria-current", "page");
    }
  });

  // Keep same-page anchor navigation clear for keyboard and screen-reader users.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      let targetId = link.hash.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch (_) {
        return;
      }
      const target = document.getElementById(targetId);
      if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    });
  });
})();
