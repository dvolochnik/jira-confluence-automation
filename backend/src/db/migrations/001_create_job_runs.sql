CREATE TABLE IF NOT EXISTS job_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  source TEXT,
  page_state TEXT,
  sprint_name TEXT,
  as_of_date DATE,
  points_label TEXT,
  committed_points NUMERIC,
  done_points NUMERIC,
  blocked_count INTEGER,
  overdue_count INTEGER,
  unassigned_count INTEGER,
  overloaded_count INTEGER,
  error_code TEXT,
  http_status INTEGER
);
