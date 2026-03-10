# Community Platform Redesign

## Overview

Replace the basic forum (3 tables, text-only) with a professional community platform inspired by Hotmart/Circle/Discord. Hybrid model: feed-based posts within organized spaces, with rich content, gamification, and moderation.

## Data Model

### Renamed/Expanded Tables

**`forum_categories` -> `community_spaces`**
- Keep: `id`, `name`, `slug`, `created_at`
- Add: `icon` text, `color` text, `description` text, `order` int, `is_archived` bool default false, `created_by` uuid, `space_type` text default 'general' (general/course/event)

**`forum_topics` -> `community_posts`**
- Keep: `id`, `title`, `content` (now markdown), `user_id`, `is_pinned`, `is_locked`, `views`, `created_at`, `updated_at`
- Rename: `category_id` -> `space_id`
- Add: `type` text default 'text' (text/poll/question), `is_resolved` bool default false, `resolved_by` uuid, `resolved_at` timestamptz, `mentions` text[], `link_preview` jsonb, `xp_awarded` int default 0, `likes_count` int default 0, `comments_count` int default 0

**`forum_posts` -> `community_comments`**
- Keep: `id`, `content`, `user_id`, `created_at`, `updated_at`
- Rename: `topic_id` -> `post_id`
- Add: `parent_comment_id` uuid (1-level threading), `is_best_answer` bool default false, `is_official` bool default false, `likes_count` int default 0

### New Tables

**`community_reactions`**
- `id` uuid PK, `user_id` uuid FK, `target_type` text (post/comment), `target_id` uuid, `emoji` text, `created_at` timestamptz
- Unique: (user_id, target_type, target_id, emoji)

**`community_attachments`**
- `id` uuid PK, `post_id` uuid nullable, `comment_id` uuid nullable, `user_id` uuid FK, `file_name` text, `file_url` text, `file_type` text (image/document/video/audio), `file_size` int, `mime_type` text, `created_at` timestamptz

**`community_reports`**
- `id` uuid PK, `reporter_id` uuid FK, `target_type` text (post/comment/user), `target_id` uuid, `reason` text (spam/inappropriate/harassment/other), `description` text, `status` text default 'pending' (pending/reviewed/dismissed/actioned), `reviewed_by` uuid, `reviewed_at` timestamptz, `created_at` timestamptz

**`community_mutes`**
- `id` uuid PK, `user_id` uuid FK, `muted_by` uuid FK, `reason` text, `muted_until` timestamptz, `created_at` timestamptz

**`community_poll_options`**
- `id` uuid PK, `post_id` uuid FK, `text` text, `order` int, `votes_count` int default 0

**`community_poll_votes`**
- `id` uuid PK, `option_id` uuid FK, `user_id` uuid FK, `created_at` timestamptz
- Unique: (option_id, user_id)

**`community_word_filter`**
- `id` uuid PK, `word` text, `created_by` uuid FK, `created_at` timestamptz

## Supabase Storage

- Bucket: `community-attachments`
- Structure: `/{space_id}/{post_id}/{filename}`
- Limits: 10MB images, 25MB docs/videos, 5MB audio
- Allowed: image/*, application/pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, video/mp4, audio/mp3, audio/ogg
- Max: 5 attachments per post, 3 per comment
- RLS: authenticated upload, public read

## Frontend Architecture

### Routes

- `/comunidade` - CommunityPage (main feed)
- `/comunidade/:spaceSlug` - SpaceFeedPage
- `/comunidade/post/:postId` - PostDetailPage
- `/comunidade/moderacao` - ModerationQueuePage (admin/teacher)
- `/forum` -> redirect to `/comunidade`

### Components

**Layout:** CommunityLayout, SpacesSidebar, SpaceHeader
**Feed:** PostCard, PostFeed, PinnedPosts
**Post Detail:** PostContent, CommentThread, CommentEditor
**Editor:** RichTextEditor (markdown toolbar + code + LaTeX), AttachmentUploader (drag&drop to Storage), PollCreator, MentionPicker, LinkPreviewCard
**Interactions:** ReactionBar (emoji reactions), BestAnswerBadge, OfficialBadge
**Moderation:** ReportDialog, ModerationQueue, MuteUserDialog, PostActions

### Feed Filters

- Sort: Recentes (default), Populares, Sem resposta, Resolvidos
- Filter by: space, type (text/poll/question), author (my posts)
- Full-text search on title + content

## XP Integration

| Action | XP |
|--------|-----|
| Create post | +5 |
| Create comment | +3 |
| Receive best answer | +15 |
| Official answer (teacher) | +10 |
| Post gets 10+ reactions | +5 |
| First participation of the day | +2 |

Uses existing `xp_events` table with new event types.

## Moderation

- Report queue at `/comunidade/moderacao`
- Actions: dismiss, remove content, mute author, ban
- Word filter: client-side warning + server-side trigger
- Mute durations: 1h, 6h, 24h, 7d, 30d
- Admin analytics: posts per student, response time, most active spaces

## Spaces Management

- Admin creates/manages spaces (Settings)
- Teachers can create temporary spaces (event type)
- Students can only post within existing spaces
- Each space has: icon, color, description, order, archive capability
