import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { Trash2, Check, X, MessageSquare, RefreshCw, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/admin/shoutbox")({ component: AdminShoutbox });

interface Msg {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

function AdminShoutbox() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shoutbox_messages")
      .select("id,name,message,approved,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    setMessages((data ?? []) as Msg[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-shoutbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shoutbox_messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const toggleApproved = async (m: Msg) => {
    const { error } = await supabase
      .from("shoutbox_messages")
      .update({ approved: !m.approved })
      .eq("id", m.id);
    if (error) return toast.error("Falha ao atualizar");
    await logAudit(m.approved ? "hide" : "approve", "shoutbox_message", m.id, { name: m.name });
    toast.success(m.approved ? "Mensagem oculta" : "Mensagem liberada");
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta mensagem definitivamente?")) return;
    const target = messages.find((x) => x.id === id);
    const { error } = await supabase.from("shoutbox_messages").delete().eq("id", id);
    if (error) return toast.error("Falha ao remover");
    await logAudit("delete", "shoutbox_message", id, { name: target?.name, message: target?.message });
    toast.success("Removida");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = messages.filter((m) =>
      filter === "all" ? true : filter === "approved" ? m.approved : !m.approved,
    );
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || m.message.toLowerCase().includes(q));
    if (sort === "oldest") list = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [messages, filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [query, sort, filter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-accent" />
            Shoutbox ao vivo
          </h1>
          <p className="text-muted-foreground">Modere as mensagens dos ouvintes em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "approved", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {f === "all" ? "Todas" : f === "approved" ? "Publicadas" : "Ocultas"}
            </button>
          ))}
          <button
            onClick={load}
            className="p-2 rounded-full border border-border hover:bg-muted"
            aria-label="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou mensagem…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground font-bold">
          <ArrowUpDown className="w-4 h-4" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-2 py-1.5 rounded-md border border-input bg-background text-xs"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </label>
        <span className="text-xs text-muted-foreground">
          {filtered.length} resultado(s)
        </span>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading && (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>
        )}
        {!loading && pageItems.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhuma mensagem neste filtro.
          </div>
        )}
        <ul className="divide-y divide-border">
          {pageItems.map((m) => (
            <li key={m.id} className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase text-xs shrink-0">
                {m.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-primary text-sm">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {m.approved ? "Publicada" : "Oculta"}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mt-1 break-words">{m.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleApproved(m)}
                  className="p-2 rounded-lg border border-border hover:bg-muted"
                  aria-label={m.approved ? "Ocultar" : "Aprovar"}
                  title={m.approved ? "Ocultar" : "Aprovar"}
                >
                  {m.approved ? (
                    <X className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="p-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive"
                  aria-label="Excluir"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {pageCount > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border text-xs">
            <span className="text-muted-foreground">Página {currentPage} de {pageCount}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-border disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount} className="p-1.5 rounded border border-border disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}