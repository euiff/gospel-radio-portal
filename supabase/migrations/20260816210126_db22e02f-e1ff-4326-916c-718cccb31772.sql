ALTER TABLE public.radio_settings
  ADD COLUMN IF NOT EXISTS vox_token text,
  ADD COLUMN IF NOT EXISTS vox_field_map jsonb NOT NULL DEFAULT '{"title":"musica_atual","station":"titulo","cover":"capa_musica","listeners":"ouvintes_conectados","next":"proxima_musica","genre":"genero","bitrate":"plano_bitrate"}'::jsonb,
  ADD COLUMN IF NOT EXISTS vox_last_valid jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vox_auto_highlight boolean NOT NULL DEFAULT true;