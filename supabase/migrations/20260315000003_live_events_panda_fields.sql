-- Add Panda Video live integration fields
ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS panda_live_id text,
  ADD COLUMN IF NOT EXISTS panda_rtmp text,
  ADD COLUMN IF NOT EXISTS panda_stream_key text;

-- Make stream_url nullable (Panda auto-fills it)
ALTER TABLE live_events ALTER COLUMN stream_url DROP NOT NULL;
