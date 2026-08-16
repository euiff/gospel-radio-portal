import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio as RadioIcon,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Music,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useRadio } from "@/lib/radio-context";
import { AudioVisualizer } from "./AudioVisualizer";
import { RecentTracks } from "./RecentTracks";
import { toast } from "sonner";

export function RadioPlayer() {
  const { settings, nowPlaying, nowPlayingInfo, voxStatus, isPlaying, volume, toggle, setVolume } =
    useRadio();
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);

  if (!settings) return null;

  const toggleMute = () => {
    if (muted) {
      setVolume(0.8);
      setMuted(false);
    } else {
      setVolume(0);
      setMuted(true);
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const data = { title: settings.station_name, text: `Ouvindo ${nowPlaying || settings.station_name} agora! 🎵`, url };
    if (navigator.share) {
      try { await navigator.share(data); } catch {}
    } else {
      navigator.clipboard.writeText(`${data.text} ${url}`);
      toast.success("Link copiado!");
    }
  };

  return (
    <>
      {/* Expanded drawer */}
      {expanded && (
        <div className="fixed bottom-[88px] md:bottom-[92px] left-0 right-0 z-40 animate-in slide-in-from-bottom-5">
          <div className="container mx-auto px-4">
            <div className="bg-card rounded-2xl shadow-premium border border-border p-5 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-accent" />
                <h4 className="font-display text-lg text-primary">Últimas Tocadas</h4>
              </div>
              <RecentTracks limit={8} />
            </div>
          </div>
        </div>
      )}

      {/* Sticky player bar */}
      <div
        role="complementary"
        aria-label="Player de Rádio"
        className="fixed bottom-0 left-0 right-0 z-50 gradient-deep text-white border-t border-gold/30 shadow-premium"
      >
        <div className="container mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-3 md:gap-4">
          {/* Vinyl cover */}
          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gold/40 bg-deep-darker ${isPlaying ? "animate-spin-slow" : ""}`}
            >
              {nowPlayingInfo?.coverUrl || settings.logo_url ? (
                <img src={nowPlayingInfo?.coverUrl || settings.logo_url || ""} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-emerald flex items-center justify-center">
                  <RadioIcon className="w-6 h-6 text-white/70" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-deep-darker border border-gold/60" />
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={toggle}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            aria-pressed={isPlaying}
            className="shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-full gradient-gold text-gold-foreground flex items-center justify-center hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 transition shadow-glow"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 md:w-7 md:h-7" />
            ) : (
              <Play className="w-5 h-5 md:w-7 md:h-7 ml-0.5" />
            )}
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-gold font-bold">
              {isPlaying ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  Ao vivo
                  <AudioVisualizer active className="ml-1 h-3" bars={4} />
                </>
              ) : (
                "Pronto para tocar"
              )}
            </div>
            <div className="font-display text-sm md:text-lg lg:text-xl truncate leading-tight mt-0.5">
              {nowPlaying || settings.station_name}
            </div>
            <div className="text-[10px] md:text-xs text-white/60 truncate">
              {nowPlaying
                ? `${nowPlayingInfo?.stationTitle || settings.station_name}${nowPlayingInfo?.listeners !== null && nowPlayingInfo?.listeners !== undefined ? ` • ${nowPlayingInfo.listeners} ouvintes` : ""}`
                : settings.tagline}
            </div>
            {voxStatus.stale && nowPlaying && (
              <div
                title={voxStatus.error ?? undefined}
                className="mt-0.5 text-[9px] md:text-[10px] text-white/40 truncate"
              >
                Dados em tempo real indisponíveis — exibindo último título válido
              </div>
            )}
          </div>

          {/* Desktop volume */}
          <div className="hidden md:flex items-center gap-2 w-28 lg:w-40 px-3 border-l border-white/10">
            <button
              onClick={toggleMute}
              aria-label={muted ? "Ativar som" : "Silenciar"}
              className="text-white/70 hover:text-gold transition"
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="w-full accent-gold cursor-pointer h-1 bg-white/10 rounded-lg appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Volume"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={share}
              aria-label="Compartilhar"
              className="hidden sm:inline-flex w-10 h-10 rounded-full bg-white/5 hover:bg-gold hover:text-gold-foreground items-center justify-center transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="hidden sm:inline-flex w-10 h-10 rounded-full bg-white/5 hover:bg-emerald-500 items-center justify-center transition"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Recolher" : "Ver últimas tocadas"}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gold/10 hover:bg-gold hover:text-gold-foreground text-gold flex items-center justify-center transition border border-gold/30"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isPlaying && (
          <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent w-full opacity-70 animate-pulse" />
        )}
      </div>
    </>
  );
}
