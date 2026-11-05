/* =========================================================
   RADMEHR GROUP — Contact page interactions
   - Accessible client-side validation
   - Persian/Arabic digit normalization for phone checking
   - Respect for prefers-reduced-motion
   - GSAP motion only enhances the page; content stays visible
     when the animation libraries are unavailable
========================================================= */
(() => {
  "use strict";

  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#contact-form-status");
  const nameField = document.querySelector("#full-name");
  const phoneField = document.querySelector("#phone");
  const emailField = document.querySelector("#email");
  const typeField = document.querySelector("#inquiry-type");
  const messageField = document.querySelector("#message");
  const messageCounter = document.querySelector("#message-counter");

  const numberFormat = new Intl.NumberFormat("fa-IR");

  function toLatinDigits(value) {
    return value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  }

  function errorNodeFor(field) {
    const describedBy = field.getAttribute("aria-describedby") || "";
    const errorId = describedBy
      .split(/\s+/)
      .find((id) => id.endsWith("-error"));

    return errorId ? document.getElementById(errorId) : null;
  }

  function setFieldError(field, message) {
    const errorNode = errorNodeFor(field);
    field.setAttribute("aria-invalid", message ? "true" : "false");

    if (errorNode) {
      errorNode.textContent = message;
    }
  }

  function hideStatus() {
    if (!status) return;
    status.hidden = true;
    status.textContent = "";
    status.classList.remove("is-invalid", "is-demo", "is-success");
  }

  function updateMessageCounter() {
    if (!messageField || !messageCounter) return;
    messageCounter.textContent = `${numberFormat.format(messageField.value.length)} / ${numberFormat.format(1500)}`;
  }

  if (messageField) {
    messageField.addEventListener("input", updateMessageCounter);
    updateMessageCounter();
  }

  if (form && status && nameField && phoneField && emailField && typeField && messageField) {
    const fields = [nameField, phoneField, emailField, typeField, messageField];

    fields.forEach((field) => {
      const clearOnEdit = () => {
        setFieldError(field, "");
        hideStatus();
      };

      field.addEventListener("input", clearOnEdit);
      field.addEventListener("change", clearOnEdit);
    });

    function validateForm() {
      let firstInvalidField = null;
      let hasErrors = false;

      fields.forEach((field) => setFieldError(field, ""));
      hideStatus();

      const name = nameField.value.trim();
      if (Array.from(name).length < 2) {
        setFieldError(nameField, "لطفاً نام و نام خانوادگی را وارد کنید.");
      }

      const phone = toLatinDigits(phoneField.value.trim());
      const phoneDigits = phone.replace(/\D/g, "");
      const phoneHasUnsupportedChars = /[^\d\s()+.\-]/.test(phone);
      if (phoneHasUnsupportedChars || phoneDigits.length < 8 || phoneDigits.length > 15) {
        setFieldError(phoneField, "شماره تماس باید شامل ۸ تا ۱۵ رقم باشد.");
      }

      emailField.value = emailField.value.trim();
      if (emailField.value && !emailField.validity.valid) {
        setFieldError(emailField, "لطفاً یک آدرس ایمیل معتبر وارد کنید.");
      }

      if (!typeField.value) {
        setFieldError(typeField, "لطفاً موضوع درخواست را انتخاب کنید.");
      }

      const message = messageField.value.trim();
      if (Array.from(message).length < 10) {
        setFieldError(messageField, "لطفاً حداقل ۱۰ نویسه درباره درخواستتان بنویسید.");
      }

      fields.forEach((field) => {
        if (field.getAttribute("aria-invalid") === "true") {
          hasErrors = true;
          if (!firstInvalidField) firstInvalidField = field;
        }
      });

      if (hasErrors) {
        status.textContent = "لطفاً موارد مشخص‌شده را بررسی و اصلاح کنید.";
        status.classList.add("is-invalid");
        status.hidden = false;
        firstInvalidField?.focus();
        return false;
      }

      return true;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const submitButtonLabel = submitButton?.querySelector("span:first-child");
    const originalSubmitLabel = submitButtonLabel?.textContent?.trim() || "ثبت درخواست";
    const accessKeyField = form.querySelector('input[name="access_key"]');
    const accessKeyPlaceholder = "PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Honeypot: automated bots may fill this visually hidden field.
      const honeypot = form.querySelector('[name="botcheck"]');
      if (honeypot && honeypot.checked) return;

      if (!validateForm()) return;

      const accessKey = accessKeyField?.value.trim();
      if (!accessKey || accessKey === accessKeyPlaceholder) {
        status.textContent = "اعتبارسنجی فرم انجام شد؛ برای ارسال واقعی، ابتدا Access Key سرویس Web3Forms را در فیلد مشخص‌شده در contact.html قرار دهید.";
        status.classList.add("is-demo");
        status.hidden = false;
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        if (submitButtonLabel) submitButtonLabel.textContent = "در حال ارسال...";
      }
      form.setAttribute("aria-busy", "true");
      hideStatus();

      const payload = new FormData(form);
      payload.set("subject", "درخواست جدید از سایت رادمهر گروپ");
      payload.set("from_name", "Radmehr Group | Contact Form");

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: payload
        });

        let result = {};
        try {
          result = await response.json();
        } catch {
          // A non-JSON response is handled as a generic submission failure below.
        }

        if (!response.ok || result.success !== true) {
          const error = new Error("submission-failed");
          error.status = response.status;
          throw error;
        }

        // Redirect only after Web3Forms explicitly confirms success.
        // thank-you.html is in the same /html/ folder as contact.html.
        window.location.assign("thank-you.html");
        return;
      } catch (error) {
        if (error.status === 429) {
          status.textContent = "درخواست‌های زیادی در فاصلهٔ کوتاه ارسال شده است. لطفاً کمی بعد دوباره تلاش کنید.";
        } else if (error instanceof TypeError) {
          status.textContent = "ارتباط با سرویس ارسال برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
        } else {
          status.textContent = "ارسال درخواست انجام نشد. لطفاً اطلاعات را بررسی کنید و کمی بعد دوباره تلاش کنید.";
        }
        status.classList.add("is-invalid");
        status.hidden = false;
      } finally {
        form.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          if (submitButtonLabel) submitButtonLabel.textContent = originalSubmitLabel;
        }
      }
    });

    // The button is enabled in HTML too, so native form submission remains possible
    // when JavaScript is disabled. JavaScript only enhances validation and status UI.
  }

  // Motion is optional: the page remains readable if a CDN is unavailable.
  const animationEngine = window.gsap;
  const scrollPlugin = window.ScrollTrigger;

  if (!animationEngine) return;

  if (scrollPlugin) {
    animationEngine.registerPlugin(scrollPlugin);
  }

  const motionMedia = animationEngine.matchMedia();
  motionMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const introItems = animationEngine.utils.toArray("[data-contact-intro]");
    const formPanel = document.querySelector(".contact-form-panel");
    const asidePanel = document.querySelector(".contact-page__aside");

    if (introItems.length) {
      animationEngine.from(introItems, {
        autoAlpha: 0,
        y: 18,
        duration: 0.72,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.08,
        clearProps: "all"
      });
    }

    const panels = [asidePanel, formPanel].filter(Boolean);
    if (panels.length) {
      animationEngine.from(panels, {
        autoAlpha: 0,
        y: 22,
        duration: 0.82,
        stagger: 0.13,
        delay: 0.24,
        ease: "power3.out",
        clearProps: "all"
      });
    }

    const glowOne = document.querySelector(".contact-backdrop__glow--one");
    const glowTwo = document.querySelector(".contact-backdrop__glow--two");

    if (glowOne) {
      animationEngine.to(glowOne, {
        x: 14,
        y: -10,
        opacity: 0.48,
        duration: 7.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    if (glowTwo) {
      animationEngine.to(glowTwo, {
        x: -12,
        y: 10,
        opacity: 0.68,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.6
      });
    }

    const backdropLine = document.querySelector(".contact-backdrop__line");
    const pageSection = document.querySelector(".contact-page");
    if (scrollPlugin && backdropLine && pageSection) {
      animationEngine.to(backdropLine, {
        opacity: 0.16,
        ease: "none",
        scrollTrigger: {
          trigger: pageSection,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8
        }
      });
    }
  });
})();
