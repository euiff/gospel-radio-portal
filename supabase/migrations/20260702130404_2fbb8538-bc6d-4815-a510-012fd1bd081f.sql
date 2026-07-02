
-- ============ played_songs ============
CREATE TABLE public.played_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  cover_url text,
  played_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.played_songs TO anon, authenticated;
GRANT ALL ON public.played_songs TO service_role;
ALTER TABLE public.played_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_played" ON public.played_songs FOR SELECT USING (true);
CREATE INDEX played_songs_played_at_idx ON public.played_songs(played_at DESC);

-- ============ top_songs ============
CREATE TABLE public.top_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  cover_url text,
  youtube_url text,
  position int NOT NULL DEFAULT 0,
  votes int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.top_songs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.top_songs TO authenticated;
GRANT ALL ON public.top_songs TO service_role;
ALTER TABLE public.top_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_top" ON public.top_songs FOR SELECT USING (true);
CREATE POLICY "admin_manage_top" ON public.top_songs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER top_songs_updated BEFORE UPDATE ON public.top_songs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ song_votes ============
CREATE TABLE public.song_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.top_songs(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT ON public.song_votes TO authenticated;
GRANT ALL ON public.song_votes TO service_role;
ALTER TABLE public.song_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_votes_read" ON public.song_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_votes_insert" ON public.song_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ shoutbox_messages ============
CREATE TABLE public.shoutbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 240),
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shoutbox_messages TO anon, authenticated;
GRANT INSERT ON public.shoutbox_messages TO anon, authenticated;
GRANT UPDATE, DELETE ON public.shoutbox_messages TO authenticated;
GRANT ALL ON public.shoutbox_messages TO service_role;
ALTER TABLE public.shoutbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_approved" ON public.shoutbox_messages FOR SELECT USING (approved = true);
CREATE POLICY "public_insert_shout" ON public.shoutbox_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_manage_shout" ON public.shoutbox_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX shoutbox_created_idx ON public.shoutbox_messages(created_at DESC);

-- ============ quiz_questions ============
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  reference text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_quiz" ON public.quiz_questions FOR SELECT USING (active = true);
CREATE POLICY "admin_manage_quiz" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ quiz_answers ============
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  selected_index int NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_answers TO anon, authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_quiz_answer" ON public.quiz_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "read_quiz_stats" ON public.quiz_answers FOR SELECT USING (true);

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.shoutbox_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.played_songs;

-- ============ Seed quiz ============
INSERT INTO public.quiz_questions (question, options, correct_index, reference) VALUES
('Quem construiu a arca segundo o livro de Gênesis?', '["Moisés","Noé","Abraão","Davi"]', 1, 'Gênesis 6:14'),
('Em qual cidade Jesus nasceu?', '["Nazaré","Jerusalém","Belém","Cafarnaum"]', 2, 'Mateus 2:1'),
('Quantos livros tem o Novo Testamento?', '["27","39","66","12"]', 0, 'Cânon bíblico'),
('Qual apóstolo negou Jesus três vezes?', '["João","Judas","Pedro","Tiago"]', 2, 'Lucas 22:54-62'),
('Quem enfrentou o gigante Golias?', '["Sansão","Davi","Saul","Josué"]', 1, '1 Samuel 17');

-- ============ Seed top songs ============
INSERT INTO public.top_songs (title, artist, position, votes, cover_url) VALUES
('Lugar Secreto', 'Gabriela Rocha', 1, 0, null),
('Deus Não Falhará', 'Aline Barros', 2, 0, null),
('Ninguém Explica Deus', 'Preto no Branco', 3, 0, null),
('Oceanos', 'Ana Nóbrega', 4, 0, null),
('Reckless Love', 'Isaias Saad', 5, 0, null);
