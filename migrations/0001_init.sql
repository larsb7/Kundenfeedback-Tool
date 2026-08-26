-- Initiales Schema für das Kundenfeedback- und Weiterempfehlungs-Tool
-- siehe projektbrief-kundenfeedback-tool.md, Abschnitt 3

CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  kunde_name TEXT NOT NULL,
  q1_zufriedenheit INTEGER NOT NULL CHECK (q1_zufriedenheit BETWEEN 0 AND 5),
  q2_fachkompetenz INTEGER NOT NULL CHECK (q2_fachkompetenz BETWEEN 0 AND 5),
  q3_kommentar TEXT NOT NULL,
  q4_empfehlung TEXT NOT NULL CHECK (q4_empfehlung IN ('ja', 'nein'))
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id INTEGER NOT NULL REFERENCES responses(id),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  handynummer TEXT NOT NULL,
  email TEXT,
  consent INTEGER NOT NULL DEFAULT 0 CHECK (consent IN (0, 1)),
  contacted INTEGER NOT NULL DEFAULT 0 CHECK (contacted IN (0, 1)),
  contacted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_q4 ON responses(q4_empfehlung);
CREATE INDEX IF NOT EXISTS idx_referrals_response_id ON referrals(response_id);
CREATE INDEX IF NOT EXISTS idx_referrals_contacted ON referrals(contacted);
