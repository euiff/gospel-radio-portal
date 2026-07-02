import { cn } from "@/lib/utils";

export function AudioVisualizer({ active, className, bars = 5 }: { active?: boolean; className?: string; bars?: number }) {
  return (
    <div className={cn("flex items-end gap-[3px] h-6", className)} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-gold",
            active ? "eq-bar h-full" : "h-1 opacity-40",
          )}
          style={active ? { animationDelay: `${i * 0.12}s` } : undefined}
        />
      ))}
    </div>
  );
}