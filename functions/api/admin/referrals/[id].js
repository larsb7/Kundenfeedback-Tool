import { jsonResponse } from "../../../lib/auth.js";

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

  if (typeof body.contacted !== "boolean") {
    return jsonResponse({ error: "Feld 'contacted' (boolean) fehlt." }, { status: 400 });
  }

  const contacted = body.contacted ? 1 : 0;
  const contactedAt = contacted ? new Date().toISOString() : null;

  const result = await env.DB.prepare(
    `UPDATE referrals SET contacted = ?, contacted_at = ? WHERE id = ?`
  )
    .bind(contacted, contactedAt, id)
    .run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: "Nicht gefunden." }, { status: 404 });
  }

  return jsonResponse({ ok: true, contacted: !!contacted, contacted_at: contactedAt });
}
