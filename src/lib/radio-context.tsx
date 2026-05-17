import { createContext, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface RadioSettings {
  id: string;
  station_name: string;
  tagline: string | null;
  stream_url: string;
  api_now_playing: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
}

interface RadioCtx {
  settings: RadioSettings | null;
  nowPlaying: string | null;
  isPlaying: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (v: number) => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<RadioCtx | null>(null);

export const radioSettingsQueryOptions = {
  queryKey: ["radio-settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("radio_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data as RadioSettings | null;
  },
  staleTime: 1000 * 60 * 60, // Settings don't change often
};

export function RadioProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: settings = null } = useQuery(radioSettingsQueryOptions);
  
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ["radio-settings"] });
  };

  useEffect(() => {
    const streamUrl = settings?.api_now_playing;
    if (!streamUrl) {
      setNowPlaying(null);
      return;
    }

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(streamUrl);
        const json = await res.json();
        const title = json.title || json.song || json.now_playing?.song?.title || json.current || json.text;
        if (title) setNowPlaying(title);
      } catch (e) {
        console.debug("Now playing fetch failed", e);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [settings?.api_now_playing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
    }
    if (settings?.stream_url) audioRef.current.src = settings.stream_url;
  }, [settings?.stream_url]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !settings?.stream_url) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else {
      a.src = settings.stream_url + (settings.stream_url.includes("?") ? "&" : "?") + "t=" + Date.now();
      a.play().then(() => setIsPlaying(true)).catch((e) => { console.error(e); setIsPlaying(false); });
    }
  };

  const value = useMemo(() => ({
    settings,
    nowPlaying,
    isPlaying,
    volume,
    toggle,
    setVolume: setVolumeState,
    reload,
  }), [settings, nowPlaying, isPlaying, volume]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export const useRadio = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRadio outside provider");
  return c;
};
