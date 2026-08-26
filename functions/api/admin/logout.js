import { clearSessionCookie, jsonResponse } from "../../lib/auth.js";

export async function onRequestPost() {
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
