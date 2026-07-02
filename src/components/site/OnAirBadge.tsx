import { Radio } from "lucide-react";

export function OnAirBadge({ label = "AO VIVO" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/95 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-md animate-gold-pulse">
      <Radio className="w-3 h-3" />
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {label}
    </span>
  );
}