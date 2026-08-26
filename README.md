# Kundenfeedback-Tool

Kundenfeedback- und Weiterempfehlungs-Tool für Lars Beeler, Vorsorge- und
Finanzspezialist aus Luzern. Details zum Konzept siehe
[`projektbrief-kundenfeedback-tool.md`](./projektbrief-kundenfeedback-tool.md).

## Stack

- **Frontend:** statisches HTML/CSS/JS in `public/`, gehostet über Cloudflare Pages
- **Backend:** Cloudflare Pages Functions in `functions/`
- **Datenbank:** Cloudflare D1 (`kundenfeedback-db`), Schema in `migrations/`

## Projektstruktur

```
public/                  Kundenseite (Umfrage), Datenschutzseite, Admin-Bereich
  index.html              5-teilige Umfrage
  datenschutz.html         Datenschutzerklärung
  admin/                   Passwortgeschützter Admin-Bereich (SPA)
functions/
  api/responses.js         POST /api/responses – Umfrage-Absenden
  api/admin/login.js        POST /api/admin/login
  api/admin/logout.js       POST /api/admin/logout
  api/admin/session.js      GET  /api/admin/session – Session-Check
  api/admin/summary.js      GET  /api/admin/summary – Kennzahlen & Verlauf
  api/admin/responses.js    GET  /api/admin/responses – Antworten-Liste
  api/admin/referrals.js    GET  /api/admin/referrals – Weiterempfehlungen-Liste
  api/admin/referrals/[id].js  PATCH – Status kontaktiert/nicht kontaktiert
  api/admin/_middleware.js  Session-Prüfung für alle /api/admin/* Routen
  lib/auth.js               Signierte Session-Cookies (HMAC-SHA256, ohne Fremd-Login-Dienst)
migrations/0001_init.sql    D1-Schema (responses, referrals)
wrangler.toml
```

## Lokale Einrichtung

Voraussetzungen: Node.js, ein Cloudflare-Account, `npx wrangler login` einmalig ausgeführt.

```bash
npm install
cp .dev.vars.example .dev.vars   # ADMIN_PASSWORD und SESSION_SECRET lokal setzen
npm run db:migrate:local          # legt das Schema in der lokalen D1-Instanz an
npm run dev                       # startet wrangler pages dev auf http://localhost:8788
```

`.dev.vars` wird von `wrangler pages dev` automatisch als lokale Umgebungsvariablen
(Secrets) eingelesen und ist über `.gitignore` vom Repo ausgeschlossen.

- Umfrage: `http://localhost:8788/`
- Admin-Bereich: `http://localhost:8788/admin/` (Passwort aus `.dev.vars`)

## Deployment auf Cloudflare (noch nicht ausgeführt)

1. `npx wrangler login`
2. `npx wrangler pages project create kundenfeedback-tool`
3. `npx wrangler d1 create kundenfeedback-db` → die zurückgegebene `database_id` in
   `wrangler.toml` unter `[[d1_databases]]` eintragen (ersetzt `REPLACE_WITH_D1_DATABASE_ID`)
4. `npm run db:migrate:remote` – Schema auf die produktive D1-Datenbank anwenden
5. Secrets für die Pages-Umgebung setzen (Production und ggf. Preview):
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD --project-name kundenfeedback-tool
   npx wrangler pages secret put SESSION_SECRET --project-name kundenfeedback-tool
   ```
6. `npm run deploy` (bzw. `npx wrangler pages deploy public --project-name kundenfeedback-tool`)
7. Optional: eigene Domain in Cloudflare Pages unter "Custom domains" verbinden

**Wichtig:** Vor dem produktiven Deployment sollte das Pages-Projekt in Cloudflare mit dem
D1-Binding `DB` (Name wie in `wrangler.toml`) verknüpft werden – entweder automatisch über
`wrangler.toml`, wenn per CLI deployt wird, oder manuell im Dashboard unter
Settings → Functions → D1 database bindings.

## Offene Punkte (Projektbrief Abschnitt 8) – aktueller Stand

- **Löschfrist Kontaktdaten:** 6 Monate nach Erstkontakt (siehe `datenschutz.html`).
  Aktuell nur als Text hinterlegt, es läuft noch kein automatischer Lösch-Job.
- **Domain:** vorerst Standard `*.pages.dev`, eigene Domain kann jederzeit nachträglich
  ergänzt werden.
- **Admin-Login:** einfaches Passwort (Cloudflare Secret `ADMIN_PASSWORD`) mit
  signiertem Session-Cookie, kein Cloudflare Access.

## Rechtliche Anpassungen (nach Rücksprache)

- **Kein Verweis auf "Swiss Life"** in der Datenschutzerklärung: Swiss Life untersagt laut eigenen
  Nutzungsbedingungen jede Verwendung ihres Namens ohne vorherige schriftliche Zustimmung. Als
  Verantwortlicher wird daher nur Lars Beeler persönlich genannt (Name, private Adresse
  Tribschenstrasse 48, 6005 Luzern, E-Mail). Falls eine solche Zustimmung von Swiss Life vorliegt
  oder eingeholt wird, kann der Name in `datenschutz.html` wieder ergänzt werden.
- **Betroffenenrechte ergänzt:** Auskunft (Art. 25 DSG), Berichtigung/Löschung (Art. 32 DSG),
  Widerspruchsrecht, mit direktem Kontaktweg.
- **Informationspflicht bei Weiterempfehlung präzisiert** (Art. 19 DSG, Daten nicht direkt von
  der betroffenen Person erhoben).
- **Hinweis zu Werbeanrufen:** Beim Erstkontakt mit einer empfohlenen Person gilt das UWG
  (u. a. Sternchen-Eintrag im Telefonbuch, Art. 3 Abs. 1 lit. u UWG). Vor dem Anruf empfiehlt es
  sich, die Nummer auf local.ch/search.ch auf einen Sternchen-Vermerk zu prüfen – ein solcher
  Vermerk untersagt Werbeanrufe ohne bestehende Geschäftsbeziehung.
- **Hinweis zu Art. 45 VAG:** Diese Umfrage ersetzt nicht die separate gesetzliche
  Informationspflicht als Versicherungsvermittler (gebunden/ungebunden, Register, Haftung,
  Entschädigung) beim tatsächlichen Beratungsgespräch mit einer empfohlenen Person.
- Diese Anpassungen wurden mit aktueller Rechtslage (Stand August 2026) plausibilisiert, ersetzen
  aber keine rechtliche Beratung im Einzelfall.

## Admin-Bereich

Erreichbar unter `/admin/`. Nach Login (Passwort aus `ADMIN_PASSWORD`) stehen drei
Tabs zur Verfügung:

- **Übersicht:** Anzahl Antworten, Durchschnittswerte Frage 1 & 2, Anzahl
  Weiterempfehlungen, offene (nicht kontaktierte) Weiterempfehlungen, Verlauf pro Tag
- **Antworten:** alle Umfrage-Antworten mit Datum, Bewertungen und Freitextkommentar,
  filterbar nach Zeitraum und Ja/Nein bei Frage 4
- **Weiterempfehlungen:** Name, Handynummer, E-Mail, Status kontaktiert/nicht
  kontaktiert (umschaltbar per Klick), filterbar nach Zeitraum und Status
