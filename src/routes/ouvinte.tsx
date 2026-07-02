import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useRadio } from "@/lib/radio-context";
import { RecentTracks } from "@/components/site/RecentTracks";
import { AudioVisualizer } from "@/components/site/AudioVisualizer";
import { OnAirBadge } from "@/components/site/OnAirBadge";
import { Play, Pause, Radio, Music, Trophy, MessageCircle } from "lucide-react";

const TopChart = lazy(() =>
  import("@/components/site/TopChart").then((m) => ({ default: m.TopChart })),
);

export const Route = createFileRoute("/ouvinte")({
  head: () => ({
    meta: [
      { title: "Área do Ouvinte — Tocando agora, últimas músicas e Top Chart" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real o que está tocando, as últimas músicas exibidas e o ranking semanal Top Chart da rádio.",
      },
      { property: "og:title", content: "Área do Ouvinte — Rádio" },
      {
        property: "og:description",
        content: "Tocando agora, últimas músicas e ranking semanal em um só lugar.",
      },
    ],
  }),
  component: OuvintePage,
});

function OuvintePage() {
  const { settings, nowPlaying, isPlaying, toggle } = useRadio();
  const [artist, title] = nowPlaying?.includes(" - ")
    ? nowPlaying.split(" - ")
    : [null, nowPlaying];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero: now playing */}
        <section className="relative gradient-deep text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,168,76,0.18),transparent_60%)]" />
          <div className="relative container mx-auto px-4 py-12 md:py-20">
            <OnAirBadge label={isPlaying ? "TRANSMITINDO AGORA" : "PRONTO PARA OUVIR"} />
            <h1 className="font-display text-4xl md:text-6xl mt-6 leading-tight">
              Área do <span className="text-gradient-gold italic">Ouvinte</span>
            </h1>
            <p className="text-white/70 mt-3 max-w-2xl">
              Tudo o que está rolando no ar, agora mesmo. Acompanhe as últimas tocadas e o Top Chart
              semanal.
            </p>

            <div className="mt-8 grid md:grid-cols-5 gap-6 items-stretch">
              <div className="md:col-span-3 bg-white/5 backdrop-blur-md border border-gold/30 rounded-3xl p-6 md:p-8 shadow-emerald">
                <div className="flex items-center gap-5">
                  <div
                    className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gold/40 ${isPlaying ? "animate-spin-slow" : ""}`}
                  >
                    {settings?.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full gradient-emerald" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-deep-darker border border-gold/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1 flex items-center gap-2">
                      <Radio className="w-3 h-3" /> Tocando agora
                    </div>
                    <div className="font-display text-2xl md:text-3xl truncate">
                      {title || settings?.station_name || "Sua Rádio"}
                    </div>
                    {artist && (
                      <div className="text-white/70 truncate text-sm">{artist}</div>
                    )}
                    <AudioVisualizer active={isPlaying} bars={10} className="mt-3 h-5" />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={toggle}
                    aria-label={isPlaying ? "Pausar" : "Ouvir agora"}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-gold text-gold-foreground font-bold shadow-glow hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? "Pausar" : "Ouvir ao vivo"}
                  </button>
                  <Link
                    to="/pedidos"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 transition font-medium"
                  >
                    <MessageCircle className="w-5 h-5" /> Pedir uma música
                  </Link>
                </div>
              </div>

              <div className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <div className="text-[10px] uppercase tracking-widest text-gold font-bold mb-3 flex items-center gap-2">
                  <Music className="w-3 h-3" /> Últimas tocadas
                </div>
                <div className="[&_*]:!text-white/90 [&_.text-primary]:!text-white [&_.text-muted-foreground]:!text-white/50">
                  <RecentTracks limit={8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top chart */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2 inline-flex items-center gap-2 justify-center">
              <Trophy className="w-3 h-3" /> Ranking da semana
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-primary">Top Chart</h2>
            <p className="text-muted-foreground mt-2">
              As músicas mais votadas pelos ouvintes esta semana.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Suspense
              fallback={
                <div className="text-center py-10 text-muted-foreground">Carregando ranking…</div>
              }
            >
              <TopChart />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}