-- Cleanup: Remove unused tables
-- These tables were created but never implemented in the UI or queried by any service

-- Group study features (never implemented)
DROP TABLE IF EXISTS group_session_participants CASCADE;
DROP TABLE IF EXISTS group_study_sessions CASCADE;

-- Flashcard collaboration features (never implemented)
DROP TABLE IF EXISTS flashcard_set_collaborators CASCADE;
DROP TABLE IF EXISTS flashcard_sets CASCADE;
DROP TABLE IF EXISTS flashcard_flashcard_tags CASCADE;
DROP TABLE IF EXISTS flashcard_flashcard_categories CASCADE;
DROP TABLE IF EXISTS flashcard_tags CASCADE;
DROP TABLE IF EXISTS flashcard_categories CASCADE;

-- User favorites (never queried)
DROP TABLE IF EXISTS user_favorite_flashcards CASCADE;

-- Redundant tables
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS class_topics CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
