import { jsonResponse } from "../../lib/auth.js";

function dateFilterClause(url) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
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
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { where, params } = dateFilterClause(url);

  const totals = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'neu' THEN 1 ELSE 0 END) AS neu,
       SUM(CASE WHEN status = 'kontaktiert' THEN 1 ELSE 0 END) AS kontaktiert,
       SUM(CASE WHEN status = 'termin_vereinbart' THEN 1 ELSE 0 END) AS termin_vereinbart,
       SUM(CASE WHEN status = 'abgeschlossen' THEN 1 ELSE 0 END) AS abgeschlossen
     FROM leads ${where}`
  )
    .bind(...params)
    .first();

  const verlauf = await env.DB.prepare(
    `SELECT substr(created_at, 1, 10) AS tag, COUNT(*) AS anzahl
     FROM leads ${where}
     GROUP BY tag
     ORDER BY tag ASC`
  )
    .bind(...params)
    .all();

  return jsonResponse({
    total: totals.total || 0,
    neu: totals.neu || 0,
    kontaktiert: totals.kontaktiert || 0,
    termin_vereinbart: totals.termin_vereinbart || 0,
    abgeschlossen: totals.abgeschlossen || 0,
    verlauf: verlauf.results,
  });
}
