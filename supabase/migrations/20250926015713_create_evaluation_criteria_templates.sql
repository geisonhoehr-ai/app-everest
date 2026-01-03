-- Create a table to store reusable templates for essay evaluation criteria.
CREATE TABLE IF NOT EXISTS public.evaluation_criteria_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria JSONB NOT NULL, -- Stores the detailed criteria structure as JSON
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to the essay_prompts table to link to a criteria template.
-- This makes it easy to apply a standard set of criteria to a new prompt.
ALTER TABLE public.essay_prompts
ADD COLUMN IF NOT EXISTS criteria_template_id UUID REFERENCES public.evaluation_criteria_templates(id) ON DELETE SET NULL;

-- Create a trigger to automatically update the 'updated_at' timestamp on template changes.
CREATE OR REPLACE FUNCTION public.handle_evaluation_criteria_templates_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_evaluation_criteria_templates_update
BEFORE UPDATE ON public.evaluation_criteria_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_evaluation_criteria_templates_update();
