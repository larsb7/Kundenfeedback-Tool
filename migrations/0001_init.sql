-- Schema für die Empfehlungs-Landingpage (Terminanfragen von empfohlenen Personen)
-- siehe projektbrief-kundenfeedback-tool.md für die Historie; dieses Schema ersetzt
-- die ursprüngliche Zufriedenheits-Umfrage vollständig.

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefonnummer TEXT NOT NULL,
  email TEXT,
  thema TEXT NOT NULL,
  empfohlen_durch TEXT,
  consent_kontakt INTEGER NOT NULL CHECK (consent_kontakt = 1),
  status TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu', 'kontaktiert', 'termin_vereinbart', 'abgeschlossen')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
