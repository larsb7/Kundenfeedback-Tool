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
    let ok = true;
    document.getElementById("vornameError").textContent = "";
    document.getElementById("nachnameError").textContent = "";
    document.getElementById("telefonnummerError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("themaError").textContent = "";
    document.getElementById("empfohlenDurchError").textContent = "";

    if (vornameInput.value.trim().length === 0) {
      document.getElementById("vornameError").textContent = "Pflichtfeld";
      ok = false;
    }
    if (nachnameInput.value.trim().length === 0) {
      document.getElementById("nachnameError").textContent = "Pflichtfeld";
      ok = false;
    }
    if (telefonnummerInput.value.trim().length === 0) {
      document.getElementById("telefonnummerError").textContent = "Pflichtfeld";
      ok = false;
    }
    if (emailInput.value.trim().length === 0) {
      document.getElementById("emailError").textContent = "Pflichtfeld";
      ok = false;
    }
    if (themaInput.value.trim().length === 0) {
      document.getElementById("themaError").textContent = "Pflichtfeld";
      ok = false;
    }
    if (empfohlenDurchInput.value.trim().length === 0) {
      document.getElementById("empfohlenDurchError").textContent = "Pflichtfeld";
      ok = false;
    }
    return ok;
  }

  const submitBtn = document.getElementById("submitBtn");
  consentInput.addEventListener("change", () => {
    submitBtn.disabled = !consentInput.checked;
  });

  submitBtn.addEventListener("click", async () => {
    hideFormError();
    if (!validateForm()) return;

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
