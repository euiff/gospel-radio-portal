import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({ component: AdminAudit });

interface Entry {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

function AdminAudit() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState<"all" | "shoutbox_message" | "quiz_question" | "top_song" | "top_chart">("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setItems((data ?? []) as Entry[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (entity !== "all") list = list.filter((i) => i.entity === entity);
    const term = query.trim().toLowerCase();
    if (term)
      list = list.filter(
        (i) =>
          (i.actor_email ?? "").toLowerCase().includes(term) ||
          i.action.toLowerCase().includes(term) ||
          JSON.stringify(i.meta ?? {}).toLowerCase().includes(term),
      );
    return list;
  }, [items, entity, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [query, entity]);

  const badge = (action: string) => {
    const map: Record<string, string> = {
      approve: "bg-emerald-100 text-emerald-800",
      hide: "bg-amber-100 text-amber-800",
      delete: "bg-red-100 text-red-800",
      create: "bg-blue-100 text-blue-800",
      update: "bg-indigo-100 text-indigo-800",
      activate: "bg-emerald-100 text-emerald-800",
      deactivate: "bg-amber-100 text-amber-800",
      reset_week: "bg-gold/30 text-gold-foreground",
    };
    return map[action] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-accent" />
            Log de auditoria
          </h1>
          <p className="text-muted-foreground">
            Todas as ações administrativas em Shoutbox, Quiz e Top Chart.
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-full border border-border hover:bg-muted" aria-label="Recarregar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por admin, ação ou detalhe…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </div>
        <select value={entity} onChange={(e) => setEntity(e.target.value as typeof entity)} className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-bold">
          <option value="all">Todas as áreas</option>
          <option value="shoutbox_message">Shoutbox</option>
          <option value="quiz_question">Quiz</option>
          <option value="top_song">Top Chart (música)</option>
          <option value="top_chart">Top Chart (semana)</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} evento(s)</span>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading && <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>}
        {!loading && pageItems.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum evento neste filtro.</div>
        )}
        <ul className="divide-y divide-border">
          {pageItems.map((e) => (
            <li key={e.id} className="p-4 flex items-start gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badge(e.action)}`}>{e.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{e.entity}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-1 font-bold text-primary text-sm truncate">{e.actor_email ?? e.user_id ?? "—"}</div>
                {e.entity_id && <div className="text-[11px] text-muted-foreground">ID: {e.entity_id}</div>}
                {e.meta && Object.keys(e.meta).length > 0 && (
                  <pre className="mt-2 text-[11px] bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(e.meta, null, 2)}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ul>
        {pageCount > 1 && (
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 p-3 border-t border-border bg-card text-sm">
            <span className="text-muted-foreground">Página {currentPage} de {pageCount}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount} aria-label="Próxima página" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}