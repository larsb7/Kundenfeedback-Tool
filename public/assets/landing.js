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
    document.getElementById("themaError").textContent = "";
    document.getElementById("consentError").textContent = "";

    if (vornameInput.value.trim().length === 0) {
      document.getElementById("vornameError").textContent = "Vorname ist ein Pflichtfeld.";
      ok = false;
    }
    if (nachnameInput.value.trim().length === 0) {
      document.getElementById("nachnameError").textContent = "Nachname ist ein Pflichtfeld.";
      ok = false;
    }
    if (telefonnummerInput.value.trim().length === 0) {
      document.getElementById("telefonnummerError").textContent = "Telefonnummer ist ein Pflichtfeld.";
      ok = false;
    }
    if (themaInput.value.trim().length === 0) {
      document.getElementById("themaError").textContent = "Bitte geben Sie an, zu welchem Thema Sie beraten werden möchten.";
      ok = false;
    }
    if (!consentInput.checked) {
      document.getElementById("consentError").textContent = "Bitte bestätigen Sie die Einwilligung.";
      ok = false;
    }
    return ok;
  }

  document.getElementById("submitBtn").addEventListener("click", async () => {
    hideFormError();
    if (!validateForm()) return;

    const payload = {
      vorname: vornameInput.value.trim(),
      nachname: nachnameInput.value.trim(),
      telefonnummer: telefonnummerInput.value.trim(),
      email: emailInput.value.trim() || null,
      thema: themaInput.value.trim(),
      empfohlen_durch: empfohlenDurchInput.value.trim() || null,
      consent_kontakt: consentInput.checked,
    };

    const submitBtn = document.getElementById("submitBtn");
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
      submitBtn.disabled = false;
    }
  });
})();
