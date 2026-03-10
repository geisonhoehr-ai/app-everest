# Community Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic forum with a professional community platform (feed + spaces + rich content + gamification + moderation).

**Architecture:** Supabase migration renames forum tables → community tables + adds new tables. New service layer (`communityService.ts`). New pages under `/comunidade` routes. Rich text via markdown + DOMPurify. File uploads via Supabase Storage bucket. XP integration via existing `addXP()`.

**Tech Stack:** React 19, TypeScript, Supabase (DB + Storage + RLS), React Router v6, Shadcn UI, DOMPurify, date-fns, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-10-community-redesign.md`

---

## File Structure

### New Files
- `supabase/migrations/20260310000000_community_platform.sql` — DB migration
- `src/services/communityService.ts` — All community data operations
- `src/pages/community/CommunityPage.tsx` — Main feed page
- `src/pages/community/SpaceFeedPage.tsx` — Single space feed
- `src/pages/community/PostDetailPage.tsx` — Post + comments detail
- `src/pages/community/ModerationPage.tsx` — Admin moderation queue
- `src/components/community/CommunityLayout.tsx` — Layout with spaces sidebar
- `src/components/community/SpacesSidebar.tsx` — Spaces navigation
- `src/components/community/PostCard.tsx` — Post card in feed
- `src/components/community/PostFeed.tsx` — Infinite feed with filters
- `src/components/community/PostEditor.tsx` — Rich editor (markdown + attachments + polls + mentions)
- `src/components/community/CommentThread.tsx` — Threaded comments
- `src/components/community/CommentEditor.tsx` — Comment input with attachments
- `src/components/community/ReactionBar.tsx` — Emoji reactions
- `src/components/community/AttachmentUploader.tsx` — Drag & drop file upload
- `src/components/community/AttachmentPreview.tsx` — Render attachments (images, docs, video, audio)
- `src/components/community/PollCreator.tsx` — Create poll in editor
- `src/components/community/PollDisplay.tsx` — Render poll with voting
- `src/components/community/MentionPicker.tsx` — @user autocomplete
- `src/components/community/LinkPreview.tsx` — URL preview card
- `src/components/community/ReportDialog.tsx` — Report content modal
- `src/components/community/MuteUserDialog.tsx` — Mute user modal
- `src/components/community/PostActions.tsx` — Dropdown menu (pin, lock, move, delete)
- `src/components/community/BestAnswerBadge.tsx` — Badge component
- `src/components/community/OfficialBadge.tsx` — Badge component
- `src/components/community/WordFilterWarning.tsx` — Client-side word filter check

### Modified Files
- `src/App.tsx` — Add community routes, redirect /forum
- `src/components/UnifiedSidebar.tsx` — Update href /forum → /comunidade
- `src/services/forumService.ts` — DELETE (replaced by communityService)
- `src/pages/Forum.tsx` — DELETE (replaced by CommunityPage)
- `src/pages/ForumTopic.tsx` — DELETE (replaced by PostDetailPage)
- `src/lib/supabase/types.ts` — Regenerate after migration

---

## Chunk 1: Database Migration + Service Foundation

### Task 1: Supabase Migration

**Files:**
- Create: `supabase/migrations/20260310000000_community_platform.sql`

- [ ] **Step 1: Write migration SQL**

```sql
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
  USING (bucket_id = 'community-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

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

-- 10. Update renamed FK constraint names for clarity
-- (constraints still work, just renaming for documentation)
```

- [ ] **Step 2: Run migration on Supabase**

```bash
cd app-everest-main
npx supabase db push --linked
```

Expected: Migration applied, tables renamed and created.

- [ ] **Step 3: Regenerate Supabase types**

```bash
npx supabase gen types typescript --linked > src/lib/supabase/types.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260310000000_community_platform.sql src/lib/supabase/types.ts
git commit -m "feat(community): add database migration - rename forum tables, add community tables, RLS, storage bucket"
```

---

### Task 2: Community Service

**Files:**
- Create: `src/services/communityService.ts`

- [ ] **Step 1: Create communityService.ts with types and space/post CRUD**

The service follows the same pattern as `courseService.ts`: import supabase + logger, export object with async methods. See spec for all types.

Key interfaces: `CommunitySpace`, `CommunityPost`, `CommunityComment`, `CommunityReaction`, `CommunityAttachment`, `CommunityReport`, `CommunityMute`, `PollOption`, `PollVote`

Key methods:
- `getSpaces()` — list non-archived spaces ordered by `order`
- `getSpaceBySlug(slug)` — single space
- `getPosts(spaceId?, sort?, type?, search?, page?)` — paginated feed with filters
- `getPostById(id)` — single post with author, space, attachments, reactions, poll
- `createPost(data)` — insert post + award XP via `addXP(userId, 5, 'community_post', postId)`
- `updatePost(id, data)` — update post
- `deletePost(id)` — delete post
- `getComments(postId)` — threaded comments with authors, attachments, reactions
- `createComment(data)` — insert + award XP via `addXP(userId, 3, 'community_comment', commentId)`
- `toggleReaction(userId, targetType, targetId, emoji)` — upsert/delete + update likes_count
- `markBestAnswer(commentId, postId, resolvedBy)` — set is_best_answer + is_resolved + award XP 15
- `markOfficialAnswer(commentId)` — set is_official + award XP 10
- `uploadAttachment(file, spaceId, postId)` — upload to Storage bucket, return URL
- `deleteAttachment(id, filePath)` — delete from Storage + DB
- `createReport(data)` — insert report
- `getReports(status?)` — list reports for moderation
- `updateReport(id, status, reviewedBy)` — update report
- `muteUser(userId, mutedBy, reason, duration)` — insert mute
- `isUserMuted(userId)` — check active mute
- `getWordFilter()` — list blocked words
- `createPoll(postId, options)` — insert poll options
- `votePoll(optionId, userId)` — insert vote + increment count
- `getPollResults(postId)` — options with counts + user's vote
- `searchUsers(query)` — for @mention autocomplete (search user_profiles by name)

- [ ] **Step 2: Commit**

```bash
git add src/services/communityService.ts
git commit -m "feat(community): add communityService with full CRUD, reactions, polls, moderation, XP integration"
```

---

## Chunk 2: Core UI Components

### Task 3: Community Layout + Spaces Sidebar

**Files:**
- Create: `src/components/community/CommunityLayout.tsx`
- Create: `src/components/community/SpacesSidebar.tsx`

- [ ] **Step 1: Create SpacesSidebar**

Fetches spaces via `communityService.getSpaces()`. Renders vertical list of spaces with icon + name + color dot. Active state based on current route param `:spaceSlug`. "Todos" option at top links to `/comunidade`. Show unread indicator (optional future).

Uses: `Card`, `Button`, `cn`, `useLocation`, `Link`, lucide icons dynamically mapped from space.icon string.

- [ ] **Step 2: Create CommunityLayout**

Wrapper component with flex layout:
- Left: `SpacesSidebar` (hidden on mobile, sheet on mobile via `Sheet` component)
- Right: `<Outlet />` for page content
- Mobile: hamburger button to open spaces sheet

- [ ] **Step 3: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add CommunityLayout and SpacesSidebar"
```

---

### Task 4: PostCard + PostFeed

**Files:**
- Create: `src/components/community/PostCard.tsx`
- Create: `src/components/community/PostFeed.tsx`
- Create: `src/components/community/ReactionBar.tsx`
- Create: `src/components/community/AttachmentPreview.tsx`
- Create: `src/components/community/PollDisplay.tsx`
- Create: `src/components/community/BestAnswerBadge.tsx`
- Create: `src/components/community/OfficialBadge.tsx`
- Create: `src/components/community/LinkPreview.tsx`

- [ ] **Step 1: Create ReactionBar**

Row of emoji buttons (heart, fire, clap, thinking, rocket, eyes). Shows count per emoji. Highlights if current user reacted. Calls `communityService.toggleReaction()` on click.

- [ ] **Step 2: Create AttachmentPreview**

Renders attachments based on `file_type`:
- `image` → thumbnail with lightbox on click
- `document` → file icon + name + size + download link
- `video` → HTML5 video player (compact)
- `audio` → HTML5 audio player

- [ ] **Step 3: Create PollDisplay**

Shows poll options with vote counts. User clicks to vote (calls `communityService.votePoll()`). Shows percentages after voting. Highlights user's choice.

- [ ] **Step 4: Create BestAnswerBadge and OfficialBadge**

Small badge components with green checkmark / blue shield icon.

- [ ] **Step 5: Create LinkPreview**

Renders `link_preview` jsonb as card with title, description, image, domain.

- [ ] **Step 6: Create PostCard**

Card showing: author avatar + name + role badge (Professor/Admin), timestamp, space badge, post title, content preview (truncated to 3 lines), attachments preview (thumbnails), poll (if type=poll), reaction bar, comment count, pinned/locked indicators.

Clicking card navigates to `/comunidade/post/:postId`.

Follows clean pattern: `Card` with `border-border shadow-sm`, consistent spacing.

- [ ] **Step 7: Create PostFeed**

Receives `spaceId?` prop. Fetches posts via `communityService.getPosts()`. Renders:
- Sort tabs: Recentes | Populares | Sem Resposta
- Filter buttons: Todos | Texto | Perguntas | Enquetes
- Search input
- List of `PostCard` components
- "Carregar mais" button for pagination (20 per page)
- Empty state with illustration

- [ ] **Step 8: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add PostCard, PostFeed, ReactionBar, AttachmentPreview, PollDisplay, badges, LinkPreview"
```

---

### Task 5: Post Editor

**Files:**
- Create: `src/components/community/PostEditor.tsx`
- Create: `src/components/community/AttachmentUploader.tsx`
- Create: `src/components/community/PollCreator.tsx`
- Create: `src/components/community/MentionPicker.tsx`

- [ ] **Step 1: Create AttachmentUploader**

Drag & drop zone + file picker button. Validates file type and size limits (10MB images, 25MB docs/videos, 5MB audio). Shows upload progress. Calls `communityService.uploadAttachment()`. Shows preview of uploaded files with remove button. Max 5 files per post.

- [ ] **Step 2: Create PollCreator**

Toggle to add poll. Shows 2-6 text inputs for options. Add/remove option buttons. Minimum 2 options required.

- [ ] **Step 3: Create MentionPicker**

Triggered by typing `@` in textarea. Autocomplete dropdown searching users via `communityService.searchUsers()`. Inserts `@FirstName LastName` into content. Stores user IDs in `mentions` array.

- [ ] **Step 4: Create PostEditor**

Full editor component used in CommunityPage (new post dialog) and PostDetailPage (editing). Contains:
- Title input
- Space selector (dropdown of spaces)
- Type selector (text/question/poll)
- Content textarea with markdown toolbar (bold, italic, list, code block, math/LaTeX, link)
- AttachmentUploader below textarea
- PollCreator (shown if type=poll)
- MentionPicker integrated
- Submit button calls `communityService.createPost()` then refreshes feed
- Word filter check on submit (client-side warning via `communityService.getWordFilter()`)

Uses `ResponsiveDialog` for modal on desktop, full page on mobile.

- [ ] **Step 5: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add PostEditor, AttachmentUploader, PollCreator, MentionPicker"
```

---

### Task 6: Comment Thread + Editor

**Files:**
- Create: `src/components/community/CommentThread.tsx`
- Create: `src/components/community/CommentEditor.tsx`

- [ ] **Step 1: Create CommentEditor**

Textarea with markdown support + attachment uploader (max 3). Submit button. Shows author avatar. Check mute status before allowing submit.

- [ ] **Step 2: Create CommentThread**

Fetches comments via `communityService.getComments(postId)`. Renders:
- Top-level comments with author info, content (rendered markdown + DOMPurify), attachments, ReactionBar, timestamp
- Threaded replies (1 level) indented under parent
- "Responder" button on each comment toggles inline CommentEditor
- BestAnswerBadge / OfficialBadge on marked comments
- Admin/teacher actions: "Marcar Melhor Resposta", "Resposta Oficial"

- [ ] **Step 3: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add CommentThread and CommentEditor with threading and badges"
```

---

## Chunk 3: Pages + Routes + Moderation

### Task 7: Community Pages

**Files:**
- Create: `src/pages/community/CommunityPage.tsx`
- Create: `src/pages/community/SpaceFeedPage.tsx`
- Create: `src/pages/community/PostDetailPage.tsx`

- [ ] **Step 1: Create CommunityPage (main feed)**

Route: `/comunidade`

Structure (follows clean pattern like MyCoursesPage):
```
<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-bold text-foreground">Comunidade</h1>
    <p className="text-sm text-muted-foreground mt-1">Interaja e tire suas duvidas</p>
  </div>
  <div className="flex gap-6">
    <SpacesSidebar />  {/* hidden on mobile */}
    <div className="flex-1">
      <PostFeed />
    </div>
  </div>
</div>
```

Has floating "+" button to open PostEditor dialog. Mobile: sheet for spaces.

- [ ] **Step 2: Create SpaceFeedPage**

Route: `/comunidade/:spaceSlug`

Same structure as CommunityPage but shows space header (name, description, member count) and passes `spaceId` to `PostFeed`.

- [ ] **Step 3: Create PostDetailPage**

Route: `/comunidade/post/:postId`

Structure:
- Back button to feed
- Full post content (rendered markdown via DOMPurify)
- Attachments (full size)
- Poll (if applicable)
- ReactionBar
- PostActions dropdown (for admin/teacher/author)
- CommentThread
- CommentEditor at bottom

- [ ] **Step 4: Commit**

```bash
git add src/pages/community/
git commit -m "feat(community): add CommunityPage, SpaceFeedPage, PostDetailPage"
```

---

### Task 8: Moderation Page + Components

**Files:**
- Create: `src/pages/community/ModerationPage.tsx`
- Create: `src/components/community/ReportDialog.tsx`
- Create: `src/components/community/MuteUserDialog.tsx`
- Create: `src/components/community/PostActions.tsx`
- Create: `src/components/community/WordFilterWarning.tsx`

- [ ] **Step 1: Create ReportDialog**

Modal with reason selector (spam/inappropriate/harassment/other) + description textarea. Submit calls `communityService.createReport()`.

- [ ] **Step 2: Create MuteUserDialog**

Modal with duration selector (1h, 6h, 24h, 7d, 30d) + reason input. Submit calls `communityService.muteUser()`.

- [ ] **Step 3: Create PostActions**

Dropdown menu (using Shadcn `DropdownMenu`):
- Author: Edit, Delete
- Teacher/Admin: Pin/Unpin, Lock/Unlock, Mark Best Answer, Official Answer, Move to Space, Mute User, Delete
- Everyone: Report

- [ ] **Step 4: Create WordFilterWarning**

Client-side check before post submit. Shows warning toast if blocked words detected. Does NOT prevent submit (just warns).

- [ ] **Step 5: Create ModerationPage**

Route: `/comunidade/moderacao` (admin/teacher only)

Structure:
- Header with pending reports count
- Filter tabs: Pendentes | Revisados | Todos
- Report cards showing: reported content preview, reporter, reason, date
- Actions per report: Dispensar, Remover Conteudo, Silenciar Autor

- [ ] **Step 6: Commit**

```bash
git add src/pages/community/ModerationPage.tsx src/components/community/
git commit -m "feat(community): add moderation page, report dialog, mute dialog, post actions, word filter"
```

---

### Task 9: Router + Sidebar + Cleanup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/UnifiedSidebar.tsx`
- Delete: `src/pages/Forum.tsx`
- Delete: `src/pages/ForumTopic.tsx`
- Delete: `src/services/forumService.ts`

- [ ] **Step 1: Add community routes to App.tsx**

Add lazy imports:
```typescript
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage'))
const SpaceFeedPage = lazy(() => import('@/pages/community/SpaceFeedPage'))
const PostDetailPage = lazy(() => import('@/pages/community/PostDetailPage'))
const ModerationPage = lazy(() => import('@/pages/community/ModerationPage'))
```

Replace forum routes (lines 381-382) with:
```typescript
<Route path="/comunidade" element={<CommunityPage />} />
<Route path="/comunidade/:spaceSlug" element={<SpaceFeedPage />} />
<Route path="/comunidade/post/:postId" element={<PostDetailPage />} />
<Route path="/comunidade/moderacao" element={<ModerationPage />} />
{/* Redirect old forum URLs */}
<Route path="/forum" element={<Navigate to="/comunidade" replace />} />
<Route path="/forum/:topicId" element={<Navigate to="/comunidade" replace />} />
```

- [ ] **Step 2: Update UnifiedSidebar**

Change line 129:
```typescript
// FROM:
{ label: 'Comunidade', href: '/forum', icon: MessageSquare },
// TO:
{ label: 'Comunidade', href: '/comunidade', icon: MessageSquare },
```

- [ ] **Step 3: Delete old forum files**

Delete:
- `src/pages/Forum.tsx`
- `src/pages/ForumTopic.tsx`
- `src/services/forumService.ts`

Remove lazy imports for ForumPage and ForumTopicPage from App.tsx.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/UnifiedSidebar.tsx
git rm src/pages/Forum.tsx src/pages/ForumTopic.tsx src/services/forumService.ts
git commit -m "feat(community): wire routes, update sidebar, remove old forum files"
```

---

## Chunk 4: Polish + Admin

### Task 10: Admin Spaces Management

**Files:**
- Add space management to existing admin settings or create section in ModerationPage

- [ ] **Step 1: Add spaces CRUD to ModerationPage**

Tab or section in ModerationPage for managing spaces:
- List spaces with drag-to-reorder
- Create new space (name, slug, description, icon, color, type)
- Edit space
- Archive/unarchive space
- Word filter management (add/remove words)

- [ ] **Step 2: Commit**

```bash
git add src/pages/community/ModerationPage.tsx
git commit -m "feat(community): add spaces and word filter management to moderation page"
```

---

### Task 11: XP Events + Achievements

**Files:**
- Modify: `src/services/communityService.ts` (already has XP calls from Task 2)

- [ ] **Step 1: Verify XP integration**

Ensure all XP events fire correctly:
- `createPost` → `addXP(userId, 5, 'community_post', postId)`
- `createComment` → `addXP(userId, 3, 'community_comment', commentId)`
- `markBestAnswer` → `addXP(commentAuthorId, 15, 'community_best_answer', commentId)`
- `markOfficialAnswer` → `addXP(commentAuthorId, 10, 'community_official_answer', commentId)`

- [ ] **Step 2: Add daily first participation bonus**

In `createPost` and `createComment`, check if user has posted today. If not, award +2 bonus XP for first daily participation.

- [ ] **Step 3: Commit**

```bash
git add src/services/communityService.ts
git commit -m "feat(community): verify XP integration and add daily participation bonus"
```

---

### Task 12: Final Polish

- [ ] **Step 1: Update CommandPalette.tsx** — add community navigation items (Comunidade, Moderacao)
- [ ] **Step 2: Test all routes** — verify navigation, loading states, empty states
- [ ] **Step 3: Test mobile** — responsive layout, sheets, touch interactions
- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(community): final polish - command palette, responsive fixes"
```
