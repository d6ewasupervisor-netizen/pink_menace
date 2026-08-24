CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_students (
  parent_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invite_sms_status TEXT,
  invite_sms_rule TEXT,
  PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS parent_students_student_idx ON parent_students (student_id);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS sessions_person_idx ON sessions (person_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS pending_logins (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  intended_role TEXT NOT NULL CHECK (intended_role IN ('parent', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_progress (
  student_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  act TEXT,
  current_card_id TEXT,
  cards_completed INTEGER NOT NULL DEFAULT 0,
  hours_logged NUMERIC(6, 2) NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_events (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  choice TEXT,
  correct BOOLEAN,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS card_events_student_idx ON card_events (student_id, created_at DESC);
