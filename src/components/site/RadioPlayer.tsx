 import { Play, Pause, Volume2, Radio as RadioIcon, MessageCircle, Instagram, Facebook, Youtube, Music } from "lucide-react";
import { useRadio } from "@/lib/radio-context";

export function RadioPlayer() {
   const { settings, nowPlaying, isPlaying, volume, toggle, setVolume } = useRadio();
  if (!settings) return null;

  return (
    <div className="sticky top-0 z-50 gradient-deep text-white border-b border-gold/30 shadow-glow">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="shrink-0 w-12 h-12 rounded-full gradient-gold text-gold-foreground flex items-center justify-center hover:scale-105 transition shadow-glow"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
            <RadioIcon className="w-3 h-3" />
            {isPlaying ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Ao vivo</span> : "Pronto para tocar"}
          </div>
           <div className="font-display text-lg md:text-xl truncate">
             {nowPlaying ? (
               <span className="flex items-center gap-2">
                 <Music className="w-4 h-4 text-gold animate-bounce" />
                 {nowPlaying}
               </span>
             ) : (
               settings.station_name
             )}
           </div>
           <div className="text-xs text-white/70 truncate hidden sm:block">
             {nowPlaying ? settings.station_name : settings.tagline}
           </div>
        </div>

        <div className="hidden md:flex items-center gap-2 w-40">
          <Volume2 className="w-4 h-4 text-white/70" />
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-[oklch(0.78_0.13_80)]"
            aria-label="Volume"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition"><MessageCircle className="w-4 h-4" /></a>}
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition"><Instagram className="w-4 h-4" /></a>}
          {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition"><Facebook className="w-4 h-4" /></a>}
          {settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition"><Youtube className="w-4 h-4" /></a>}
        </div>
      </div>
    </div>
  );
}
