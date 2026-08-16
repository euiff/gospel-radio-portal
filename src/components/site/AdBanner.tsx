import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AdBanner({ position, className }: { position: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ["banners", position],
    queryFn: async () =>
      (
        await supabase
          .from("banners")
          .select("id,title,image_url,link_url")
          .eq("position", position)
          .eq("active", true)
          .order("sort_order")
      ).data ?? [],
    staleTime: 1000 * 60 * 5,
  });

  if (!data || data.length === 0) return null;

  return (
    <div className={className}>
      <div className="container mx-auto px-4 space-y-3">
        {data.map((b) => {
          const img = (
            <img
              src={b.image_url}
              alt={b.title}
              loading="lazy"
              className="w-full rounded-2xl border border-border object-cover shadow-sm"
            />
          );
          return (
            <div key={b.id}>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Publicidade
              </span>
              {b.link_url ? (
                <a href={b.link_url} target="_blank" rel="noopener noreferrer sponsored">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
