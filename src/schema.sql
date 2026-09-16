-- v2 schema. Legacy tables are dropped in db.js when person_id is still present.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  display_name TEXT NOT NULL,
  phone_e164 TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pending_links (
  id UUID PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  phone_hmac TEXT NOT NULL,
  phone_last4 CHAR(4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, phone_hmac)
);

CREATE INDEX IF NOT EXISTS pending_links_hmac_idx ON pending_links (phone_hmac);
CREATE INDEX IF NOT EXISTS pending_links_created_idx ON pending_links (created_at);

CREATE TABLE IF NOT EXISTS parent_students (
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS parent_students_student_idx ON parent_students (student_id);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS cards (
  card_id TEXT PRIMARY KEY,
  act TEXT NOT NULL,
  zone TEXT NOT NULL,
  driver TEXT NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  scene TEXT NOT NULL,
  decision TEXT,
  debrief TEXT,
  image_bytes BYTEA,
  image_mime TEXT,
  psdp_skill TEXT,
  dol_section TEXT,
  teaching_target TEXT,
  callback_of TEXT,
  schedules_callback BOOLEAN NOT NULL DEFAULT false,
  location_type TEXT,
  weather TEXT,
  time_of_day TEXT,
  seq INTEGER NOT NULL,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS card_options (
  card_id TEXT NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  result TEXT NOT NULL,
  state_delta JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (card_id, option_id)
);

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  current_card_id TEXT REFERENCES cards(card_id),
  current_attempt_no INTEGER NOT NULL DEFAULT 1,
  start_seq INTEGER NOT NULL DEFAULT 0,
  queued_callbacks TEXT[] NOT NULL DEFAULT '{}',
  callback_debts JSONB NOT NULL DEFAULT '[]'::jsonb,
  replay_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  replay_index INTEGER NOT NULL DEFAULT 0,
  review_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_index INTEGER NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_presence INTEGER NOT NULL DEFAULT 0,
  cargo_fail_reason TEXT,
  lot_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS runs_one_active ON runs (student_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS run_answers (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(card_id),
  attempt_no INTEGER NOT NULL,
  option_id TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  ms_to_answer INTEGER,
  ms_on_outcome INTEGER,
  ms_on_scene INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, card_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS run_line_advances (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  line_index INTEGER NOT NULL,
  ms_at INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One resolution per card per run. Callback debt may queue a different card;
-- it must never rewrite a card that already has a row.
CREATE UNIQUE INDEX IF NOT EXISTS run_answers_one_per_card ON run_answers (run_id, card_id);

CREATE TABLE IF NOT EXISTS coverage_log (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT,
  practiced_on DATE NOT NULL,
  location TEXT,
  day_night TEXT,
  weather TEXT,
  psdp_skill TEXT,
  dol_section TEXT,
  act TEXT,
  zone TEXT,
  hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  initials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coverage_log_student_idx ON coverage_log (student_id, practiced_on);

CREATE TABLE IF NOT EXISTS otp_ip_hits (
  ip TEXT NOT NULL,
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_ip_hits_idx ON otp_ip_hits (ip, hit_at);

-- ── Quiet Roads (the 3D drive at /drive). Own tables; never touches runs/run_answers. ──

-- One row per student: the whole save. JSONB because the shape is the client's.
CREATE TABLE IF NOT EXISTS drive_progress (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  scene_id TEXT,
  checkpoint TEXT,
  vars JSONB NOT NULL DEFAULT '{}'::jsonb,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  unlocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  mastery JSONB NOT NULL DEFAULT '{}'::jsonb,
  runner_state JSONB,
  placeholders JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Telemetry: noise events, stops, quizzes, choices. Batched by the client (≤ 50 per POST).
CREATE TABLE IF NOT EXISTS drive_events (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  event TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drive_events_student_ts_idx ON drive_events (student_id, ts DESC);

-- WA Driver Guide question bank attempts (the study terminal + in-world prompts).
CREATE TABLE IF NOT EXISTS drive_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  question_id TEXT NOT NULL,
  chapter INTEGER,
  correct BOOLEAN NOT NULL,
  chosen INTEGER,
  response_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drive_attempts_student_idx ON drive_attempts (student_id, ts DESC);

-- PINK MENACE cards answered inside the drive. Separate from run_answers on purpose:
-- run_answers drives the card game's callback/cargo machine; this only records.
CREATE TABLE IF NOT EXISTS drive_card_answers (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  card_id TEXT NOT NULL REFERENCES cards(card_id),
  option_id TEXT,
  was_correct BOOLEAN,
  source TEXT NOT NULL DEFAULT 'story',   -- story | world
  scene_id TEXT,
  ms_to_answer INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drive_card_answers_student_idx ON drive_card_answers (student_id, ts DESC);
