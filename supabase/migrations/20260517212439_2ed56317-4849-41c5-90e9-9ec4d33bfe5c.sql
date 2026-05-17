ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS navigation_menu JSONB DEFAULT '[
  {"to": "/", "label": "Início"},
  {"to": "/categoria/noticias", "label": "Notícias"},
  {"to": "/categoria/musica", "label": "Música"},
  {"to": "/categoria/eventos", "label": "Eventos"},
  {"to": "/categoria/devocional", "label": "Devocional"},
  {"to": "/programacao", "label": "Programação"}
]'::jsonb;