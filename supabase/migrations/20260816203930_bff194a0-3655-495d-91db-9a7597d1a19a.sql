ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS pwa_settings jsonb NOT NULL DEFAULT '{
    "name": "Rádio Gospel",
    "short_name": "Rádio",
    "description": "App oficial da rádio gospel: player ao vivo, notícias, Top 10, pedidos de música e interação com o ouvinte.",
    "background_color": "#04281f",
    "theme_color": "#04281f",
    "display": "standalone",
    "orientation": "portrait",
    "start_url": "/",
    "icon_url": "",
    "asset_version": 1
  }'::jsonb;