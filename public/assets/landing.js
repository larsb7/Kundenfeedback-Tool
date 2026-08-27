(function () {
  "use strict";

  const screenHero = document.getElementById("screenHero");
  const screenForm = document.getElementById("screenForm");
  const screenDone = document.getElementById("screenDone");
  const formError = document.getElementById("formError");

  function showScreen(el) {
    [screenHero, screenForm, screenDone].forEach((s) => {
      s.style.display = s === el ? "block" : "none";
    });
  }

  document.getElementById("startBtn").addEventListener("click", () => {
    showScreen(screenForm);
  });

  function showFormError(message) {
    formError.textContent = message;
    formError.style.display = "block";
  }

  function hideFormError() {
    formError.style.display = "none";
  }

  const vornameInput = document.getElementById("vorname");
  const nachnameInput = document.getElementById("nachname");
  const telefonnummerInput = document.getElementById("telefonnummer");
  const emailInput = document.getElementById("email");
  const themaInput = document.getElementById("thema");
  const empfohlenDurchInput = document.getElementById("empfohlenDurch");
  const consentInput = document.getElementById("consent");

  function validateForm() {
    return (
      vornameInput.value.trim().length > 0 &&
      nachnameInput.value.trim().length > 0 &&
      telefonnummerInput.value.trim().length > 0 &&
      emailInput.value.trim().length > 0 &&
      themaInput.value.trim().length > 0 &&
      empfohlenDurchInput.value.trim().length > 0
    );
  }

  const submitBtn = document.getElementById("submitBtn");
  consentInput.addEventListener("change", () => {
    submitBtn.disabled = !consentInput.checked;
  });

  submitBtn.addEventListener("click", async () => {
    hideFormError();
    if (!validateForm()) {
      showFormError("Bitte füllen Sie alle Felder aus.");
      return;
    }

    const payload = {
      vorname: vornameInput.value.trim(),
      nachname: nachnameInput.value.trim(),
      telefonnummer: telefonnummerInput.value.trim(),
      email: emailInput.value.trim(),
      thema: themaInput.value.trim(),
      empfohlen_durch: empfohlenDurchInput.value.trim(),
      consent_kontakt: consentInput.checked,
    };

    submitBtn.disabled = true;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Beim Absenden ist ein Fehler aufgetreten.");
      }
      showScreen(screenDone);
    } catch (err) {
      showFormError(err.message || "Beim Absenden ist ein Fehler aufgetreten.");
    } finally {
      submitBtn.disabled = !consentInput.checked;
    }
  });
})();
