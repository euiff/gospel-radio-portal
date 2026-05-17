-- Remove redundant table
DROP TABLE IF EXISTS public.programming;

-- Remove redundant column in radio_settings (keep api_now_playing which is used in code)
ALTER TABLE public.radio_settings DROP COLUMN IF EXISTS now_playing_api;

-- Ensure programs table has everything needed
-- (Checking existing columns in programs: cover_image, day_of_week, description, end_time, host, name, start_time)
-- Add comments or indexes if helpful
CREATE INDEX IF NOT EXISTS idx_programs_day_time ON public.programs (day_of_week, start_time);
