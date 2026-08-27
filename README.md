# Kundenfeedback-Tool

Empfehlungs-Landingpage für Lars Beeler, Vorsorge- und Finanzspezialist aus Luzern.
Von Kunden weiterempfohlene Personen gelangen per QR-Code auf diese Seite und können
dort direkt ein kostenloses Erstgespräch anfragen. Ursprüngliches Konzept (Zufriedenheits-
Umfrage) siehe [`projektbrief-kundenfeedback-tool.md`](./projektbrief-kundenfeedback-tool.md)
– das Projekt wurde seither zu einer reinen Terminanfrage-Landingpage umgebaut.

## Stack

- **Frontend:** statisches HTML/CSS/JS in `public/`, gehostet über Cloudflare Pages
- **Backend:** Cloudflare Pages Functions in `functions/`
- **Datenbank:** Cloudflare D1 (`kundenfeedback-db`), Schema in `migrations/`

## Projektstruktur

```
public/                  Landingpage, Datenschutzseite, Admin-Bereich
  index.html              Hero + Terminanfrage-Formular + Dankesseite
  datenschutz.html         Datenschutzerklärung
  admin/                   Passwortgeschützter Admin-Bereich (SPA)
functions/
  api/leads.js              POST /api/leads – Terminanfrage absenden
  api/admin/login.js        POST /api/admin/login
  api/admin/logout.js       POST /api/admin/logout
  api/admin/session.js      GET  /api/admin/session – Session-Check
  api/admin/summary.js      GET  /api/admin/summary – Kennzahlen (Status-Verteilung) & Verlauf
  api/admin/leads.js        GET  /api/admin/leads – Leads-Liste, filterbar nach Zeitraum/Status
  api/admin/leads/[id].js    PATCH – Status ändern (neu/kontaktiert/termin_vereinbart/abgeschlossen)
  api/admin/_middleware.js  Session-Prüfung für alle /api/admin/* Routen
  lib/auth.js               Signierte Session-Cookies (HMAC-SHA256, ohne Fremd-Login-Dienst)
migrations/0001_init.sql    D1-Schema (Tabelle leads)
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

- Landingpage: `http://localhost:8788/`
- Admin-Bereich: `http://localhost:8788/admin/` (Passwort aus `.dev.vars`)

## Deployment auf Cloudflare (noch nicht ausgeführt)

1. `npx wrangler login`
2. `npx wrangler pages project create kundenfeedback-tool`
3. **D1-Datenbank mit EU-Jurisdiktion anlegen** (nur bei Neuanlage möglich, nicht nachträglich
   änderbar):
   ```bash
   npx wrangler d1 create kundenfeedback-db --jurisdiction eu
   ```
   Die zurückgegebene `database_id` in `wrangler.toml` unter `[[d1_databases]]` eintragen
   (ersetzt `REPLACE_WITH_D1_DATABASE_ID`).
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

## Bekannte Lücke: keine Benachrichtigung bei neuem Lead

Es gibt aktuell **keine** E-Mail- oder Push-Benachrichtigung, wenn ein neuer Lead eingeht –
das war nie Teil der ursprünglichen Umsetzung. Neue Anfragen erscheinen nur im Admin-Dashboard
unter "Terminanfragen". Falls gewünscht, kann das später ergänzt werden (braucht einen
E-Mail-Versand-Dienst wie Resend oder SendGrid samt API-Key).

## Rechtliche Anpassungen (nach Rücksprache)

- **Kein Verweis auf "Swiss Life"** in der Datenschutzerklärung: Swiss Life untersagt laut eigenen
  Nutzungsbedingungen jede Verwendung ihres Namens ohne vorherige schriftliche Zustimmung. Als
  Verantwortlicher wird daher nur Lars Beeler persönlich genannt (Name, private Adresse
  Tribschenstrasse 48, 6005 Luzern, E-Mail).
- **Betroffenenrechte ergänzt:** Auskunft (Art. 25 DSG), Berichtigung/Löschung (Art. 32 DSG),
  Widerspruchsrecht, mit direktem Kontaktweg.
- **Einfachere Rechtslage als zuvor:** Da die anfragende Person ihre eigenen Daten direkt selbst
  einreicht und der Kontaktaufnahme per Pflicht-Checkbox aktiv zustimmt, handelt es sich um eine
  direkte Datenbeschaffung (Art. 19 Abs. 1 DSG) – die frühere Konstellation mit indirekt
  erhobenen Daten einer Drittperson (Art. 19 Abs. 2, UWG-Kaltakquise-Fragen) entfällt für den
  Regelfall.
- **D1 EU-Jurisdiktion:** Die produktive Datenbank sollte mit `--jurisdiction eu` angelegt werden,
  damit Speicherung und Verarbeitung der Personendaten innerhalb der EU erfolgen (siehe
  Deployment-Schritt 3 oben). Das lässt sich nur bei der Neuanlage setzen, nicht nachträglich.
- Diese Anpassungen wurden mit aktueller Rechtslage (Stand August 2026) plausibilisiert, ersetzen
  aber keine rechtliche Beratung im Einzelfall.

## Admin-Bereich

Erreichbar unter `/admin/`. Nach Login (Passwort aus `ADMIN_PASSWORD`) stehen zwei Tabs
zur Verfügung:

- **Übersicht:** Anzahl Anfragen gesamt sowie pro Status (neu, kontaktiert, termin
  vereinbart, abgeschlossen), Verlauf pro Tag
- **Terminanfragen:** alle Leads mit Datum, Name, Telefon, E-Mail, Thema, empfehlender
  Person und Status (per Dropdown direkt änderbar), filterbar nach Zeitraum und Status
