-- Add fields for teacher annotations on student essays
-- annotated_text_html: Rich text with teacher highlights, underlines, color marks on student's text
-- annotation_image_url: Canvas annotation overlay saved as image (for handwritten/PDF essays)

ALTER TABLE public.essays ADD COLUMN IF NOT EXISTS annotated_text_html TEXT;
ALTER TABLE public.essays ADD COLUMN IF NOT EXISTS annotation_image_url TEXT;
