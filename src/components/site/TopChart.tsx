import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Crown, Heart, Trophy, ExternalLink } from "lucide-react";

interface TopSong {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  youtube_url: string | null;
  position: number;
  votes: number;
}

function weekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start
  const s = new Date(d.setDate(diff));
  s.setHours(0, 0, 0, 0);
  return s.toISOString().slice(0, 10);
}

export function TopChart() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<TopSong[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("top_songs")
      .select("*")
      .eq("active", true)
      .order("votes", { ascending: false })
      .order("position", { ascending: true })
      .limit(10)
      .then(({ data }) => setSongs((data ?? []) as TopSong[]));

    if (user) {
      supabase
        .from("song_votes")
        .select("song_id")
        .eq("user_id", user.id)
        .eq("week_start", weekStart())
        .maybeSingle()
        .then(({ data }) => data && setVotedId(data.song_id));
    }
  }, [user]);

  const vote = async (songId: string) => {
    if (!user) {
      toast.error("Faça login para votar na sua favorita da semana.");
      return;
    }
    if (votedId) {
      toast.info("Você já votou esta semana. Volte no próximo domingo!");
      return;
    }
    setVoting(songId);
    const { error } = await supabase
      .from("song_votes")
      .insert({ user_id: user.id, song_id: songId, week_start: weekStart() });
    if (!error) {
      await supabase.rpc as any; // placeholder — increment via update below
      const song = songs.find((s) => s.id === songId);
      if (song) {
        await supabase
          .from("top_songs")
          .update({ votes: song.votes + 1 })
          .eq("id", songId);
        setSongs((prev) =>
          [...prev]
            .map((s) => (s.id === songId ? { ...s, votes: s.votes + 1 } : s))
            .sort((a, b) => b.votes - a.votes),
        );
      }
      setVotedId(songId);
      toast.success("Voto registrado! 🎉");
    } else {
      toast.error("Não foi possível votar agora.");
    }
    setVoting(null);
  };

  if (songs.length === 0) return null;

  const podium = songs.slice(0, 3);
  const rest = songs.slice(3);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-premium overflow-hidden">
      <div className="gradient-deep text-white px-5 py-4 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-gold" />
        <div className="flex-1">
          <h3 className="font-display text-2xl leading-tight">Top da Semana</h3>
          <p className="text-xs text-white/60">Vote na sua favorita — 1 voto por semana</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30">
        {podium.map((s, i) => (
          <div
            key={s.id}
            className={`text-center p-3 rounded-xl border ${i === 0 ? "border-gold bg-gold/5 shadow-glow" : "border-border bg-card"}`}
          >
            <div className="relative mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 overflow-hidden mb-2">
              {s.cover_url ? (
                <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-emerald" />
              )}
              {i === 0 && (
                <Crown className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-gold fill-gold drop-shadow" />
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-accent font-bold">
              #{i + 1}
            </div>
            <div className="text-xs font-bold text-primary line-clamp-1">{s.title}</div>
            <div className="text-[10px] text-muted-foreground line-clamp-1">{s.artist}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{s.votes} votos</div>
          </div>
        ))}
      </div>

      <ul className="divide-y divide-border">
        {rest.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition">
            <span className="w-8 text-center font-display text-lg text-muted-foreground">
              {i + 4}
            </span>
            <div className="w-10 h-10 rounded-md bg-primary/10 overflow-hidden shrink-0">
              {s.cover_url ? (
                <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-emerald" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-primary truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground truncate">{s.artist}</div>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">{s.votes} votos</span>
            {s.youtube_url && (
              <a
                href={s.youtube_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvir no YouTube"
                className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => vote(s.id)}
              disabled={!!voting || votedId === s.id}
              className={`shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs font-semibold transition ${
                votedId === s.id
                  ? "bg-gold/20 text-gold-foreground border border-gold"
                  : "border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${votedId === s.id ? "fill-current" : ""}`} />
              {votedId === s.id ? "Votado" : "Votar"}
            </button>
          </li>
        ))}
      </ul>

      <div className="p-3 text-center bg-muted/20 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Trophy className="w-3 h-3 text-gold" />
          Ranking reinicia todo domingo às 00h
        </div>
      </div>
    </div>
  );
}