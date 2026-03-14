-- ============================================
-- Job Queue System
-- ============================================

CREATE TABLE IF NOT EXISTS job_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload jsonb NOT NULL DEFAULT '{}',
  result jsonb,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_created_by ON job_queue(created_by);

ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own jobs"
  ON job_queue FOR SELECT
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
  ));

CREATE POLICY "Authenticated can insert jobs"
  ON job_queue FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service can update jobs"
  ON job_queue FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Circuit breaker state
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  service text PRIMARY KEY,
  state text NOT NULL DEFAULT 'closed'
    CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count int DEFAULT 0,
  last_failure_at timestamptz,
  opened_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE circuit_breaker_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read circuit breaker"
  ON circuit_breaker_state FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update circuit breaker"
  ON circuit_breaker_state FOR ALL
  USING (auth.role() = 'authenticated');

-- Initialize circuit breaker for Gemini AI
INSERT INTO circuit_breaker_state (service, state, failure_count)
VALUES ('gemini-ai', 'closed', 0)
ON CONFLICT (service) DO NOTHING;
