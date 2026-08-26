import { isAuthenticated, jsonResponse } from "../../lib/auth.js";

// Schützt alle /api/admin/* Routen ausser dem Login selbst.
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/api/admin/login") {
    return next();
  }

  if (!env.SESSION_SECRET) {
    return jsonResponse({ error: "Server nicht konfiguriert (SESSION_SECRET fehlt)." }, { status: 500 });
  }

  const authed = await isAuthenticated(request, env.SESSION_SECRET);
  if (!authed) {
    return jsonResponse({ error: "Nicht angemeldet." }, { status: 401 });
  }

  return next();
}
