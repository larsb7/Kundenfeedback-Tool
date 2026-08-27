import { jsonResponse } from "../../lib/auth.js";

const VALID_STATUSES = ["neu", "kontaktiert", "termin_vereinbart", "abgeschlossen"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");

  const clauses = [];
  const params = [];
  if (from) {
    clauses.push("created_at >= ?");
    params.push(from);
  }
  if (to) {
    clauses.push("created_at <= ?");
    params.push(to);
  }
  if (status && VALID_STATUSES.includes(status)) {
    clauses.push("status = ?");
    params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await env.DB.prepare(
    `SELECT id, vorname, nachname, telefonnummer, email, thema, empfohlen_durch, status, created_at
     FROM leads ${where}
     ORDER BY created_at DESC
     LIMIT 500`
  )
    .bind(...params)
    .all();

  return jsonResponse({ leads: result.results });
}
