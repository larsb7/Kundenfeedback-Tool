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
       AVG(q1_zufriedenheit) AS avg_q1,
       AVG(q2_fachkompetenz) AS avg_q2,
       SUM(CASE WHEN q4_empfehlung = 'ja' THEN 1 ELSE 0 END) AS empfehlungen_ja,
       SUM(CASE WHEN q4_empfehlung = 'nein' THEN 1 ELSE 0 END) AS empfehlungen_nein
     FROM responses ${where}`
  )
    .bind(...params)
    .first();

  const verlauf = await env.DB.prepare(
    `SELECT
       substr(created_at, 1, 10) AS tag,
       COUNT(*) AS anzahl,
       AVG(q1_zufriedenheit) AS avg_q1,
       AVG(q2_fachkompetenz) AS avg_q2
     FROM responses ${where}
     GROUP BY tag
     ORDER BY tag ASC`
  )
    .bind(...params)
    .all();

  const offeneWeiterempfehlungen = await env.DB.prepare(
    `SELECT COUNT(*) AS anzahl FROM referrals WHERE contacted = 0`
  ).first();

  return jsonResponse({
    total: totals.total || 0,
    avg_q1: totals.avg_q1 !== null ? Math.round(totals.avg_q1 * 100) / 100 : null,
    avg_q2: totals.avg_q2 !== null ? Math.round(totals.avg_q2 * 100) / 100 : null,
    empfehlungen_ja: totals.empfehlungen_ja || 0,
    empfehlungen_nein: totals.empfehlungen_nein || 0,
    offene_weiterempfehlungen: offeneWeiterempfehlungen.anzahl || 0,
    verlauf: verlauf.results,
  });
}
