import { jsonResponse } from "../lib/auth.js";

const MAX_TEXT_LENGTH = 2000;

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

  const vorname = body.vorname;
  const nachname = body.nachname;
  const telefonnummer = body.telefonnummer;
  const email = body.email;
  const thema = body.thema;
  const empfohlenDurch = body.empfohlen_durch;
  const consent = body.consent_kontakt;

  if (!nonEmptyString(vorname, 200)) {
    return jsonResponse({ error: "Vorname ist ein Pflichtfeld." }, { status: 400 });
  }
  if (!nonEmptyString(nachname, 200)) {
    return jsonResponse({ error: "Nachname ist ein Pflichtfeld." }, { status: 400 });
  }
  if (!nonEmptyString(telefonnummer, 50)) {
    return jsonResponse({ error: "Telefonnummer ist ein Pflichtfeld." }, { status: 400 });
  }
  if (email !== undefined && email !== null && email !== "" && !nonEmptyString(email, 300)) {
    return jsonResponse({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }
  if (!nonEmptyString(thema, MAX_TEXT_LENGTH)) {
    return jsonResponse({ error: "Bitte geben Sie an, zu welchem Thema Sie beraten werden möchten." }, { status: 400 });
  }
  if (empfohlenDurch !== undefined && empfohlenDurch !== null && empfohlenDurch !== "" && !nonEmptyString(empfohlenDurch, 300)) {
    return jsonResponse({ error: "Ungültige Angabe zur empfehlenden Person." }, { status: 400 });
  }
  if (consent !== true) {
    return jsonResponse({ error: "Bitte bestätigen Sie, dass Herr Beeler Sie kontaktieren darf." }, { status: 400 });
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO leads (vorname, nachname, telefonnummer, email, thema, empfohlen_durch, consent_kontakt, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 'neu', ?)`
  )
    .bind(
      vorname.trim(),
      nachname.trim(),
      telefonnummer.trim(),
      email ? email.trim() : null,
      thema.trim(),
      empfohlenDurch ? empfohlenDurch.trim() : null,
      now
    )
    .run();

  return jsonResponse({ ok: true }, { status: 201 });
}
