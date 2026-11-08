/* =========================================================
   RADMEHR GROUP — Contact page interactions
   - Accessible client-side validation
   - Persian/Arabic digit normalization for phone checking
   - Progressive enhancement: native validation without JavaScript
   - Persian custom validation and safe status messaging when JavaScript is active
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
    // Disable native browser bubbles only after this script is running; if JS fails, HTML validation remains available.
    form.noValidate = true;
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
      phoneField.value = phone;
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

      const controller = new AbortController();
      const requestTimeout = window.setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: payload,
          signal: controller.signal
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
        if (error.name === "AbortError") {
          status.textContent = "پاسخ سرویس بیش از حد طول کشید. لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید.";
        } else if (error.status === 429) {
          status.textContent = "درخواست‌های زیادی در فاصلهٔ کوتاه ارسال شده است. لطفاً کمی بعد دوباره تلاش کنید.";
        } else if (error instanceof TypeError) {
          status.textContent = "ارتباط با سرویس ارسال برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
        } else {
          status.textContent = "ارسال درخواست انجام نشد. لطفاً اطلاعات را بررسی کنید و کمی بعد دوباره تلاش کنید.";
        }
        status.classList.add("is-invalid");
        status.hidden = false;
      } finally {
        window.clearTimeout(requestTimeout);
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
})();
