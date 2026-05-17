 import { Play, Pause, Volume2, Radio as RadioIcon, MessageCircle, Instagram, Facebook, Youtube, Music } from "lucide-react";
import { useRadio } from "@/lib/radio-context";

 export function RadioPlayer() {
   const { settings, nowPlaying, isPlaying, volume, toggle, setVolume } = useRadio();
   if (!settings) return null;
 
   return (
     <div className="sticky top-0 z-50 gradient-deep text-white border-b border-gold/30 shadow-glow overflow-hidden">
       <div className="container mx-auto px-4 py-2 md:py-3 flex items-center gap-3 md:gap-4">
         <button
           onClick={toggle}
           aria-label={isPlaying ? "Pausar" : "Tocar"}
           className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full gradient-gold text-gold-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-glow z-10"
         >
           {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7" /> : <Play className="w-6 h-6 md:w-7 md:h-7 ml-0.5" />}
         </button>
 
         <div className="flex-1 min-w-0 py-1">
           <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-gold font-bold">
             <RadioIcon className="w-3 h-3" />
             {isPlaying ? (
               <span className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                 Ao vivo
               </span>
             ) : (
               "Pronto para tocar"
             )}
           </div>
           <div className="font-display text-base md:text-xl lg:text-2xl truncate leading-tight mt-0.5">
             {nowPlaying ? (
               <span className="flex items-center gap-2">
                 <Music className="w-4 h-4 text-gold animate-bounce shrink-0" />
                 {nowPlaying}
               </span>
             ) : (
               settings.station_name
             )}
           </div>
           <div className="text-[10px] md:text-xs text-white/60 truncate mt-0.5">
             {nowPlaying ? settings.station_name : settings.tagline}
           </div>
         </div>
 
         {/* Desktop Volume */}
         <div className="hidden md:flex items-center gap-3 w-32 lg:w-44 px-4 border-l border-white/10 ml-2">
           <Volume2 className="w-4 h-4 text-white/50 shrink-0" />
           <input
             type="range" min={0} max={1} step={0.05} value={volume}
             onChange={(e) => setVolume(parseFloat(e.target.value))}
             className="w-full accent-gold cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
             aria-label="Volume"
           />
         </div>
 
         {/* Social Icons - Hidden on small mobile, shown on tablet up */}
         <div className="hidden sm:flex items-center gap-1.5 md:gap-2 ml-auto">
           {settings.whatsapp && (
             <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" 
               className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition active:scale-90"
               title="WhatsApp">
               <MessageCircle className="w-5 h-5" />
             </a>
           )}
           {settings.instagram && (
             <a href={settings.instagram} target="_blank" rel="noreferrer" 
               className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition active:scale-90"
               title="Instagram">
               <Instagram className="w-5 h-5" />
             </a>
           )}
           <div className="hidden lg:contents">
             {settings.facebook && (
               <a href={settings.facebook} target="_blank" rel="noreferrer" 
                 className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition active:scale-90"
                 title="Facebook">
                 <Facebook className="w-5 h-5" />
               </a>
             )}
             {settings.youtube && (
               <a href={settings.youtube} target="_blank" rel="noreferrer" 
                 className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition active:scale-90"
                 title="YouTube">
                 <Youtube className="w-5 h-5" />
               </a>
             )}
           </div>
         </div>
       </div>
 
       {/* Progress simulation bar (just visual for flair) */}
       {isPlaying && (
         <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent w-full opacity-50 animate-pulse" />
       )}
     </div>
   );
 }
