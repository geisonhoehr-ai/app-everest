-- ============================================
-- Student Management Improvements Migration
-- ============================================

-- Add new columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_unlimited_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_is_unlimited ON users(is_unlimited_access);

-- Function to update last_seen (with 5 min debounce)
CREATE OR REPLACE FUNCTION update_last_seen(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET last_seen_at = now()
  WHERE id = p_user_id
    AND (last_seen_at IS NULL OR last_seen_at < now() - interval '5 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
