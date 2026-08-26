import { jsonResponse } from "../lib/auth.js";

const MAX_TEXT_LENGTH = 2000;

function isRating(value) {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

function nonEmptyString(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const kundeName = body.kunde_name;
  const q1 = body.q1_zufriedenheit;
  const q2 = body.q2_fachkompetenz;
  const q3 = body.q3_kommentar;
  const q4 = body.q4_empfehlung;

  if (!nonEmptyString(kundeName, 200)) {
    return jsonResponse({ error: "Bitte Ihren Namen angeben." }, { status: 400 });
  }
  if (!isRating(q1)) {
    return jsonResponse({ error: "Frage 1: Bitte eine Bewertung von 0 bis 5 angeben." }, { status: 400 });
  }
  if (!isRating(q2)) {
    return jsonResponse({ error: "Frage 2: Bitte eine Bewertung von 0 bis 5 angeben." }, { status: 400 });
  }
  if (!nonEmptyString(q3)) {
    return jsonResponse({ error: "Frage 3: Bitte einen Kommentar eingeben." }, { status: 400 });
  }
  if (q4 !== "ja" && q4 !== "nein") {
    return jsonResponse({ error: "Frage 4: Bitte 'ja' oder 'nein' angeben." }, { status: 400 });
  }

  let referral = null;
  if (q4 === "ja") {
    const r = body.referral || {};
    if (!nonEmptyString(r.vorname, 200)) {
      return jsonResponse({ error: "Vorname ist ein Pflichtfeld." }, { status: 400 });
    }
    if (!nonEmptyString(r.nachname, 200)) {
      return jsonResponse({ error: "Nachname ist ein Pflichtfeld." }, { status: 400 });
    }
    if (!nonEmptyString(r.handynummer, 50)) {
      return jsonResponse({ error: "Handynummer ist ein Pflichtfeld." }, { status: 400 });
    }
    if (r.email !== undefined && r.email !== null && r.email !== "" && !nonEmptyString(r.email, 300)) {
      return jsonResponse({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
    }
    if (r.consent !== true) {
      return jsonResponse({ error: "Bitte der Weitergabe der Kontaktdaten zustimmen." }, { status: 400 });
    }
    referral = {
      vorname: r.vorname.trim(),
      nachname: r.nachname.trim(),
      handynummer: r.handynummer.trim(),
      email: r.email ? r.email.trim() : null,
    };
  }

  const now = new Date().toISOString();

  const responseResult = await env.DB.prepare(
    `INSERT INTO responses (created_at, kunde_name, q1_zufriedenheit, q2_fachkompetenz, q3_kommentar, q4_empfehlung)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(now, kundeName.trim(), q1, q2, q3.trim(), q4)
    .run();

  const responseId = responseResult.meta.last_row_id;

  if (referral) {
    await env.DB.prepare(
      `INSERT INTO referrals (response_id, vorname, nachname, handynummer, email, consent, contacted, created_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?)`
    )
      .bind(responseId, referral.vorname, referral.nachname, referral.handynummer, referral.email, now)
      .run();
  }

  return jsonResponse({ ok: true }, { status: 201 });
}
