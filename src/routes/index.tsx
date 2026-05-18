import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import heroImg from "@/assets/hero-worship.jpg";
import { useRadio } from "@/lib/radio-context";
import { Play, Pause, ArrowRight, Clock } from "lucide-react";
import { MessageCircle, Heart, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { featuredNewsQuery, latestNewsQuery, type NewsItem } from "@/hooks/use-site-data";
import { supabase } from "@/integrations/supabase/client";

// Lazy load secondary components to reduce initial bundle size
const SongRequestForm = lazy(() =>
  import("@/components/site/SongRequestForm").then((m) => ({ default: m.SongRequestForm })),
);
const ScheduleDisplay = lazy(() =>
  import("@/components/site/ScheduleDisplay").then((m) => ({ default: m.ScheduleDisplay })),
);
const PrayerMural = lazy(() =>
  import("@/components/site/PrayerMural").then((m) => ({ default: m.PrayerMural })),
);

const programsTodayQueryOptions = (dow: number) =>
  queryOptions({
    queryKey: ["programs-today", dow],
    queryFn: async () => {
      const { data } = await supabase
        .from("programs")
        .select("*")
        .eq("day_of_week", dow)
        .order("start_time");
      return data ?? [];
    },
  });

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    const dow = new Date().getDay();
    queryClient.ensureQueryData(featuredNewsQuery);
    queryClient.ensureQueryData(latestNewsQuery);
    queryClient.ensureQueryData(programsTodayQueryOptions(dow));
  },
  component: Home,
});

function Home() {
  const { settings, isPlaying, toggle } = useRadio();
  const dow = new Date().getDay();
  const { data: featured } = useSuspenseQuery(featuredNewsQuery);
  const { data: latest } = useSuspenseQuery(latestNewsQuery);
  const { data: programs } = useSuspenseQuery(programsTodayQueryOptions(dow));

  // Fetch site settings for hero personalization
  const { data: siteSettings } = useSuspenseQuery(
    queryOptions({
      queryKey: ["site-settings-hero"],
      queryFn: async () => {
        const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
        return data;
      },
    }),
  );

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt=""
            className="w-full h-full object-cover"
            width={1600}
            height={900}
            fetchPriority="high"
            loading="eager"
          />
          <div className="absolute inset-0 gradient-deep opacity-90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-gold/40 text-gold text-[10px] md:text-xs uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> No ar agora
            </div>
            <h1 className="font-display leading-[1.1] mb-6">
              {siteSettings?.hero_title ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: siteSettings.hero_title.replace(
                      /(.+)\s(.+)$/,
                      '$1 <span class="text-gradient-gold italic">$2</span>',
                    ),
                  }}
                />
              ) : (
                <>
                  A música que <span className="text-gradient-gold italic">renova</span> sua fé
                </>
              )}
            </h1>
            <p className="text-base md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              {siteSettings?.hero_subtitle ||
                settings?.tagline ||
                "Notícias, louvor e palavra 24 horas por dia, levando a mensagem de esperança para todo o mundo."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={toggle}
                aria-label={isPlaying ? "Pausar rádio" : "Ouvir agora"}
                aria-pressed={isPlaying}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full gradient-gold text-gold-foreground font-bold shadow-glow hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 transition min-w-[200px]"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                {isPlaying ? "Pausar rádio" : "Ouvir agora"}
              </button>
              <Link
                to="/categoria/$slug"
                params={{ slug: "noticias" }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white backdrop-blur-sm transition active:scale-95 font-medium"
              >
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
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
              Informativo
            </div>
            <h2 className="font-display text-primary">Portal de Notícias</h2>
          </div>
          <Link
            to="/categoria/$slug"
            params={{ slug: "noticias" }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent focus-visible:outline-none focus-visible:underline group transition"
          >
            Ver todo o conteúdo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featured && (
            <Link
              to="/noticia/$slug"
              params={{ slug: featured.slug }}
              className="md:col-span-2 lg:row-span-2 group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 flex flex-col"
            >
              {featured.cover_image && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={featured.cover_image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
          {(latest ?? [])
            .filter((n) => !featured || n.id !== featured.id)
            .slice(0, featured ? 4 : 6)
            .map((n) => (
              <Link
                key={n.id}
                to="/noticia/$slug"
                params={{ slug: n.slug }}
                className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all flex flex-col"
              >
                {n.cover_image && (
                  <div className="aspect-[16/10] overflow-hidden shrink-0">
                    <img
                      src={n.cover_image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  {n.category && (
                    <span className="text-[10px] uppercase tracking-widest text-accent font-bold mb-2">
                      {n.category.name}
                    </span>
                  )}
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
      <section className="bg-muted/50 py-16 md:py-24 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
              Sintonize
            </div>
            <h2 className="font-display text-primary">Nossa Programação</h2>
            <p className="text-muted-foreground mt-2">
              O que está rolando hoje na sua rádio favorita
            </p>
          </div>

          {programs && programs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {programs.map((p: any) => (
                <div
                  key={p.id}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Clock className="w-12 h-12" />
                  </div>
                  <div className="flex items-center gap-2 text-accent text-sm font-bold mb-4">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10">
                      <Clock className="w-3.5 h-3.5" />
                      {p.start_time?.slice(0, 5)} – {p.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl text-primary mb-2 leading-tight group-hover:text-accent transition-colors">
                    {p.name}
                  </h3>
                  {p.host && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold uppercase">
                        {p.host.slice(0, 1)}
                      </div>
                      <p className="text-sm font-medium text-primary/80">Com {p.host}</p>
                    </div>
                  )}
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                      "{p.description}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center p-12 bg-card border border-dashed border-border rounded-3xl">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                A programação de hoje ainda está sendo preparada. Fique ligado!
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/programacao"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-primary/20 text-primary font-bold hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all shadow-sm"
            >
              Grade completa de horários <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES TABS / SECTION */}
      <section id="interatividade" className="bg-white py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
              Interatividade
            </div>
            <h2 className="font-display text-primary text-4xl md:text-5xl">
              Participe da Nossa Rádio
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Peça sua música favorita, confira nossa grade completa e deixe seu pedido de oração no
              nosso mural comunitário.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar: Schedule and Request Form */}
            <div className="lg:col-span-4 space-y-8">
              <div id="programacao">
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                  <ScheduleDisplay />
                </Suspense>
              </div>
              <div id="pedidos">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
                  <SongRequestForm />
                </Suspense>
              </div>
            </div>

            {/* Main Content: Prayer Mural */}
            <div className="lg:col-span-8" id="oracao">
              <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
                <PrayerMural />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE QUICK NAV */}
      <section className="bg-primary/5 py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a
              href="#pedidos"
              className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-primary mb-1">Pedir Música</h3>
              <p className="text-xs text-muted-foreground">Mande seu pedido via WhatsApp</p>
            </a>
            <a
              href="#oracao"
              className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-primary mb-1">Mural de Oração</h3>
              <p className="text-xs text-muted-foreground">Compartilhe sua intenção</p>
            </a>
            <a
              href="#programacao"
              className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-primary mb-1">Grade Completa</h3>
              <p className="text-xs text-muted-foreground">Confira nossos horários</p>
            </a>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20 text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-4xl md:text-5xl mb-6">Sua participação faz a rádio!</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed">
            Siga-nos nas redes sociais, mande seu testemunho e ajude a espalhar a palavra de Deus
            através da música.
          </p>
        </div>
      </section>
    </main>
  );
}
