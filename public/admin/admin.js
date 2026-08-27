(function () {
  "use strict";

  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const loginError = document.getElementById("loginError");

  const STATUS_LABELS = {
    neu: "Neu",
    kontaktiert: "Kontaktiert",
    termin_vereinbart: "Termin vereinbart",
    abgeschlossen: "Abgeschlossen",
  };

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
      document.getElementById("filterStatusWrap").style.display = activeTab === "leads" ? "block" : "none";
      loadActiveTab();
    });
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", loadActiveTab);
  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    document.getElementById("filterStatus").value = "";
    loadActiveTab();
  });

  function currentFilters() {
    return {
      from: isoStartOfDay(document.getElementById("filterFrom").value),
      to: isoEndOfDay(document.getElementById("filterTo").value),
      status: document.getElementById("filterStatus").value,
    };
  }

  function loadActiveTab() {
    if (activeTab === "overview") return loadOverview();
    if (activeTab === "leads") return loadLeads();
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
    document.getElementById("statNeu").textContent = data.neu;
    document.getElementById("statKontaktiert").textContent = data.kontaktiert;
    document.getElementById("statTermin").textContent = data.termin_vereinbart;
    document.getElementById("statAbgeschlossen").textContent = data.abgeschlossen;

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

  // --- Terminanfragen ---

  async function loadLeads() {
    const { from, to, status } = currentFilters();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);

    const data = await api(`/api/admin/leads?${params.toString()}`).catch(() => null);
    if (!data) return;

    const tbody = document.getElementById("leadsBody");
    const empty = document.getElementById("leadsEmpty");
    if (!data.leads || data.leads.length === 0) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    tbody.innerHTML = data.leads
      .map((lead) => {
        const statusOptions = Object.entries(STATUS_LABELS)
          .map(([value, label]) => `<option value="${value}" ${value === lead.status ? "selected" : ""}>${label}</option>`)
          .join("");
        return `<tr>
          <td>${formatDate(lead.created_at)}</td>
          <td>${escapeHtml(lead.vorname)} ${escapeHtml(lead.nachname)}</td>
          <td>${escapeHtml(lead.telefonnummer)}</td>
          <td>${lead.email ? escapeHtml(lead.email) : "–"}</td>
          <td>${escapeHtml(lead.thema)}</td>
          <td>${lead.empfohlen_durch ? escapeHtml(lead.empfohlen_durch) : "–"}</td>
          <td>
            <select class="status-select status-${lead.status}" data-id="${lead.id}">
              ${statusOptions}
            </select>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const newStatus = select.value;
        try {
          await api(`/api/admin/leads/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          });
          select.className = `status-select status-${newStatus}`;
        } catch (err) {
          alert(err.message);
          loadLeads();
        }
      });
    });
  }

  // --- Init ---

  api("/api/admin/session")
    .then(() => showDashboard())
    .catch(() => showLogin());
})();
