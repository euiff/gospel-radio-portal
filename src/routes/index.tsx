import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-worship.jpg";
import { useRadio } from "@/lib/radio-context";
import { Play, Pause, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rádio Gospel — Música cristã ao vivo 24h" },
      { name: "description", content: "Acompanhe notícias gospel, lançamentos, devocional e ouça a rádio cristã ao vivo." },
    ],
  }),
  component: Home,
});

interface NewsItem {
  id: string; slug: string; title: string; excerpt: string | null;
  cover_image: string | null; published_at: string | null; featured: boolean;
  category: { name: string; slug: string } | null;
}

function Home() {
  const { settings, isPlaying, toggle } = useRadio();
  const { data: featured } = useQuery({
    queryKey: ["news-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("news")
        .select("id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)")
        .eq("published", true).eq("featured", true)
        .order("published_at", { ascending: false }).limit(1).maybeSingle();
      return data as NewsItem | null;
    },
  });
  const { data: latest } = useQuery({
    queryKey: ["news-latest"],
    queryFn: async () => {
      const { data } = await supabase.from("news")
        .select("id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)")
        .eq("published", true).order("published_at", { ascending: false }).limit(6);
      return (data ?? []) as NewsItem[];
    },
  });
  const { data: programs } = useQuery({
    queryKey: ["programs-today"],
    queryFn: async () => {
      const dow = new Date().getDay();
      const { data } = await supabase.from("programs").select("*").eq("day_of_week", dow).order("start_time");
      return data ?? [];
    },
  });

  return (
    <main>
       {/* HERO */}
       <section className="relative overflow-hidden min-h-[70vh] flex items-center">
         <div className="absolute inset-0 z-0">
           <img src={heroImg} alt="" className="w-full h-full object-cover" width={1600} height={900} />
           <div className="absolute inset-0 gradient-deep opacity-90" />
         </div>
         <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-white">
           <div className="max-w-3xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-gold/40 text-gold text-[10px] md:text-xs uppercase tracking-widest mb-6">
               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> No ar agora
             </div>
             <h1 className="font-display leading-[1.1] mb-6">
               A música que <span className="text-gradient-gold italic">renova</span> sua fé
             </h1>
             <p className="text-base md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
               {settings?.tagline ?? "Notícias, louvor e palavra 24 horas por dia, levando a mensagem de esperança para todo o mundo."}
             </p>
             <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={toggle} className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full gradient-gold text-gold-foreground font-bold shadow-glow hover:scale-105 active:scale-95 transition min-w-[200px]">
                 {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                 {isPlaying ? "Pausar rádio" : "Ouvir agora"}
               </button>
               <Link to="/categoria/noticias" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 backdrop-blur-sm transition active:scale-95 font-medium">
                 Explorar notícias <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
           </div>
         </div>
       </section>

       {/* FEATURED + LATEST */}
       <section className="container mx-auto px-4 py-12 md:py-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
           <div>
             <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">Informativo</div>
             <h2 className="font-display text-primary">Portal de Notícias</h2>
           </div>
           <Link to="/categoria/noticias" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent group transition">
             Ver todo o conteúdo 
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </Link>
         </div>
 
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
           {featured && (
             <Link to="/noticia/$slug" params={{ slug: featured.slug }} className="md:col-span-2 lg:row-span-2 group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-glow transition-all duration-300 flex flex-col">
               {featured.cover_image && (
                 <div className="aspect-[16/9] overflow-hidden">
                   <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>
               )}
               <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                 {featured.category && (
                   <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] uppercase tracking-wider font-bold mb-4">
                     {featured.category.name}
                   </span>
                 )}
                 <h3 className="font-display text-2xl md:text-4xl text-primary group-hover:text-accent transition-colors leading-tight">
                   {featured.title}
                 </h3>
                 {featured.excerpt && (
                   <p className="text-muted-foreground mt-4 text-sm md:text-base line-clamp-3 leading-relaxed">
                     {featured.excerpt}
                   </p>
                 )}
               </div>
             </Link>
           )}
           {(latest ?? []).filter(n => !featured || n.id !== featured.id).slice(0, featured ? 4 : 6).map((n) => (
             <Link key={n.id} to="/noticia/$slug" params={{ slug: n.slug }} className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-md transition-all flex flex-col">
               {n.cover_image && (
                 <div className="aspect-[16/10] overflow-hidden shrink-0">
                   <img src={n.cover_image} alt={n.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
               )}
               <div className="p-5 flex-1 flex flex-col">
                 {n.category && <span className="text-[10px] uppercase tracking-widest text-accent font-bold mb-2">{n.category.name}</span>}
                 <h3 className="font-display text-lg md:text-xl text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                   {n.title}
                 </h3>
               </div>
             </Link>
           ))}
          {(!latest || latest.length === 0) && !featured && (
            <div className="lg:col-span-3 text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
              Ainda não há notícias publicadas. Crie a primeira pelo painel administrativo.
            </div>
          )}
        </div>
      </section>

      {/* PROGRAMMING */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-widest text-accent font-semibold">Hoje na rádio</div>
            <h2 className="font-display text-4xl text-primary">Programação do dia</h2>
          </div>
          {programs && programs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {programs.map((p: any) => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:border-accent transition">
                  <div className="flex items-center gap-2 text-accent text-sm font-semibold"><Clock className="w-4 h-4" />{p.start_time?.slice(0,5)} – {p.end_time?.slice(0,5)}</div>
                  <h3 className="font-display text-2xl text-primary mt-2">{p.name}</h3>
                  {p.host && <p className="text-sm text-muted-foreground">com {p.host}</p>}
                  {p.description && <p className="text-sm mt-2">{p.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nenhum programa cadastrado para hoje.</p>
          )}
          <div className="text-center mt-8">
            <Link to="/programacao" className="inline-flex items-center gap-2 text-primary hover:text-accent">Ver programação completa <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
