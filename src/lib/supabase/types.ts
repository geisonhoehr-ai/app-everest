// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)'
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      audio_courses: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          thumbnail_url: string | null
          total_duration_seconds: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          thumbnail_url?: string | null
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          thumbnail_url?: string | null
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_audio_courses_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      audio_lessons: {
        Row: {
          audio_source_type:
            | Database['public']['Enums']['audio_source_provider']
            | null
          audio_source_url: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          is_preview: boolean
          module_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          audio_source_type?:
            | Database['public']['Enums']['audio_source_provider']
            | null
          audio_source_url: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_preview?: boolean
          module_id: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          audio_source_type?:
            | Database['public']['Enums']['audio_source_provider']
            | null
          audio_source_url?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_preview?: boolean
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_audio_lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'audio_modules'
            referencedColumns: ['id']
          },
        ]
      }
      audio_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          total_duration_seconds: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index: number
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_audio_modules_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'audio_courses'
            referencedColumns: ['id']
          },
        ]
      }
      audio_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_time_seconds: number
          id: string
          is_completed: boolean
          lesson_id: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_time_seconds: number
          id?: string
          is_completed?: boolean
          lesson_id: string
          progress_percentage: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_time_seconds?: number
          id?: string
          is_completed?: boolean
          lesson_id?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_audio_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'audio_lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_audio_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      calendar_events: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_type: Database['public']['Enums']['calendar_event_type']
          id: string
          related_entity_id: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type: Database['public']['Enums']['calendar_event_type']
          id?: string
          related_entity_id?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: Database['public']['Enums']['calendar_event_type']
          id?: string
          related_entity_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      class_feature_permissions: {
        Row: {
          class_id: string
          created_at: string
          feature_key: string
          id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          feature_key: string
          id?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          feature_key?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'class_feature_permissions_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      class_topics: {
        Row: {
          class_id: string
          created_at: string
          id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_class_topics_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_class_topics_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      classes: {
        Row: {
          class_type: Database['public']['Enums']['class_type']
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          teacher_id: string
          trial_duration_days: number | null
          trial_essay_submission_limit: number | null
          trial_flashcard_limit_per_day: number | null
          trial_quiz_limit_per_day: number | null
          updated_at: string
        }
        Insert: {
          class_type?: Database['public']['Enums']['class_type']
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          teacher_id: string
          trial_duration_days?: number | null
          trial_essay_submission_limit?: number | null
          trial_flashcard_limit_per_day?: number | null
          trial_quiz_limit_per_day?: number | null
          updated_at?: string
        }
        Update: {
          class_type?: Database['public']['Enums']['class_type']
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          teacher_id?: string
          trial_duration_days?: number | null
          trial_essay_submission_limit?: number | null
          trial_flashcard_limit_per_day?: number | null
          trial_quiz_limit_per_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
        ]
      }
      error_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      essay_annotations: {
        Row: {
          annotation_text: string
          created_at: string
          end_offset: number
          error_category_id: string | null
          essay_id: string
          id: string
          start_offset: number
          suggested_correction: string | null
          teacher_id: string | null
        }
        Insert: {
          annotation_text: string
          created_at?: string
          end_offset: number
          error_category_id?: string | null
          essay_id: string
          id?: string
          start_offset: number
          suggested_correction?: string | null
          teacher_id?: string | null
        }
        Update: {
          annotation_text?: string
          created_at?: string
          end_offset?: number
          error_category_id?: string | null
          essay_id?: string
          id?: string
          start_offset?: number
          suggested_correction?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_essay_annotations_error_category_id_fkey'
            columns: ['error_category_id']
            isOneToOne: false
            referencedRelation: 'error_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essay_annotations_essay_id_fkey'
            columns: ['essay_id']
            isOneToOne: false
            referencedRelation: 'essays'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essay_annotations_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      essay_prompts: {
        Row: {
          course_id: string | null
          created_at: string
          created_by_user_id: string | null
          criteria_template_id: string | null
          description: string
          end_date: string | null
          evaluation_criteria: Json
          id: string
          is_active: boolean | null
          start_date: string | null
          subject_id: string | null
          suggested_repertoire: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          criteria_template_id?: string | null
          description: string
          end_date?: string | null
          evaluation_criteria: Json
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          subject_id?: string | null
          suggested_repertoire?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          criteria_template_id?: string | null
          description?: string
          end_date?: string | null
          evaluation_criteria?: Json
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          subject_id?: string | null
          suggested_repertoire?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'essay_prompts_criteria_template_id_fkey'
            columns: ['criteria_template_id']
            isOneToOne: false
            referencedRelation: 'evaluation_criteria_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essay_prompts_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essay_prompts_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essay_prompts_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      essays: {
        Row: {
          ai_analysis: Json | null
          ai_suggested_grade: Json | null
          correction_date: string | null
          created_at: string
          final_grade: number | null
          id: string
          prompt_id: string
          status: Database['public']['Enums']['essay_status_enum'] | null
          student_id: string
          submission_date: string
          submission_text: string
          teacher_feedback_audio_url: string | null
          teacher_feedback_text: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_suggested_grade?: Json | null
          correction_date?: string | null
          created_at?: string
          final_grade?: number | null
          id?: string
          prompt_id: string
          status?: Database['public']['Enums']['essay_status_enum'] | null
          student_id: string
          submission_date?: string
          submission_text: string
          teacher_feedback_audio_url?: string | null
          teacher_feedback_text?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_suggested_grade?: Json | null
          correction_date?: string | null
          created_at?: string
          final_grade?: number | null
          id?: string
          prompt_id?: string
          status?: Database['public']['Enums']['essay_status_enum'] | null
          student_id?: string
          submission_date?: string
          submission_text?: string
          teacher_feedback_audio_url?: string | null
          teacher_feedback_text?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_essays_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'essay_prompts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essays_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_essays_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      evaluation_criteria_templates: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          criteria: Json
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          criteria: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_flashcard_categories: {
        Row: {
          category_id: string
          created_at: string
          flashcard_id: string
          id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          flashcard_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          flashcard_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_flashcard_flashcard_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'flashcard_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_flashcard_flashcard_categories_flashcard_id_fkey'
            columns: ['flashcard_id']
            isOneToOne: false
            referencedRelation: 'flashcards'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_flashcard_tags: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_flashcard_flashcard_tags_flashcard_id_fkey'
            columns: ['flashcard_id']
            isOneToOne: false
            referencedRelation: 'flashcards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_flashcard_flashcard_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'flashcard_tags'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_progress: {
        Row: {
          confidence_rating: number | null
          created_at: string
          ease_factor: number
          flashcard_id: string
          id: string
          interval_days: number
          last_reviewed_at: string
          next_review_at: string
          quality: number
          repetitions: number
          response_time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_rating?: number | null
          created_at?: string
          ease_factor?: number
          flashcard_id: string
          id?: string
          interval_days: number
          last_reviewed_at?: string
          next_review_at: string
          quality: number
          repetitions: number
          response_time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_rating?: number | null
          created_at?: string
          ease_factor?: number
          flashcard_id?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string
          next_review_at?: string
          quality?: number
          repetitions?: number
          response_time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_flashcard_progress_flashcard_id_fkey'
            columns: ['flashcard_id']
            isOneToOne: false
            referencedRelation: 'flashcards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_flashcard_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_session_history: {
        Row: {
          cards_reviewed: number | null
          correct_answers: number | null
          ended_at: string | null
          group_session_id: string | null
          id: string
          incorrect_answers: number | null
          session_mode: string
          started_at: string
          topic_id: string
          user_id: string
        }
        Insert: {
          cards_reviewed?: number | null
          correct_answers?: number | null
          ended_at?: string | null
          group_session_id?: string | null
          id?: string
          incorrect_answers?: number | null
          session_mode: string
          started_at?: string
          topic_id: string
          user_id: string
        }
        Update: {
          cards_reviewed?: number | null
          correct_answers?: number | null
          ended_at?: string | null
          group_session_id?: string | null
          id?: string
          incorrect_answers?: number | null
          session_mode?: string
          started_at?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcard_session_history_group_session_id_fkey'
            columns: ['group_session_id']
            isOneToOne: false
            referencedRelation: 'group_study_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flashcard_session_history_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_set_collaborators: {
        Row: {
          created_at: string
          id: string
          permission_level: Database['public']['Enums']['collaborator_permission']
          set_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_level?: Database['public']['Enums']['collaborator_permission']
          set_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_level?: Database['public']['Enums']['collaborator_permission']
          set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcard_set_collaborators_set_id_fkey'
            columns: ['set_id']
            isOneToOne: false
            referencedRelation: 'flashcard_sets'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_sets: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          created_by_user_id: string
          difficulty: number
          explanation: string | null
          external_resource_url: string | null
          flashcard_set_id: string | null
          id: string
          question: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by_user_id: string
          difficulty?: number
          explanation?: string | null
          external_resource_url?: string | null
          flashcard_set_id?: string | null
          id?: string
          question: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by_user_id?: string
          difficulty?: number
          explanation?: string | null
          external_resource_url?: string | null
          flashcard_set_id?: string | null
          id?: string
          question?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcards_flashcard_set_id_fkey'
            columns: ['flashcard_set_id']
            isOneToOne: false
            referencedRelation: 'flashcard_sets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_flashcards_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_flashcards_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      group_session_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          left_at: string | null
          score_in_session: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          score_in_session?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          score_in_session?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_session_participants_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'group_study_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      group_study_sessions: {
        Row: {
          created_at: string
          created_by_user_id: string
          ended_at: string | null
          flashcard_set_id: string | null
          id: string
          name: string | null
          started_at: string | null
          status: Database['public']['Enums']['session_status']
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          ended_at?: string | null
          flashcard_set_id?: string | null
          id?: string
          name?: string | null
          started_at?: string | null
          status?: Database['public']['Enums']['session_status']
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          ended_at?: string | null
          flashcard_set_id?: string | null
          id?: string
          name?: string | null
          started_at?: string | null
          status?: Database['public']['Enums']['session_status']
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_study_sessions_flashcard_set_id_fkey'
            columns: ['flashcard_set_id']
            isOneToOne: false
            referencedRelation: 'flashcard_sets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_study_sessions_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_attachments_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'video_lessons'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          answered_at: string
          created_at: string
          id: string
          is_correct: boolean
          quiz_attempt_id: string
          quiz_question_id: string
          updated_at: string
          user_answer: string | null
        }
        Insert: {
          answered_at?: string
          created_at?: string
          id?: string
          is_correct: boolean
          quiz_attempt_id: string
          quiz_question_id: string
          updated_at?: string
          user_answer?: string | null
        }
        Update: {
          answered_at?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          quiz_attempt_id?: string
          quiz_question_id?: string
          updated_at?: string
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_quiz_attempt_answers_quiz_attempt_id_fkey'
            columns: ['quiz_attempt_id']
            isOneToOne: false
            referencedRelation: 'quiz_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_quiz_attempt_answers_quiz_question_id_fkey'
            columns: ['quiz_question_id']
            isOneToOne: false
            referencedRelation: 'quiz_questions'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_date: string
          created_at: string
          duration_seconds: number | null
          id: string
          quiz_id: string
          score: number
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_date?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          quiz_id: string
          score: number
          total_questions: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_date?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_quiz_attempts_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_quiz_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          created_by_user_id: string | null
          explanation: string | null
          id: string
          options: Json | null
          points: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          created_by_user_id?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          created_by_user_id?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_quiz_questions_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          duration_minutes: number | null
          id: string
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_quizzes_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_quizzes_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      rpg_ranks: {
        Row: {
          created_at: string
          id: string
          max_xp: number
          min_xp: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_xp: number
          min_xp: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_xp?: number
          min_xp?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          activity_id: string | null
          activity_type: string
          created_at: string
          id: string
          recorded_at: string
          score_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          activity_type: string
          created_at?: string
          id?: string
          recorded_at?: string
          score_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          activity_type?: string
          created_at?: string
          id?: string
          recorded_at?: string
          score_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_scores_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_classes: {
        Row: {
          class_id: string
          created_at: string
          enrollment_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrollment_date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_student_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_student_classes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          enrollment_date: string
          id: string
          student_id_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_date: string
          id?: string
          student_id_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          id?: string
          student_id_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_students_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          category: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_subjects_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          department: string | null
          employee_id_number: string
          hire_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id_number: string
          hire_date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id_number?: string
          hire_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_teachers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          name: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          name: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          name?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_topics_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_topics_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_id: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_id: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
        ]
      }
      user_downloaded_audio_lessons: {
        Row: {
          created_at: string
          downloaded_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_user_downloaded_audio_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'audio_lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_user_downloaded_audio_lessons_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_favorite_flashcards: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_favorite_flashcards_flashcard_id_fkey'
            columns: ['flashcard_id']
            isOneToOne: false
            referencedRelation: 'flashcards'
            referencedColumns: ['id']
          },
        ]
      }
      user_incorrect_flashcards: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          last_incorrect_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          last_incorrect_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          last_incorrect_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_user_incorrect_flashcards_flashcard_id_fkey'
            columns: ['flashcard_id']
            isOneToOne: false
            referencedRelation: 'flashcards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_user_incorrect_flashcards_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_progress: {
        Row: {
          completion_percentage: number
          created_at: string
          id: string
          last_accessed_at: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percentage: number
          created_at?: string
          id?: string
          last_accessed_at?: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          id?: string
          last_accessed_at?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_user_progress_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_user_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          login_at: string
          session_token: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          login_at?: string
          session_token: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          login_at?: string
          session_token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_user_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_settings: {
        Row: {
          background_sound: string | null
          daily_study_goal_minutes: number | null
          dashboard_layout: Json | null
          flashcard_theme: string | null
          id: string
          pomodoro_break_minutes: number | null
          pomodoro_duration_minutes: number | null
          timer_alerts: boolean | null
          updated_at: string
          use_pomodoro: boolean | null
          user_id: string
        }
        Insert: {
          background_sound?: string | null
          daily_study_goal_minutes?: number | null
          dashboard_layout?: Json | null
          flashcard_theme?: string | null
          id?: string
          pomodoro_break_minutes?: number | null
          pomodoro_duration_minutes?: number | null
          timer_alerts?: boolean | null
          updated_at?: string
          use_pomodoro?: boolean | null
          user_id: string
        }
        Update: {
          background_sound?: string | null
          daily_study_goal_minutes?: number | null
          dashboard_layout?: Json | null
          flashcard_theme?: string | null
          id?: string
          pomodoro_break_minutes?: number | null
          pomodoro_duration_minutes?: number | null
          timer_alerts?: boolean | null
          updated_at?: string
          use_pomodoro?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string
          password_hash: string
          role: Database['public']['Enums']['user_role']
          subscription_end_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          password_hash: string
          role?: Database['public']['Enums']['user_role']
          subscription_end_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          password_hash?: string
          role?: Database['public']['Enums']['user_role']
          subscription_end_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      video_courses: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      video_lessons: {
        Row: {
          accompanying_pdf_attachment_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          is_preview: boolean | null
          module_id: string
          order_index: number
          quiz_id: string | null
          title: string
          updated_at: string
          video_source_id: string | null
          video_source_type:
            | Database['public']['Enums']['video_source_provider']
            | null
        }
        Insert: {
          accompanying_pdf_attachment_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_preview?: boolean | null
          module_id: string
          order_index?: number
          quiz_id?: string | null
          title: string
          updated_at?: string
          video_source_id?: string | null
          video_source_type?:
            | Database['public']['Enums']['video_source_provider']
            | null
        }
        Update: {
          accompanying_pdf_attachment_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_preview?: boolean | null
          module_id?: string
          order_index?: number
          quiz_id?: string | null
          title?: string
          updated_at?: string
          video_source_id?: string | null
          video_source_type?:
            | Database['public']['Enums']['video_source_provider']
            | null
        }
        Relationships: [
          {
            foreignKeyName: 'video_lessons_accompanying_pdf_attachment_id_fkey'
            columns: ['accompanying_pdf_attachment_id']
            isOneToOne: false
            referencedRelation: 'lesson_attachments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'video_lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'video_modules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'video_lessons_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
        ]
      }
      video_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          quiz_id: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number
          quiz_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          quiz_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'video_modules_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'video_courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'video_modules_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
        ]
      }
      video_progress: {
        Row: {
          created_at: string
          current_time_seconds: number
          id: string
          is_completed: boolean
          lesson_id: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_time_seconds?: number
          id?: string
          is_completed?: boolean
          lesson_id: string
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_time_seconds?: number
          id?: string
          is_completed?: boolean
          lesson_id?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'video_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'video_lessons'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_score: {
        Args: {
          p_activity_id?: string
          p_activity_type: string
          p_score_value: number
          p_user_id: string
        }
        Returns: string
      }
      get_question_performance_for_quiz: {
        Args: { p_quiz_id: string }
        Returns: {
          correct_answers: number
          incorrect_answers: number
          question_id: string
          question_text: string
        }[]
      }
      get_ranking_by_activity_type: {
        Args: { p_activity_type: string; p_limit?: number }
        Returns: {
          email: string
          first_name: string
          last_name: string
          rank_position: number
          total_xp_activity: number
          total_xp_general: number
          user_id: string
        }[]
      }
      get_user_rank_position: {
        Args: { p_user_id: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          rank_position: number
          role: Database['public']['Enums']['user_role']
          total_xp: number
          user_id: string
        }[]
      }
      get_user_ranking: {
        Args: { p_limit?: number }
        Returns: {
          email: string
          first_name: string
          last_name: string
          rank_position: number
          role: Database['public']['Enums']['user_role']
          total_xp: number
          user_id: string
        }[]
      }
      get_user_score_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          activity_id: string
          activity_type: string
          id: string
          recorded_at: string
          score_value: number
        }[]
      }
      get_xp_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_xp: number
          max_xp: number
          min_xp: number
          total_users: number
          total_xp_distributed: number
        }[]
      }
    }
    Enums: {
      audio_source_provider: 'panda_video_hls' | 'mp3_url'
      calendar_event_type:
        | 'SIMULATION'
        | 'ESSAY_DEADLINE'
        | 'LIVE_CLASS'
        | 'GENERAL'
      class_type: 'standard' | 'trial'
      collaborator_permission: 'viewer' | 'editor'
      essay_status_enum: 'draft' | 'correcting' | 'corrected'
      session_status: 'pending' | 'active' | 'completed'
      user_role: 'student' | 'teacher' | 'administrator'
      video_source_provider: 'panda_video' | 'youtube' | 'vimeo'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audio_source_provider: ['panda_video_hls', 'mp3_url'],
      calendar_event_type: [
        'SIMULATION',
        'ESSAY_DEADLINE',
        'LIVE_CLASS',
        'GENERAL',
      ],
      class_type: ['standard', 'trial'],
      collaborator_permission: ['viewer', 'editor'],
      essay_status_enum: ['draft', 'correcting', 'corrected'],
      session_status: ['pending', 'active', 'completed'],
      user_role: ['student', 'teacher', 'administrator'],
      video_source_provider: ['panda_video', 'youtube', 'vimeo'],
    },
  },
} as const
