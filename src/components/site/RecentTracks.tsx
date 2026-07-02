import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music2, Clock3 } from "lucide-react";
import { useRadio } from "@/lib/radio-context";

interface Played {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  played_at: string;
}

export function RecentTracks({ limit = 6 }: { limit?: number }) {
  const { nowPlaying } = useRadio();
  const [tracks, setTracks] = useState<Played[]>([]);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase
        .from("played_songs")
        .select("*")
        .order("played_at", { ascending: false })
        .limit(limit);
      setTracks((data ?? []) as Played[]);
    };
    fetchTracks();

    // capture nowPlaying periodically (client-side; simple and free)
    const cap = async () => {
      if (!nowPlaying) return;
      const [artist, title] = nowPlaying.includes(" - ")
        ? nowPlaying.split(" - ")
        : [null, nowPlaying];
      const { data: existing } = await supabase
        .from("played_songs")
        .select("id,title,artist")
        .order("played_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing && existing.title === (title || nowPlaying)) return;
      await supabase
        .from("played_songs")
        .insert({ title: title || nowPlaying, artist });
      fetchTracks();
    };
    const t = setInterval(cap, 45000);
    cap();

    const ch = supabase
      .channel("played-songs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "played_songs" },
        (payload) => setTracks((prev) => [payload.new as Played, ...prev].slice(0, limit)),
      )
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [limit, nowPlaying]);

  if (tracks.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-6">
        Aguardando as próximas músicas...
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tracks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2.5">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {t.cover_url ? (
              <img src={t.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music2 className="w-4 h-4 text-primary/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary truncate">{t.title}</div>
            {t.artist && <div className="text-xs text-muted-foreground truncate">{t.artist}</div>}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock3 className="w-3 h-3" />
            {new Date(t.played_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </li>
      ))}
    </ul>
  );
}