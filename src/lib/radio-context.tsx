import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  normalizeMetadataUrl,
  parseNowPlaying,
  type NowPlayingInfo,
} from "@/lib/radio-metadata";

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
  nowPlayingInfo: NowPlayingInfo | null;
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
    const { data, error } = await supabase
      .from("radio_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as RadioSettings | null;
  },
  staleTime: 1000 * 60 * 60, // Settings don't change often
};

export function RadioProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: settings = null } = useQuery(radioSettingsQueryOptions);

  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [nowPlayingInfo, setNowPlayingInfo] = useState<NowPlayingInfo | null>(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const hasAttemptedAutoplay = useRef(false);
  const [volume, setVolumeState] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ["radio-settings"] });
  };

  useEffect(() => {
    const metadataUrl = settings?.api_now_playing;
    if (!metadataUrl) {
      setNowPlaying(null);
      setNowPlayingInfo(null);
      return;
    }

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(normalizeMetadataUrl(metadataUrl), { cache: "no-store" });
        if (!res.ok) throw new Error(`API respondeu com status ${res.status}`);
        const info = parseNowPlaying(await res.json());
        setNowPlayingInfo(info);
        setNowPlaying(info?.title ?? null);
      } catch (e) {
        console.warn("Não foi possível atualizar os dados da API da rádio", e);
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
       audioRef.current.preload = "auto";
     }
     if (settings?.stream_url) {
       audioRef.current.src = settings.stream_url;
       
       if (!hasAttemptedAutoplay.current) {
         hasAttemptedAutoplay.current = true;
         audioRef.current.play()
           .then(() => setIsPlaying(true))
           .catch((e) => {
             console.debug("Autoplay blocked by browser, waiting for user interaction.", e);
           });
       }
     }
   }, [settings?.stream_url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !settings?.stream_url) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.src =
        settings.stream_url + (settings.stream_url.includes("?") ? "&" : "?") + "t=" + Date.now();
      a.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error(e);
          setIsPlaying(false);
        });
    }
  };

  const value = useMemo(
    () => ({
      settings,
      nowPlaying,
      nowPlayingInfo,
      isPlaying,
      volume,
      toggle,
      setVolume: setVolumeState,
      reload,
    }),
    [settings, nowPlaying, nowPlayingInfo, isPlaying, volume],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRadio = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRadio outside provider");
  return c;
};
