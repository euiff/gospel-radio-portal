import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categoria/$slug")({ component: CategoryPage });

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: category } = useQuery({
    queryKey: ["cat", slug],
    queryFn: async () => (await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()).data,
  });
   const categoryId = category?.id;
   const { data: news } = useQuery({
     queryKey: ["cat-news", categoryId],
     enabled: !!categoryId,
     queryFn: async () => {
       const { data } = await supabase.from("news")
         .select("id,slug,title,excerpt,cover_image,published_at")
         .eq("category_id", categoryId!).eq("published", true)
         .order("published_at", { ascending: false });
       return data ?? [];
     },
   });
 
   return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Categoria</div>
        <h1 className="font-display text-5xl text-primary">{category?.name ?? slug}</h1>
        {category?.description && <p className="text-muted-foreground mt-2">{category.description}</p>}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(news ?? []).map((n: any) => (
          <Link key={n.id} to="/noticia/$slug" params={{ slug: n.slug }} className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-glow transition">
            {n.cover_image && <div className="aspect-[16/10] overflow-hidden"><img src={n.cover_image} alt={n.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" /></div>}
            <div className="p-5">
              <h3 className="font-display text-xl text-primary group-hover:text-accent transition">{n.title}</h3>
              {n.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.excerpt}</p>}
            </div>
          </Link>
        ))}
        {(!news || news.length === 0) && <p className="text-muted-foreground col-span-full text-center py-20">Nenhuma notícia nesta categoria ainda.</p>}
      </div>
    </main>
  );
}
