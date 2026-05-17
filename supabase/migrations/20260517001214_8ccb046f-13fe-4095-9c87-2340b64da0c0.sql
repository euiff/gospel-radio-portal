
-- Roles
create type public.app_role as enum ('admin', 'editor', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

-- News
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  published boolean not null default false,
  featured boolean not null default false,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.news enable row level security;
create index news_published_idx on public.news(published, published_at desc);
create index news_category_idx on public.news(category_id);

-- Radio settings (single row, singleton)
create table public.radio_settings (
  id uuid primary key default gen_random_uuid(),
  station_name text not null default 'Rádio Gospel',
  tagline text default 'A música que toca o coração',
  stream_url text not null default 'https://stream.zeno.fm/0r0xa792kwzuv',
  logo_url text,
  cover_url text,
  now_playing_api text,
  whatsapp text,
  instagram text,
  facebook text,
  youtube text,
  updated_at timestamptz not null default now()
);
alter table public.radio_settings enable row level security;

-- Site settings
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Portal Gospel',
  site_description text default 'Notícias, música e fé',
  primary_color text default '#1e3a8a',
  accent_color text default '#d4a84c',
  hero_title text default 'A Rádio Gospel que renova sua fé',
  hero_subtitle text default 'Notícias, louvor e palavra 24 horas',
  footer_text text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

-- Programs / schedule
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host text,
  description text,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  cover_image text,
  created_at timestamptz not null default now()
);
alter table public.programs enable row level security;

-- Banners (carousel/ads)
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  position text not null default 'hero',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.banners enable row level security;

-- Seed singletons
insert into public.radio_settings (id) values (gen_random_uuid());
insert into public.site_settings (id) values (gen_random_uuid());

-- Seed categories
insert into public.categories (name, slug, description) values
  ('Notícias', 'noticias', 'Últimas notícias do mundo gospel'),
  ('Música', 'musica', 'Lançamentos e clipes'),
  ('Eventos', 'eventos', 'Shows, congressos e cultos'),
  ('Devocional', 'devocional', 'Palavra e reflexão'),
  ('Entrevistas', 'entrevistas', 'Bate-papo com artistas');

-- RLS policies
-- Profiles
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- Categories
create policy "Categories public read" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.has_role(auth.uid(), 'admin'));

-- News
create policy "Published news public read" on public.news for select using (published = true or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Admins/editors manage news" on public.news for all using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- Radio settings
create policy "Radio settings public read" on public.radio_settings for select using (true);
create policy "Admins update radio settings" on public.radio_settings for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert radio settings" on public.radio_settings for insert with check (public.has_role(auth.uid(), 'admin'));

-- Site settings
create policy "Site settings public read" on public.site_settings for select using (true);
create policy "Admins update site settings" on public.site_settings for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert site settings" on public.site_settings for insert with check (public.has_role(auth.uid(), 'admin'));

-- Programs
create policy "Programs public read" on public.programs for select using (true);
create policy "Admins manage programs" on public.programs for all using (public.has_role(auth.uid(), 'admin'));

-- Banners
create policy "Banners public read" on public.banners for select using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage banners" on public.banners for all using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger news_updated_at before update on public.news for each row execute function public.tg_set_updated_at();
create trigger radio_settings_updated_at before update on public.radio_settings for each row execute function public.tg_set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
