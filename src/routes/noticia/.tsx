import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";

export const Route = createFileRoute("/noticia/$slug")({ component: NewsPage });

function NewsPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data } = await supabase.from("news")
        .select("*,category:categories(name,slug)")
        .eq("slug", slug).eq("published", true).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (data?.id) supabase.rpc as any; // noop
    if (data?.id) supabase.from("news").update({ views: (data.views ?? 0) + 1 }).eq("id", data.id).then(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading) return <div className="container mx-auto py-20 text-center">Carregando…</div>;
  if (!data) return <div className="container mx-auto py-20 text-center">Notícia não encontrada.</div>;

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-6"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
      {data.category && <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">{(data.category as any).name}</div>}
      <h1 className="font-display text-4xl md:text-5xl text-primary mb-4">{data.title}</h1>
      {data.excerpt && <p className="text-lg text-muted-foreground mb-6">{data.excerpt}</p>}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
        <Calendar className="w-4 h-4" />{data.published_at && new Date(data.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
      </div>
      {data.cover_image && <img src={data.cover_image} alt={data.title} className="w-full rounded-xl mb-8 aspect-[16/9] object-cover" />}
      <div className="prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">{data.content}</div>
    </article>
  );
}
