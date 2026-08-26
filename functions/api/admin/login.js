import { createSessionCookie, jsonResponse } from "../../lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return jsonResponse({ error: "Server nicht konfiguriert." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: "Falsches Passwort." }, { status: 401 });
  }

  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
