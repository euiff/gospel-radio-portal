import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import type { NewsItem } from "@/hooks/use-site-data";

export function NewsTicker({ items }: { items: NewsItem[] }) {
  if (!items || items.length === 0) return null;
  const loop = [...items, ...items];
  return (
    <div className="bg-deep text-white border-y border-gold/20 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <div className="shrink-0 flex items-center gap-2 py-3 pr-4 border-r border-white/10">
          <Newspaper className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-gold">Últimas</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-12 animate-marquee whitespace-nowrap py-3">
            {loop.map((n, i) => (
              <Link
                key={`${n.id}-${i}`}
                to="/noticia/$slug"
                params={{ slug: n.slug }}
                className="text-sm text-white/90 hover:text-gold transition inline-flex items-center gap-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {n.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}