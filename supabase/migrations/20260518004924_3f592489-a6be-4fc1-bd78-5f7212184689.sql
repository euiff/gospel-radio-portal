-- Add logo_settings column to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_settings JSONB DEFAULT '{"mobile": "small", "desktop": "medium"}'::jsonb;
