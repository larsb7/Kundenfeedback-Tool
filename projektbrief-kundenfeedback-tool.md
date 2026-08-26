# Projektbrief: Kundenfeedback- und Weiterempfehlungs-Tool

Auftraggeber: Lars Beeler, Vorsorge- und Versicherungsberater, Swiss Life Generalagentur Luzern-Stans
Stand: finaler Ablauf nach Prototyp-Test, Basis für die Code-Umsetzung

## 1. Ziel

Nach jedem Beratungstermin erhält ein zufriedener Kunde einen QR-Code. Dieser führt auf eine kurze Online-Umfrage (5 Fragen), die die Zufriedenheit erfasst und gezielt nach Weiterempfehlungen fragt. Lars sieht alle Antworten und offene Weiterempfehlungen in einem passwortgeschützten Admin-Bereich.

## 2. Technischer Stack

- **Hosting Frontend:** Cloudflare Pages (kostenlos, kommerzielle Nutzung erlaubt, unbegrenzte statische Anfragen)
- **Backend:** Cloudflare Pages Functions (serverlose API-Routen für Formular-Absenden und Admin-Datenabfragen)
- **Datenbank:** Cloudflare D1 (SQLite-basiert, kostenlos bis 5 GB / 5 Mio. Zugriffe pro Monat)
- **Domain:** Standard `*.pages.dev` kostenlos, eigene Domain (z. B. feedback-larsbeeler.ch) optional, ca. CHF 10-20/Jahr

## 3. Datenmodell (D1)

**Tabelle `responses`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER, PK | fortlaufend |
| created_at | TEXT | Zeitstempel |
| q1_zufriedenheit | INTEGER | 0-5 |
| q2_fachkompetenz | INTEGER | 0-5 |
| q3_kommentar | TEXT | Pflichtfeld |
| q4_empfehlung | TEXT | "ja" / "nein" |

**Tabelle `referrals`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER, PK | fortlaufend |
| response_id | INTEGER, FK | Bezug zu responses.id |
| vorname | TEXT | Pflichtfeld |
| nachname | TEXT | Pflichtfeld |
| handynummer | TEXT | Pflichtfeld |
| email | TEXT | optional |
| consent | INTEGER | 1 (Checkbox bestätigt) |
| contacted | INTEGER | 0/1, Status im Admin-Bereich |
| contacted_at | TEXT | optional, wenn kontaktiert |
| created_at | TEXT | Zeitstempel |

Nur befüllt, wenn q4_empfehlung = "ja".

## 4. Kundenseite: finaler Ablauf

Mobile-first, ein Fortschrittsbalken über allen Schritten. Branding: "Lars Beeler, Ihr Vorsorge- und Finanzspezialist aus Luzern", kein Swiss Life Logo. Akzentfarbe Teal, an Swiss Life angelehnt: `#0f6e56` (hell) / `#5dcaa5` (dunkel), getestet im Prototyp.

1. **Frage 1** (Pflicht): "Wie zufrieden waren Sie insgesamt mit der Beratung?" – Bewertung 0-5 (Kreise/Buttons, nicht Sterne-Icons, siehe Prototyp)
2. **Frage 2** (Pflicht): "Wie bewerten Sie die Fachkompetenz von Herrn Beeler?" – Bewertung 0-5
3. **Frage 3** (Pflicht): "Was hat Ihnen an der Beratung von Herrn Beeler besonders gefallen?" – Freitext
4. **Frage 4** (Pflicht): "Würden Sie Herrn Beeler weiterempfehlen?" – Ja / Nein. Bei "Nein" direkt zum Abschluss springen, Frage 5 überspringen.
5. **Frage 5** (nur bei "Ja"): Kontaktformular
   - Einleitungstext: "Eine Weiterempfehlung ist für mich immer das schönste Kompliment. Falls Sie also jemanden kennen, der ebenfalls von einer Beratung profitieren würde, können Sie gerne die Kontaktdaten dieser Person unten eingeben."
   - Vorname (Pflicht), Nachname (Pflicht), Handynummer (Pflicht), E-Mail (optional)
   - Checkbox (Pflicht): "Ich bin einverstanden, dass Herr Beeler sich bei der angegebenen Person melden darf."
   - Hinweistext darunter: "Die Angaben werden ausschliesslich für eine unverbindliche Erstberatung verwendet und nicht an Dritte weitergegeben."

**Abschluss:** "Vielen Dank für Ihre Teilnahme. Ich schätze das sehr."

## 5. Datenschutz, rechtlich abgesichert

- Consent-Checkbox verlagert die Einwilligung zur Datenweitergabe sauber auf den Kunden, der die Daten liefert (er bestätigt aktiv, dass die Drittperson einverstanden ist).
- Kurze Datenschutzerklärung, verlinkt am Seitenende: Zweck der Datenerhebung, Löschfrist, Verantwortlicher (Lars Beeler, Swiss Life Generalagentur Luzern-Stans, Ringstrasse 37, 6010 Kriens).
- **Offen zu bestätigen:** Löschfrist für Kontaktdaten aus Frage 5, falls kein Beratungsverhältnis entsteht. Vorschlag: 6 Monate nach Erstkontakt.
- Beim Erstkontakt mit der empfohlenen Person muss Lars offenlegen, von wem der Kontakt stammt (gesetzliche Informationspflicht, Art. 19 DSG).
- Datentransfer in die USA über Cloudflare ist durch das Swiss-US Data Privacy Framework (seit September 2024) abgedeckt.

## 6. Admin-Bereich

- Passwortgeschützter Login (kein öffentlicher Zugriff)
- **Übersicht:** Durchschnittswerte Frage 1 und 2, Anzahl Antworten gesamt, Verlauf über Zeit
- **Antworten-Liste:** alle Freitextantworten aus Frage 3, mit Datum und Bewertungen
- **Weiterempfehlungen-Liste:** Name, Handynummer, E-Mail, Status "kontaktiert" / "nicht kontaktiert" (umschaltbar), Datum
- Filter nach Zeitraum und nach Ja/Nein-Antwort

## 7. Umsetzungsschritte (Cloudflare)

1. `wrangler login`
2. `wrangler pages project create <projektname>`
3. `wrangler d1 create kundenfeedback-db`
4. D1-Migrationen mit obigem Schema anwenden
5. Pages Functions für: Formular-Absenden (`POST /api/responses`), Admin-Login, Admin-Datenabfragen
6. `wrangler pages deploy`
7. Optional: eigene Domain in Cloudflare verbinden

## 8. Noch zu entscheiden

- Löschfrist Kontaktdaten (Vorschlag 6 Monate, siehe Punkt 5)
- Eigene Domain gewünscht oder `*.pages.dev` ausreichend?
- Admin-Login: einfaches Passwort oder Cloudflare Access (SSO ohne eigenen Code)?
