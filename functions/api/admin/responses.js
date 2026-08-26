import { jsonResponse } from "../../lib/auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const empfehlung = url.searchParams.get("empfehlung"); // "ja" | "nein"

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
  if (empfehlung === "ja" || empfehlung === "nein") {
    clauses.push("q4_empfehlung = ?");
    params.push(empfehlung);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await env.DB.prepare(
    `SELECT id, created_at, kunde_name, q1_zufriedenheit, q2_fachkompetenz, q3_kommentar, q4_empfehlung
     FROM responses ${where}
     ORDER BY created_at DESC
     LIMIT 500`
  )
    .bind(...params)
    .all();

  return jsonResponse({ responses: result.results });
}
