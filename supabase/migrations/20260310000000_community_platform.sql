-- ============================================================
-- Community Platform Migration
-- Renames forum_* tables, adds new columns, creates new tables
-- ============================================================

-- 1. Rename existing tables
ALTER TABLE IF EXISTS forum_categories RENAME TO community_spaces;
ALTER TABLE IF EXISTS forum_topics RENAME TO community_posts;
ALTER TABLE IF EXISTS forum_posts RENAME TO community_comments;

-- 2. Expand community_spaces (was forum_categories)
ALTER TABLE community_spaces
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'MessageSquare',
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS space_type text DEFAULT 'general'
    CHECK (space_type IN ('general', 'course', 'event'));

-- 3. Expand community_posts (was forum_topics)
ALTER TABLE community_posts
  RENAME COLUMN category_id TO space_id;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text'
    CHECK (type IN ('text', 'poll', 'question')),
  ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS link_preview jsonb,
  ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- 4. Expand community_comments (was forum_posts)
ALTER TABLE community_comments
  RENAME COLUMN topic_id TO post_id;

ALTER TABLE community_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES community_comments(id),
  ADD COLUMN IF NOT EXISTS is_best_answer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_official boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 5. New tables

-- Reactions
CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, emoji)
);

-- Attachments
CREATE TABLE IF NOT EXISTS community_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'document', 'video', 'audio')),
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Reports
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Mutes
CREATE TABLE IF NOT EXISTS community_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_by uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  muted_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Poll options
CREATE TABLE IF NOT EXISTS community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  text text NOT NULL,
  "order" integer DEFAULT 0,
  votes_count integer DEFAULT 0
);

-- Poll votes
CREATE TABLE IF NOT EXISTS community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (option_id, user_id)
);

-- Word filter
CREATE TABLE IF NOT EXISTS community_word_filter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_space_id ON community_posts(space_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_target ON community_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_attachments_post ON community_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_attachments_comment ON community_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_mutes_user ON community_mutes(user_id);

-- 7. RLS Policies
ALTER TABLE community_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_word_filter ENABLE ROW LEVEL SECURITY;

-- Spaces: everyone reads, admins/teachers write
CREATE POLICY "spaces_select" ON community_spaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "spaces_insert" ON community_spaces FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "spaces_update" ON community_spaces FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "spaces_delete" ON community_spaces FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'administrator'));

-- Posts: everyone reads, authenticated creates own, admins/teachers/owner manage
CREATE POLICY "posts_select" ON community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "posts_delete" ON community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Comments: everyone reads, authenticated creates own, admins/teachers/owner manage
CREATE POLICY "comments_select" ON community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON community_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "comments_delete" ON community_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Reactions: everyone reads, own CRUD
CREATE POLICY "reactions_select" ON community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON community_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON community_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Attachments: everyone reads, own upload
CREATE POLICY "attachments_select" ON community_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "attachments_insert" ON community_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attachments_delete" ON community_attachments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Reports: own creates, admins/teachers see all
CREATE POLICY "reports_insert" ON community_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select" ON community_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "reports_update" ON community_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Mutes: admins/teachers manage, user can see own
CREATE POLICY "mutes_select" ON community_mutes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "mutes_insert" ON community_mutes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));
CREATE POLICY "mutes_delete" ON community_mutes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Poll options: everyone reads, post owner creates
CREATE POLICY "poll_options_select" ON community_poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "poll_options_insert" ON community_poll_options FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM community_posts WHERE id = post_id AND user_id = auth.uid()));

-- Poll votes: everyone reads, own vote
CREATE POLICY "poll_votes_select" ON community_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "poll_votes_insert" ON community_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll_votes_delete" ON community_poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Word filter: admins manage, everyone reads
CREATE POLICY "word_filter_select" ON community_word_filter FOR SELECT TO authenticated USING (true);
CREATE POLICY "word_filter_insert" ON community_word_filter FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'administrator'));
CREATE POLICY "word_filter_delete" ON community_word_filter FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'administrator'));

-- 8. Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-attachments',
  'community-attachments',
  true,
  26214400,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','video/mp4','audio/mpeg','audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "community_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-attachments');
CREATE POLICY "community_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-attachments');
CREATE POLICY "community_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher'))));

-- 9. Seed default spaces
INSERT INTO community_spaces (name, slug, description, icon, color, "order", space_type)
VALUES
  ('Geral', 'geral', 'Discussoes gerais entre alunos e professores', 'MessageSquare', 'blue', 1, 'general'),
  ('Duvidas EAOF', 'duvidas-eaof', 'Tire suas duvidas sobre o concurso EAOF', 'HelpCircle', 'emerald', 2, 'general'),
  ('Duvidas CADAR', 'duvidas-cadar', 'Tire suas duvidas sobre o concurso CADAR', 'HelpCircle', 'orange', 3, 'general'),
  ('Duvidas CAFAR', 'duvidas-cafar', 'Tire suas duvidas sobre o concurso CAFAR', 'HelpCircle', 'rose', 4, 'general'),
  ('Material de Estudo', 'material-estudo', 'Compartilhe materiais e recursos de estudo', 'BookOpen', 'purple', 5, 'general'),
  ('Off-topic', 'off-topic', 'Conversas diversas fora do tema de estudos', 'Coffee', 'gray', 6, 'general')
ON CONFLICT DO NOTHING;
