import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SongRequestForm } from "@/components/site/SongRequestForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music, Clock, CheckCircle2, XCircle } from "lucide-react";
import { radioSettingsQueryOptions } from "@/lib/radio-context";

export const Route = createFileRoute("/pedidos")({
  loader: async ({ context: { queryClient } }) => {
    const radio = await queryClient.ensureQueryData(radioSettingsQueryOptions);
    return { radio };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "Pedidos de Música — Envie sua sugestão para a rádio" },
      {
        name: "description",
        content:
          "Envie sua música favorita para tocar na rádio e acompanhe o status do seu pedido em tempo real.",
      },
      { property: "og:title", content: "Pedidos de Música — Rádio" },
      {
        property: "og:description",
        content: "Peça a sua música e acompanhe o status dela na rádio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gospel-radio-portal.lovable.app/pedidos" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.radio?.logo_url
        ? [
            { property: "og:image", content: loaderData.radio.logo_url },
            { name: "twitter:image", content: loaderData.radio.logo_url },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: "https://gospel-radio-portal.lovable.app/pedidos" }],
  }),
  component: PedidosPage,
});

interface Req {
  id: string;
  user_name: string;
  song_title: string;
  artist: string;
  status: string;
  created_at: string;
}

function PedidosPage() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef<Record<string, string>>({});
  const myIdsRef = useRef<Set<string>>(new Set());

  const load = async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    const ids: string[] = JSON.parse(localStorage.getItem("my-song-requests") || "[]");
    myIdsRef.current = new Set(ids);
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("song_requests")
      .select("id,user_name,song_title,artist,status,created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Req[];
    prevStatusRef.current = Object.fromEntries(rows.map((r) => [r.id, r.status]));
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const channel = supabase
      .channel("my-song-requests")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "song_requests" },
        (payload: any) => {
          const row = payload.new as Req;
          if (!myIdsRef.current.has(row.id)) return;
          const prev = prevStatusRef.current[row.id];
          setItems((cur) => cur.map((r) => (r.id === row.id ? { ...r, ...row } : r)));
          prevStatusRef.current[row.id] = row.status;
          if (prev && prev !== row.status) {
            if (row.status === "played") toast.success(`🎶 Sua música "${row.song_title}" está tocando!`);
            else if (row.status === "rejected") toast.info(`Seu pedido "${row.song_title}" não foi aprovado desta vez.`);
            else toast.message(`Status atualizado: ${row.status}`);
          }
        },
      )
      .subscribe();
    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  const statusLabel = (s: string) => {
    if (s === "played") return { label: "Tocada", icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (s === "rejected") return { label: "Não aprovada", icon: XCircle, cls: "text-red-600 bg-red-50 border-red-200" };
    return { label: "Aguardando", icon: Clock, cls: "text-amber-700 bg-amber-50 border-amber-200" };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
            Fale com a rádio
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-primary leading-tight">
            Peça sua <span className="text-gradient-gold italic">música</span>
          </h1>
          <p className="text-muted-foreground mt-3">
            Envie o seu pedido para o locutor e acompanhe o status. Sua música pode ser a próxima no
            ar!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <div className="min-w-0 lg:col-span-3">
            <SongRequestForm
              onSubmitted={(id) => {
                if (typeof window === "undefined") return;
                const ids: string[] = JSON.parse(
                  localStorage.getItem("my-song-requests") || "[]",
                );
                if (!ids.includes(id)) ids.unshift(id);
                localStorage.setItem("my-song-requests", JSON.stringify(ids.slice(0, 30)));
                load();
              }}
            />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="gradient-deep text-white px-5 py-4 flex items-center gap-3">
                <Music className="w-5 h-5 text-gold" />
                <div className="flex-1">
                  <h2 className="font-display text-xl leading-tight">Meus pedidos</h2>
                  <p className="text-xs text-white/60">Atualiza automaticamente</p>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
                {loading && (
                  <div className="text-sm text-muted-foreground text-center py-6">Carregando…</div>
                )}
                {!loading && items.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    Você ainda não fez pedidos por este dispositivo. Envie o primeiro!
                  </div>
                )}
                {items.map((r) => {
                  const s = statusLabel(r.status);
                  const Icon = s.icon;
                  return (
                    <div
                      key={r.id}
                      className="border border-border rounded-xl p-3 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-primary truncate">
                          {r.song_title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{r.artist}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {r.user_name} · {new Date(r.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-1 ${s.cls}`}
                      >
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}