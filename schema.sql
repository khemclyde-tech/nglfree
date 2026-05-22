-- nglfree D1 数据库 schema
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL,
  receivedAt TEXT NOT NULL,
  ip TEXT,
  meta_ua TEXT,
  meta_ref TEXT,
  meta_tz TEXT,
  meta_lang TEXT,
  meta_colo TEXT,
  meta_country TEXT,
  status TEXT DEFAULT 'new',
  pulled INTEGER DEFAULT 0,
  reply TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
