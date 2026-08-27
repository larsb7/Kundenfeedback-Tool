import { jsonResponse } from "../../../lib/auth.js";

const VALID_STATUSES = ["neu", "kontaktiert", "termin_vereinbart", "abgeschlossen"];

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return jsonResponse({ error: "Ungültige ID." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return jsonResponse({ error: "Ungültiger Status." }, { status: 400 });
  }

  const result = await env.DB.prepare(`UPDATE leads SET status = ? WHERE id = ?`)
    .bind(body.status, id)
    .run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: "Nicht gefunden." }, { status: 404 });
  }

  return jsonResponse({ ok: true, status: body.status });
}
