 import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 import { Newspaper, Eye, Calendar, Radio, Settings } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function AdminCardLink({ to, children }: { to: string; children: React.ReactNode }) {
  const className = "group bg-card border border-border rounded-2xl p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all duration-300";

  if (to === "/admin/noticias") return <Link to="/admin/noticias" className={className}>{children}</Link>;
  if (to === "/admin/programacao") return <Link to="/admin/programacao" className={className}>{children}</Link>;
  return <Link to="/admin" className={className}>{children}</Link>;
}

 function Dashboard() {
   const nav = useNavigate();
   const { data: stats, isLoading } = useQuery({
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
 
   if (isLoading) return <div className="p-10 text-center text-muted-foreground">Carregando estatísticas...</div>;
 
  const cards = [
    { label: "Total de notícias", value: stats?.total ?? 0, icon: Newspaper, to: "/admin/noticias" },
    { label: "Publicadas", value: stats?.published ?? 0, icon: Eye, to: "/admin/noticias" },
    { label: "Visualizações", value: stats?.views ?? 0, icon: Eye, to: "/admin/noticias" },
    { label: "Programas", value: stats?.programs ?? 0, icon: Calendar, to: "/admin/programacao" },
  ];
  return (
    <div>
       <div className="flex flex-col gap-8">
         <header>
           <h1 className="font-display text-4xl text-primary leading-tight">Olá, Administrador!</h1>
           <p className="text-muted-foreground mt-2 max-w-2xl">Bem-vindo ao seu painel. Aqui você tem controle total sobre as notícias, a rádio e a aparência do seu portal.</p>
         </header>
 
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {cards.map((c) => (
              <AdminCardLink key={c.label} to={c.to}>
               <div className="flex items-center justify-between mb-4">
                 <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                   <c.icon className="w-5 h-5" />
                 </div>
               </div>
               <div className="text-4xl font-display text-primary font-bold">{c.value}</div>
               <div className="text-sm font-medium text-muted-foreground mt-1">{c.label}</div>
              </AdminCardLink>
           ))}
         </div>
 
         <section>
           <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
             <span className="w-1.5 h-6 bg-accent rounded-full" />
             Ações Rápidas
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Link to="/admin/noticias" className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-8 hover:border-accent transition-all group shadow-sm">
               <div className="p-4 rounded-2xl bg-primary text-primary-foreground w-fit mb-6 group-hover:scale-110 transition-transform">
                 <Newspaper className="w-7 h-7" />
               </div>
               <h3 className="font-display text-2xl font-bold mb-2">Publicar Notícia</h3>
               <p className="text-muted-foreground text-sm leading-relaxed mb-6">Comece a preencher seu portal com conteúdo relevante para seus ouvintes.</p>
               <div className="inline-flex items-center text-accent font-bold text-sm uppercase tracking-wider">
                 Começar agora →
               </div>
             </Link>
 
             <Link to="/admin/radio" className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-8 hover:border-accent transition-all group shadow-sm">
               <div className="p-4 rounded-2xl bg-accent text-accent-foreground w-fit mb-6 group-hover:scale-110 transition-transform">
                 <Radio className="w-7 h-7" />
               </div>
               <h3 className="font-display text-2xl font-bold mb-2">Configurar Player</h3>
               <p className="text-muted-foreground text-sm leading-relaxed mb-6">Altere o link da rádio ao vivo, nome da estação e links de redes sociais.</p>
               <div className="inline-flex items-center text-accent font-bold text-sm uppercase tracking-wider">
                 Configurar →
               </div>
             </Link>
 
             <Link to="/admin/site" className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-8 hover:border-accent transition-all group shadow-sm">
               <div className="p-4 rounded-2xl bg-deep text-white w-fit mb-6 group-hover:scale-110 transition-transform">
                 <Settings className="w-7 h-7" />
               </div>
               <h3 className="font-display text-2xl font-bold mb-2">Estilo do Site</h3>
               <p className="text-muted-foreground text-sm leading-relaxed mb-6">Mude as cores principais, títulos do portal e textos do rodapé.</p>
               <div className="inline-flex items-center text-accent font-bold text-sm uppercase tracking-wider">
                 Personalizar →
               </div>
             </Link>
           </div>
         </section>
 
         {stats?.total === 0 && (
           <div className="bg-accent/5 border border-accent/20 rounded-2xl p-10 text-center">
             <div className="max-w-md mx-auto">
               <h3 className="text-xl font-bold text-primary mb-2">Parece que você está começando!</h3>
               <p className="text-muted-foreground mb-6">Seu portal ainda não possui notícias. Que tal criar a primeira agora mesmo para ver como fica?</p>
               <button 
                 onClick={() => nav({ to: "/admin/noticias" })}
                 className="px-8 py-4 rounded-xl gradient-gold text-gold-foreground font-bold shadow-lg hover:scale-105 active:scale-95 transition"
               >
                 Criar Minha Primeira Notícia
               </button>
             </div>
           </div>
         )}
       </div>
    </div>
  );
}
