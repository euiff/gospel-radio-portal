
## Visão

Transformar o portal numa **rádio gospel premium** com identidade Emerald Prestige (verde esmeralda profundo + dourado antigo + creme), tipografia DM Serif Display / Fira Sans, e uma camada real de interação ouvinte↔rádio (player sticky, top músicas, shoutbox ao vivo, quiz bíblico).

---

## 1. Design system (Emerald Prestige Gospel)

Atualizar `src/styles.css` com tokens semânticos:
- `--background` creme quente `oklch(0.98 0.01 90)` / dark esmeralda profundo
- `--primary` esmeralda `#0d7a5f`, `--primary-glow` `#14a37a`
- `--gold` `#c9a84c`, `--gold-foreground` `#1a1a1a`
- Gradientes: `--gradient-hero` (esmeralda→dourado), `--gradient-gold`, `--gradient-onair` (dourado pulsante)
- Sombras: `--shadow-premium`, `--shadow-glow-emerald`
- Fontes carregadas via `<link>` no `__root.tsx`: DM Serif Display + Fira Sans

## 2. Redesign visual

**Header** (`src/components/site/Header.tsx`)
- Barra superior fina em esmeralda escuro com data/hora, "AO VIVO", CTA WhatsApp
- Header principal creme com logo grande, nav serif dourado no hover, indicador de programa no ar
- Menu mobile com drawer premium

**Hero / Home** (`src/routes/index.tsx`)
- Hero split: à esquerda tagline em DM Serif enorme + "No Ar Agora" com badge pulsante dourado + capa do programa + CTAs (Ouvir, Pedir Música, WhatsApp)
- À direita: card do player grande com visualizer animado (barras CSS) + histórico das últimas músicas
- Faixa de manchetes rolante (marquee) abaixo do hero
- Grid editorial: notícia destaque + 6 laterais em estilo revista
- Seção "Top da Semana" (ranking votação)
- Faixa de programação do dia horizontal com scroll
- Shoutbox ao vivo + Quiz do dia lado a lado
- Mural de oração + Pedidos de música
- CTA para app / redes sociais em faixa dourada

**Footer** — três colunas premium com logo, redes sociais, contato, badge "Transmitindo 24/7".

**RadioPlayer sticky** (`src/components/site/RadioPlayer.tsx`)
- Barra fixa no bottom em todas as páginas (desktop + mobile)
- Capa girando (vinyl), título atual, artista, barras visualizer, botão play grande dourado, volume, share, favoritar
- Expansível para modo "full" com histórico das últimas 10 músicas

## 3. Novas funcionalidades de interação

### 3.1 Histórico de músicas tocadas
- Tabela `played_songs` (id, title, artist, played_at, cover_url)
- Server function que faz poll da `api_now_playing` a cada 30s e insere quando muda
- Componente `RecentTracks` no player expandido e na home

### 3.2 Top músicas + votação semanal
- Tabelas `top_songs` (curadoria admin) + `song_votes` (user_id, song_id, week)
- Componente `TopChart` na home com ranking Top 10, botão votar (1 voto/semana/usuário)
- Página `/top-musicas` completa

### 3.3 Shoutbox ao vivo
- Tabela `shoutbox_messages` (id, user_id, name, message, created_at, approved)
- Realtime via Supabase channels
- Componente sticky na home + página `/aovivo`
- Moderação no admin

### 3.4 Quiz bíblico
- Tabelas `quiz_questions` (question, options[], correct_index, active) + `quiz_answers`
- Card diário na home com pergunta + 4 opções + feedback + ranking
- Admin CRUD em `/admin/quiz`

## 4. Admin
- Novas páginas: `/admin/top-musicas`, `/admin/shoutbox` (moderar), `/admin/quiz`
- Sidebar atualizada

---

## Detalhes técnicos

**Migrations (uma única migration):**
```sql
CREATE TABLE public.played_songs (...);  -- + GRANTs + RLS público leitura
CREATE TABLE public.top_songs (...);
CREATE TABLE public.song_votes (...);    -- unique (user_id, week_start)
CREATE TABLE public.shoutbox_messages (...); -- RLS: authenticated insert, todos leem approved=true
CREATE TABLE public.quiz_questions (...);
CREATE TABLE public.quiz_answers (...);
ALTER PUBLICATION supabase_realtime ADD TABLE public.shoutbox_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.played_songs;
```

**Server functions:** `src/lib/interactions.functions.ts`
- `voteSong` (requireSupabaseAuth, valida 1/semana)
- `submitQuizAnswer`, `postShoutMessage`

**Componentes novos:**
- `src/components/site/StickyPlayer.tsx` (substitui/complementa AudioPlayer)
- `src/components/site/RecentTracks.tsx`
- `src/components/site/TopChart.tsx`
- `src/components/site/Shoutbox.tsx` (realtime)
- `src/components/site/QuizCard.tsx`
- `src/components/site/NewsTicker.tsx` (marquee manchetes)
- `src/components/site/OnAirBadge.tsx`
- `src/components/site/AudioVisualizer.tsx`

**Preserva:** rotas atuais, RLS existente, SEO/OG, JSON-LD, SongRequestForm, PrayerMural, ScheduleDisplay, autoplay do player.

---

## Escopo desta rodada

Como o escopo é grande, entrego em **uma rodada única e coesa**:
1. Design tokens + fontes
2. Migrations das 6 tabelas
3. Header + Footer + Hero + Home redesign
4. StickyPlayer com visualizer e histórico
5. Shoutbox realtime + TopChart + QuizCard (versão leitor; admin CRUD fica para próxima rodada se aprovado)

**Fora do escopo desta rodada** (posso fazer depois se pedir):
- Painéis admin para quiz/shoutbox/top-musicas (uso seeds e moderação via banco por enquanto)
- Notificações push
- Alô do ouvinte (gravação de áudio)

Confirma que posso implementar?
