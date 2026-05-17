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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" width={1600} height={900} />
          <div className="absolute inset-0 gradient-deep opacity-85" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-gold/40 text-gold text-xs uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> No ar agora
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6">
              A música que <span className="text-gradient-gold italic">renova</span> sua fé
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl">{settings?.tagline ?? "Notícias, louvor e palavra 24 horas por dia."}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={toggle} className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-gold text-gold-foreground font-semibold shadow-glow hover:scale-105 transition">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? "Pausar transmissão" : "Ouvir ao vivo"}
              </button>
              <Link to="/categoria/noticias" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 transition">
                Ver notícias <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED + LATEST */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Em destaque</div>
            <h2 className="font-display text-4xl text-primary">Últimas notícias</h2>
          </div>
          <Link to="/categoria/noticias" className="text-sm text-primary hover:text-accent flex items-center gap-1">Ver todas <ArrowRight className="w-4 h-4" /></Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {featured && (
            <Link to="/noticia/$slug" params={{ slug: featured.slug }} className="lg:col-span-2 lg:row-span-2 group rounded-xl overflow-hidden bg-card border border-border hover:shadow-glow transition">
              {featured.cover_image && <div className="aspect-[16/10] overflow-hidden"><img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition" /></div>}
              <div className="p-6">
                {featured.category && <span className="text-xs uppercase tracking-widest text-accent font-semibold">{featured.category.name}</span>}
                <h3 className="font-display text-3xl text-primary mt-2 mb-3 group-hover:text-accent transition">{featured.title}</h3>
                {featured.excerpt && <p className="text-muted-foreground">{featured.excerpt}</p>}
              </div>
            </Link>
          )}
          {(latest ?? []).filter(n => !featured || n.id !== featured.id).slice(0, featured ? 4 : 6).map((n) => (
            <Link key={n.id} to="/noticia/$slug" params={{ slug: n.slug }} className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-glow transition flex flex-col">
              {n.cover_image && <div className="aspect-[16/10] overflow-hidden"><img src={n.cover_image} alt={n.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" /></div>}
              <div className="p-5 flex-1">
                {n.category && <span className="text-xs uppercase tracking-widest text-accent font-semibold">{n.category.name}</span>}
                <h3 className="font-display text-xl text-primary mt-2 group-hover:text-accent transition">{n.title}</h3>
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
