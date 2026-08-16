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
import { type NowPlayingInfo } from "@/lib/radio-metadata";
import { fetchVoxNowPlaying, type VoxIssue } from "@/lib/vox";

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
  vox_token?: string | null;
  vox_field_map?: unknown;
  vox_last_valid?: unknown;
  vox_auto_highlight?: boolean;
}

export interface VoxStatus {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  error: string | null;
  issues: VoxIssue[];
  stale: boolean;
  consecutiveFailures: number;
}

const FALLBACK_KEY = "radio:last-valid-now-playing";

function readStoredFallback(): NowPlayingInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as NowPlayingInfo) : null;
  } catch {
    return null;
  }
}

interface RadioCtx {
  settings: RadioSettings | null;
  nowPlaying: string | null;
  nowPlayingInfo: NowPlayingInfo | null;
  voxStatus: VoxStatus;
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
  const [voxStatus, setVoxStatus] = useState<VoxStatus>({
    lastSuccessAt: null,
    lastAttemptAt: null,
    error: null,
    issues: [],
    stale: false,
    consecutiveFailures: 0,
  });
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

    let cancelled = false;

    // Fallback imediato: último destaque válido salvo (local ou pelo admin).
    const stored = readStoredFallback();
    const saved = settings?.vox_last_valid as NowPlayingInfo | null | undefined;
    const seed = stored ?? (saved && (saved as NowPlayingInfo).title ? saved : null);
    if (seed) {
      setNowPlayingInfo((prev) => prev ?? seed);
      setNowPlaying((prev) => prev ?? seed.title);
    }

    const fetchNowPlaying = async () => {
      const result = await fetchVoxNowPlaying(metadataUrl, {
        token: settings?.vox_token ?? null,
        fieldMap: settings?.vox_field_map,
      });
      if (cancelled) return;

      if (result.ok && result.info) {
        setNowPlayingInfo(result.info);
        setNowPlaying(result.info.title);
        try {
          window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(result.info));
        } catch {
          /* storage indisponível */
        }
        setVoxStatus({
          lastSuccessAt: result.fetchedAt,
          lastAttemptAt: result.fetchedAt,
          error: null,
          issues: result.issues,
          stale: false,
          consecutiveFailures: 0,
        });
      } else {
        setVoxStatus((prev) => ({
          lastSuccessAt: prev.lastSuccessAt,
          lastAttemptAt: result.fetchedAt,
          error: result.error ?? "Dados em tempo real indisponíveis.",
          issues: result.issues,
          stale: true,
          consecutiveFailures: prev.consecutiveFailures + 1,
        }));
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    settings?.api_now_playing,
    settings?.vox_token,
    settings?.vox_field_map,
    settings?.vox_last_valid,
  ]);

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
      voxStatus,
      isPlaying,
      volume,
      toggle,
      setVolume: setVolumeState,
      reload,
    }),
    [settings, nowPlaying, nowPlayingInfo, voxStatus, isPlaying, volume],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRadio = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRadio outside provider");
  return c;
};
