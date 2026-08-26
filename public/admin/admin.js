(function () {
  "use strict";

  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const loginError = document.getElementById("loginError");

  function isoStartOfDay(dateStr) {
    return dateStr ? `${dateStr}T00:00:00.000Z` : null;
  }
  function isoEndOfDay(dateStr) {
    return dateStr ? `${dateStr}T23:59:59.999Z` : null;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short" });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (res.status === 401) {
      showLogin();
      throw new Error("Nicht angemeldet.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Unbekannter Fehler.");
    }
    return data;
  }

  function showLogin() {
    loginCard.style.display = "block";
    dashboard.style.display = "none";
  }

  function showDashboard() {
    loginCard.style.display = "none";
    dashboard.style.display = "block";
    loadActiveTab();
  }

  // --- Login ---

  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("passwordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  async function login() {
    loginError.style.display = "none";
    const password = document.getElementById("passwordInput").value;
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      document.getElementById("passwordInput").value = "";
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = "block";
    }
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    showLogin();
  });

  // --- Tabs ---

  let activeTab = "overview";
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === activeTab));
      document.getElementById("filterEmpfehlungWrap").style.display = activeTab === "responses" ? "block" : "none";
      document.getElementById("filterContactedWrap").style.display = activeTab === "referrals" ? "block" : "none";
      loadActiveTab();
    });
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", loadActiveTab);
  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    document.getElementById("filterEmpfehlung").value = "";
    document.getElementById("filterContacted").value = "";
    loadActiveTab();
  });

  function currentFilters() {
    return {
      from: isoStartOfDay(document.getElementById("filterFrom").value),
      to: isoEndOfDay(document.getElementById("filterTo").value),
      empfehlung: document.getElementById("filterEmpfehlung").value,
      contacted: document.getElementById("filterContacted").value,
    };
  }

  function loadActiveTab() {
    if (activeTab === "overview") return loadOverview();
    if (activeTab === "responses") return loadResponses();
    if (activeTab === "referrals") return loadReferrals();
  }

  // --- Übersicht ---

  async function loadOverview() {
    const { from, to } = currentFilters();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const data = await api(`/api/admin/summary?${params.toString()}`).catch(() => null);
    if (!data) return;

    document.getElementById("statTotal").textContent = data.total;
    document.getElementById("statAvgQ1").textContent = data.avg_q1 ?? "–";
    document.getElementById("statAvgQ2").textContent = data.avg_q2 ?? "–";
    document.getElementById("statEmpfehlungJa").textContent = data.empfehlungen_ja;
    document.getElementById("statOffen").textContent = data.offene_weiterempfehlungen;

    const container = document.getElementById("verlaufContainer");
    if (!data.verlauf || data.verlauf.length === 0) {
      container.innerHTML = '<div class="empty-state">Noch keine Daten.</div>';
      return;
    }
    const max = Math.max(...data.verlauf.map((v) => v.anzahl));
    container.innerHTML = data.verlauf
      .map((v) => {
        const pct = max > 0 ? Math.round((v.anzahl / max) * 100) : 0;
        return `<div class="bar-row">
          <span class="bar-label">${escapeHtml(v.tag)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
          <span class="bar-count">${v.anzahl}</span>
        </div>`;
      })
      .join("");
  }

  // --- Antworten ---

  async function loadResponses() {
    const { from, to, empfehlung } = currentFilters();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (empfehlung) params.set("empfehlung", empfehlung);

    const data = await api(`/api/admin/responses?${params.toString()}`).catch(() => null);
    if (!data) return;

    const tbody = document.getElementById("responsesBody");
    const empty = document.getElementById("responsesEmpty");
    if (!data.responses || data.responses.length === 0) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    tbody.innerHTML = data.responses
      .map(
        (r) => `<tr>
          <td>${formatDate(r.created_at)}</td>
          <td>${r.q1_zufriedenheit}/5</td>
          <td>${r.q2_fachkompetenz}/5</td>
          <td>${escapeHtml(r.q3_kommentar)}</td>
          <td>${r.q4_empfehlung === "ja" ? "Ja" : "Nein"}</td>
        </tr>`
      )
      .join("");
  }

  // --- Weiterempfehlungen ---

  async function loadReferrals() {
    const { from, to, contacted } = currentFilters();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (contacted) params.set("contacted", contacted);

    const data = await api(`/api/admin/referrals?${params.toString()}`).catch(() => null);
    if (!data) return;

    const tbody = document.getElementById("referralsBody");
    const empty = document.getElementById("referralsEmpty");
    if (!data.referrals || data.referrals.length === 0) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    tbody.innerHTML = data.referrals
      .map((r) => {
        const statusClass = r.contacted ? "kontaktiert" : "nicht-kontaktiert";
        const statusLabel = r.contacted ? "Kontaktiert" : "Nicht kontaktiert";
        return `<tr>
          <td>${formatDate(r.created_at)}</td>
          <td>${escapeHtml(r.vorname)} ${escapeHtml(r.nachname)}</td>
          <td>${escapeHtml(r.handynummer)}</td>
          <td>${r.email ? escapeHtml(r.email) : "–"}</td>
          <td><button type="button" class="status-badge ${statusClass}" data-id="${r.id}" data-contacted="${r.contacted}">${statusLabel}</button></td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".status-badge").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const newContacted = btn.dataset.contacted !== "1";
        try {
          await api(`/api/admin/referrals/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ contacted: newContacted }),
          });
          loadReferrals();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  // --- Init ---

  api("/api/admin/session")
    .then(() => showDashboard())
    .catch(() => showLogin());
})();
