import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import heroImg from "@/assets/hero-worship.jpg";
import { useRadio } from "@/lib/radio-context";
import { Play, Pause, ArrowRight, Clock } from "lucide-react";
import { MessageCircle, Heart, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { featuredNewsQuery, latestNewsQuery, siteSettingsQuery, type NewsItem } from "@/hooks/use-site-data";
import { radioSettingsQueryOptions } from "@/lib/radio-context";
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
const Shoutbox = lazy(() =>
  import("@/components/site/Shoutbox").then((m) => ({ default: m.Shoutbox })),
);
const TopChart = lazy(() =>
  import("@/components/site/TopChart").then((m) => ({ default: m.TopChart })),
);
const QuizCard = lazy(() =>
  import("@/components/site/QuizCard").then((m) => ({ default: m.QuizCard })),
);
import { NewsTicker } from "@/components/site/NewsTicker";
import { OnAirBadge } from "@/components/site/OnAirBadge";
import { AudioVisualizer } from "@/components/site/AudioVisualizer";
import { RecentTracks } from "@/components/site/RecentTracks";

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
  loader: async ({ context: { queryClient } }) => {
    const dow = new Date().getDay();
    const [radio, site] = await Promise.all([
      queryClient.ensureQueryData(radioSettingsQueryOptions),
      queryClient.ensureQueryData(siteSettingsQuery),
      queryClient.ensureQueryData(featuredNewsQuery),
      queryClient.ensureQueryData(latestNewsQuery),
      queryClient.ensureQueryData(programsTodayQueryOptions(dow)),
    ]);
    return { radio, site };
  },
  head: ({ loaderData }) => {
    const { radio, site } = loaderData || {};
    const title = radio?.station_name 
      ? `${radio.station_name} | ${radio.tagline || 'Portal de Notícias'}` 
      : "Alternativa gospel";
    const description = site?.site_description || radio?.tagline || "Portal de notícias e música cristã";
    const ogImage = site?.logo_url || radio?.logo_url || "";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" fetchPriority="high" loading="eager" />
          <div className="absolute inset-0 gradient-deep opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,168,76,0.15),transparent_60%)]" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-14 md:py-24 text-white">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <OnAirBadge label={isPlaying ? "TRANSMITINDO AGORA" : "PRONTO PARA OUVIR"} />
              <h1 className="font-display leading-[1.05] mb-6 mt-6">
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
                  "Louvor, palavra e notícias 24h — uma experiência de rádio profissional para toda a família."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={toggle}
                  aria-label={isPlaying ? "Pausar rádio" : "Ouvir agora"}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full gradient-gold text-gold-foreground font-bold shadow-glow hover:scale-105 active:scale-95 transition min-w-[200px]"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  {isPlaying ? "Pausar rádio" : "Ouvir ao vivo"}
                </button>
                {settings?.whatsapp && (
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 backdrop-blur-sm transition font-medium"
                  >
                    <MessageCircle className="w-5 h-5" /> Fale com a rádio
                  </a>
                )}
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <div className="text-center">
                  <div className="font-display text-3xl text-gold">24h</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">No ar</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="font-display text-3xl text-gold">HD</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Qualidade</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl text-gold">∞</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Louvor</div>
                </div>
              </div>
            </div>

            {/* Player card */}
            <div className="lg:col-span-5">
              <div className="bg-white/5 backdrop-blur-md border border-gold/30 rounded-3xl p-6 md:p-8 shadow-emerald">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`relative w-20 h-20 rounded-full overflow-hidden border-4 border-gold/40 ${isPlaying ? "animate-spin-slow" : ""}`}>
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-emerald" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-deep-darker border border-gold/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">Tocando agora</div>
                    <div className="font-display text-lg text-white truncate">
                      {settings?.station_name || "Sua Rádio"}
                    </div>
                    <AudioVisualizer active={isPlaying} bars={6} className="mt-1 h-4" />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-3 flex items-center gap-2">
                    <Music className="w-3 h-3" /> Últimas tocadas
                  </div>
                  <div className="text-white [&_*]:!text-white/90 [&_.text-primary]:!text-white [&_.text-muted-foreground]:!text-white/50">
                    <RecentTracks limit={4} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News ticker */}
      <NewsTicker items={(latest ?? []).slice(0, 8)} />

      <AdBanner position="hero" className="pt-8" />

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


      {/* CALL TO ACTION */}
      {/* TOP CHART + QUIZ */}
      <section className="bg-muted/40 py-16 md:py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">Ranking & Cultura</div>
            <h2 className="font-display text-primary">O que está bombando</h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
                <TopChart />
              </Suspense>
            </div>
            <div className="lg:col-span-2">
              <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
                <QuizCard />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* SHOUTBOX + PRAYER */}
      <section className="bg-white py-16 md:py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">Comunidade</div>
            <h2 className="font-display text-primary">A rádio é sua — participe</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-2xl" />}>
              <Shoutbox />
            </Suspense>
            <div className="space-y-6">
              <Suspense fallback={<Skeleton className="h-[240px] w-full rounded-2xl" />}>
                <SongRequestForm />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-[240px] w-full rounded-2xl" />}>
                <ScheduleDisplay />
              </Suspense>
            </div>
          </div>
          <div className="mt-8" id="oracao">
            <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
              <PrayerMural />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="gradient-emerald text-white py-16 md:py-20 text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-4xl md:text-5xl mb-6">Sua participação faz a rádio!</h2>
          <p className="text-lg md:text-xl text-white/85 mb-10 leading-relaxed">
            Siga-nos nas redes sociais, mande seu testemunho e ajude a espalhar a palavra de Deus
            através da música.
          </p>
        </div>
      </section>
    </main>
  );
}
