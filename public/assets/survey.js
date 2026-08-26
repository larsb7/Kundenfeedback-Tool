(function () {
  "use strict";

  const state = {
    q1: null,
    q2: null,
    q3: "",
    q4: null,
    vorname: "",
    nachname: "",
    handynummer: "",
    email: "",
    consent: false,
  };

  let currentStep = "1";
  const progressFill = document.getElementById("progressFill");
  const formError = document.getElementById("formError");

  function totalSteps() {
    return state.q4 === "nein" ? 4 : 5;
  }

  function stepNumber(step) {
    if (step === "done") return totalSteps();
    return Number(step);
  }

  function updateProgress() {
    const pct = Math.min(100, Math.round((stepNumber(currentStep) / totalSteps()) * 100));
    progressFill.style.width = pct + "%";
  }

  function showStep(step) {
    document.querySelectorAll(".step").forEach((el) => {
      el.classList.toggle("active", el.dataset.step === step);
    });
    currentStep = step;
    updateProgress();
    hideFormError();
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.style.display = "block";
  }

  function hideFormError() {
    formError.style.display = "none";
  }

  function buildRatingGroup(container, field) {
    for (let i = 0; i <= 5; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rating-option";
      btn.textContent = String(i);
      btn.dataset.value = String(i);
      btn.addEventListener("click", () => {
        state[field] = i;
        container.querySelectorAll(".rating-option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        updateNextButton(container.closest(".step"));
      });
      container.appendChild(btn);
    }
  }

  buildRatingGroup(document.querySelector('[data-field="q1"]'), "q1");
  buildRatingGroup(document.querySelector('[data-field="q2"]'), "q2");

  function updateNextButton(stepEl) {
    const nextBtn = stepEl.querySelector("[data-next]");
    if (!nextBtn) return;
    const step = stepEl.dataset.step;
    let valid = false;
    if (step === "1") valid = state.q1 !== null;
    if (step === "2") valid = state.q2 !== null;
    if (step === "3") valid = state.q3.trim().length > 0;
    if (step === "4") valid = state.q4 !== null;
    nextBtn.disabled = !valid;
  }

  // Schritt 3: Freitext
  const q3Input = document.getElementById("q3");
  q3Input.addEventListener("input", () => {
    state.q3 = q3Input.value;
    document.getElementById("q3Error").textContent = "";
    updateNextButton(q3Input.closest(".step"));
  });

  // Schritt 4: Ja/Nein
  document.querySelectorAll("[data-q4]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.q4 = btn.dataset.q4;
      document.querySelectorAll("[data-q4]").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateNextButton(btn.closest(".step"));
    });
  });

  // Navigation: Weiter
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = btn.closest(".step").dataset.step;
      if (step === "1") return showStep("2");
      if (step === "2") return showStep("3");
      if (step === "3") {
        if (state.q3.trim().length === 0) {
          document.getElementById("q3Error").textContent = "Bitte einen Kommentar eingeben.";
          return;
        }
        return showStep("4");
      }
      if (step === "4") {
        if (state.q4 === "nein") return submitFeedback();
        return showStep("5");
      }
    });
  });

  // Navigation: Zurück
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = btn.closest(".step").dataset.step;
      if (step === "2") return showStep("1");
      if (step === "3") return showStep("2");
      if (step === "4") return showStep("3");
      if (step === "5") return showStep("4");
    });
  });

  // Schritt 5: Kontaktformular
  const vornameInput = document.getElementById("vorname");
  const nachnameInput = document.getElementById("nachname");
  const handynummerInput = document.getElementById("handynummer");
  const emailInput = document.getElementById("email");
  const consentInput = document.getElementById("consent");

  function validateStep5() {
    let ok = true;
    document.getElementById("vornameError").textContent = "";
    document.getElementById("nachnameError").textContent = "";
    document.getElementById("handynummerError").textContent = "";
    document.getElementById("consentError").textContent = "";

    if (vornameInput.value.trim().length === 0) {
      document.getElementById("vornameError").textContent = "Vorname ist ein Pflichtfeld.";
      ok = false;
    }
    if (nachnameInput.value.trim().length === 0) {
      document.getElementById("nachnameError").textContent = "Nachname ist ein Pflichtfeld.";
      ok = false;
    }
    if (handynummerInput.value.trim().length === 0) {
      document.getElementById("handynummerError").textContent = "Handynummer ist ein Pflichtfeld.";
      ok = false;
    }
    if (!consentInput.checked) {
      document.getElementById("consentError").textContent = "Bitte bestätigen Sie die Einwilligung.";
      ok = false;
    }
    return ok;
  }

  document.getElementById("submitBtn").addEventListener("click", () => {
    if (!validateStep5()) return;
    state.vorname = vornameInput.value.trim();
    state.nachname = nachnameInput.value.trim();
    state.handynummer = handynummerInput.value.trim();
    state.email = emailInput.value.trim();
    state.consent = consentInput.checked;
    submitFeedback();
  });

  async function submitFeedback() {
    hideFormError();
    const payload = {
      q1_zufriedenheit: state.q1,
      q2_fachkompetenz: state.q2,
      q3_kommentar: state.q3.trim(),
      q4_empfehlung: state.q4,
    };
    if (state.q4 === "ja") {
      payload.referral = {
        vorname: state.vorname,
        nachname: state.nachname,
        handynummer: state.handynummer,
        email: state.email || null,
        consent: state.consent,
      };
    }

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Beim Absenden ist ein Fehler aufgetreten.");
      }
      showStep("done");
    } catch (err) {
      showFormError(err.message || "Beim Absenden ist ein Fehler aufgetreten.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  updateProgress();
})();
