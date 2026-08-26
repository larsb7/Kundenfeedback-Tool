import { jsonResponse } from "../../lib/auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const contacted = url.searchParams.get("contacted"); // "0" | "1"

  const clauses = [];
  const params = [];
  if (from) {
    clauses.push("r.created_at >= ?");
    params.push(from);
  }
  if (to) {
    clauses.push("r.created_at <= ?");
    params.push(to);
  }
  if (contacted === "0" || contacted === "1") {
    clauses.push("r.contacted = ?");
    params.push(Number(contacted));
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await env.DB.prepare(
    `SELECT r.id, r.response_id, r.vorname, r.nachname, r.handynummer, r.email,
            r.contacted, r.contacted_at, r.created_at
     FROM referrals r
     ${where}
     ORDER BY r.created_at DESC
     LIMIT 500`
  )
    .bind(...params)
    .all();

  return jsonResponse({ referrals: result.results });
}
