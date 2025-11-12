-- Add category to achievements table
ALTER TABLE public.achievements
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

COMMENT ON COLUMN public.achievements.category IS 'Category of the achievement (general, study, quiz, essay, social)';

-- Add status to classes table  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_status') THEN
        CREATE TYPE public.class_status AS ENUM ('active', 'inactive', 'archived');
    END IF;
END$$;

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS status public.class_status DEFAULT 'active';

COMMENT ON COLUMN public.classes.status IS 'Current status of the class (active, inactive, archived)';

-- Enhance user_progress to include global gamification stats
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

COMMENT ON COLUMN public.user_progress.total_xp IS 'Total experience points earned by the user';
COMMENT ON COLUMN public.user_progress.level IS 'Current level of the user based on XP';
COMMENT ON COLUMN public.user_progress.current_streak_days IS 'Current study streak in days';
COMMENT ON COLUMN public.user_progress.longest_streak_days IS 'Longest study streak achieved';
COMMENT ON COLUMN public.user_progress.last_activity_date IS 'Last date the user had any activity';

-- Create a view for class statistics
CREATE OR REPLACE VIEW public.class_stats AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.status,
    c.start_date,
    c.end_date,
    c.class_type,
    c.created_at,
    COUNT(DISTINCT sc.user_id) as student_count,
    COUNT(DISTINCT cfp.feature_key) as enabled_features_count
FROM public.classes c
LEFT JOIN public.student_classes sc ON c.id = sc.class_id
LEFT JOIN public.class_feature_permissions cfp ON c.id = cfp.class_id
GROUP BY c.id;

COMMENT ON VIEW public.class_stats IS 'Aggregated statistics for each class';

-- Create a view for user ranking
CREATE OR REPLACE VIEW public.user_ranking AS
SELECT 
    up.user_id,
    u.email,
    p.first_name,
    p.last_name,
    COALESCE(up.total_xp, 0) as total_xp,
    COALESCE(up.level, 1) as level,
    COUNT(DISTINCT ua.achievement_id) as achievements_count,
    ROW_NUMBER() OVER (ORDER BY COALESCE(up.total_xp, 0) DESC) as position
FROM auth.users u
INNER JOIN public.users p ON u.id = p.id
LEFT JOIN public.user_progress up ON u.id = up.user_id
LEFT JOIN public.user_achievements ua ON u.id = ua.user_id
WHERE p.role = 'student'
GROUP BY up.user_id, u.email, p.first_name, p.last_name, up.total_xp, up.level
ORDER BY total_xp DESC;

COMMENT ON VIEW public.user_ranking IS 'Global ranking of students by XP';

-- Create a function to get achievement unlock count
CREATE OR REPLACE FUNCTION public.get_achievement_unlock_count(achievement_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_achievements
        WHERE achievement_id = achievement_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_achievement_unlock_count IS 'Returns the number of times an achievement has been unlocked';

-- Enable RLS policies for new features
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_feature_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can read, only admins can write)
CREATE POLICY "Anyone can view achievements"
    ON public.achievements FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage achievements"
    ON public.achievements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (true); -- Will be controlled by backend logic

-- Grant permissions
GRANT SELECT ON public.class_stats TO authenticated;
GRANT SELECT ON public.user_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_achievement_unlock_count TO authenticated;

