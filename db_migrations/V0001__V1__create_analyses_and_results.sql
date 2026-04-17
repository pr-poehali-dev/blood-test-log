
CREATE TABLE IF NOT EXISTS t_p83787157_blood_test_log.analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  analysis_date DATE,
  lab           TEXT,
  patient       TEXT,
  file_name     TEXT
);

CREATE TABLE IF NOT EXISTS t_p83787157_blood_test_log.results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id   UUID NOT NULL REFERENCES t_p83787157_blood_test_log.analyses(id),
  name          TEXT NOT NULL,
  value         NUMERIC,
  unit          TEXT,
  norm_min      NUMERIC,
  norm_max      NUMERIC,
  status        TEXT
);

CREATE INDEX IF NOT EXISTS results_analysis_id_idx ON t_p83787157_blood_test_log.results(analysis_id);
CREATE INDEX IF NOT EXISTS results_name_idx ON t_p83787157_blood_test_log.results(name);
