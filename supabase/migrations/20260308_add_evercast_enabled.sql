ALTER TABLE video_courses
ADD COLUMN evercast_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN video_courses.evercast_enabled IS 'When true, this course appears in Evercast as audio content';
