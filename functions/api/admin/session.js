import { jsonResponse } from "../../lib/auth.js";

// Erreichbar nur mit gültiger Session (siehe _middleware.js) - dient dem Frontend
// zur Prüfung, ob noch eine aktive Admin-Session besteht.
export async function onRequestGet() {
  return jsonResponse({ authenticated: true });
}
