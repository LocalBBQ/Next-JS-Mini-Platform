CREATE TABLE IF NOT EXISTS user_boards (
  user_id TEXT PRIMARY KEY,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  tickers JSONB NOT NULL DEFAULT '[]'::jsonb,
  teams JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
