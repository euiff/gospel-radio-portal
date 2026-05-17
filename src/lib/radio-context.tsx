import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RadioSettings {
  id: string;
  station_name: string;
  tagline: string | null;
  stream_url: string;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
}

interface RadioCtx {
  settings: RadioSettings | null;
  isPlaying: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (v: number) => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<RadioCtx | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RadioSettings | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    const { data } = await supabase.from("radio_settings").select("*").limit(1).maybeSingle();
    if (data) setSettings(data as RadioSettings);
  };

  useEffect(() => { load(); }, []);

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

  return (
    <Ctx.Provider value={{ settings, isPlaying, volume, toggle, setVolume: setVolumeState, reload: load }}>
      {children}
    </Ctx.Provider>
  );
}

export const useRadio = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRadio outside provider");
  return c;
};
