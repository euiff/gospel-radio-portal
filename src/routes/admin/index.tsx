import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Eye, Calendar, Radio } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [news, published, programs, views] = await Promise.all([
        supabase.from("news").select("id", { count: "exact", head: true }),
        supabase.from("news").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase.from("news").select("views"),
      ]);
      const totalViews = (views.data ?? []).reduce((s, n: any) => s + (n.views ?? 0), 0);
      return { total: news.count ?? 0, published: published.count ?? 0, programs: programs.count ?? 0, views: totalViews };
    },
  });
  const cards = [
    { label: "Total de notícias", value: stats?.total ?? 0, icon: Newspaper, to: "/admin/noticias" },
    { label: "Publicadas", value: stats?.published ?? 0, icon: Eye, to: "/admin/noticias" },
    { label: "Visualizações", value: stats?.views ?? 0, icon: Eye, to: "/admin/noticias" },
    { label: "Programas", value: stats?.programs ?? 0, icon: Calendar, to: "/admin/programacao" },
  ];
  return (
    <div>
      <h1 className="font-display text-4xl text-primary mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Visão geral do seu portal e rádio.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-card border border-border rounded-xl p-5 hover:border-accent transition">
            <div className="flex items-center justify-between mb-3">
              <c.icon className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-display text-primary">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/noticias" className="bg-card border border-border rounded-xl p-6 hover:border-accent transition">
          <Newspaper className="w-6 h-6 text-accent mb-2" />
          <h3 className="font-display text-xl">Publicar uma notícia</h3>
          <p className="text-sm text-muted-foreground">Crie e gerencie o conteúdo do portal.</p>
        </Link>
        <Link to="/admin/radio" className="bg-card border border-border rounded-xl p-6 hover:border-accent transition">
          <Radio className="w-6 h-6 text-accent mb-2" />
          <h3 className="font-display text-xl">Configurar a rádio</h3>
          <p className="text-sm text-muted-foreground">URL do stream, nome e redes sociais.</p>
        </Link>
      </div>
    </div>
  );
}
