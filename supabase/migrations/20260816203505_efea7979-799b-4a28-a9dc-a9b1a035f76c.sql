ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS heading_font text,
  ADD COLUMN IF NOT EXISTS body_font text,
  ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'system';