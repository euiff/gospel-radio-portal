import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { Trophy, Plus, Trash2, Edit3, X, Calendar, RotateCcw, Search, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/top-chart")({ component: AdminTopChart });

interface Song {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  youtube_url: string | null;
  position: number;
  votes: number;
  active: boolean;
  week_start: string | null;
  week_end: string | null;
}

interface Draft {
  id: string | null;
  title: string;
  artist: string;
  cover_url: string;
  youtube_url: string;
  position: number;
  active: boolean;
}

const emptyDraft = (position: number): Draft => ({
  id: null,
  title: "",
  artist: "",
  cover_url: "",
  youtube_url: "",
  position,
  active: true,
});

function AdminTopChart() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"votes" | "position" | "az">("votes");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("top_songs")
      .select("*")
      .order("position", { ascending: true });
    const list = (data ?? []) as Song[];
    setSongs(list);
    const anyWeek = list.find((s) => s.week_start && s.week_end);
    if (anyWeek) {
      setWeekStart(anyWeek.week_start ?? "");
      setWeekEnd(anyWeek.week_end ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.artist.trim())
      return toast.error("Título e artista são obrigatórios");
    const payload = {
      title: draft.title.trim(),
      artist: draft.artist.trim(),
      cover_url: draft.cover_url.trim() || null,
      youtube_url: draft.youtube_url.trim() || null,
      position: draft.position,
      active: draft.active,
    };
    const q = draft.id
      ? await (supabase as any).from("top_songs").update(payload).eq("id", draft.id)
      : await (supabase as any).from("top_songs").insert({ ...payload, votes: 0 });
    if (q.error) return toast.error("Erro ao salvar");
    await logAudit(draft.id ? "update" : "create", "top_song", draft.id, { title: payload.title, artist: payload.artist });
    toast.success("Salvo");
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta música do ranking?")) return;
    const target = songs.find((x) => x.id === id);
    const { error } = await supabase.from("top_songs").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    await logAudit("delete", "top_song", id, { title: target?.title });
    toast.success("Música removida");
    load();
  };

  const toggleActive = async (s: Song) => {
    await (supabase as any).from("top_songs").update({ active: !s.active }).eq("id", s.id);
    await logAudit(s.active ? "deactivate" : "activate", "top_song", s.id, { title: s.title });
    toast.success(s.active ? "Música ocultada" : "Música ativada");
    load();
  };

  const resetWeek = async () => {
    if (!weekStart || !weekEnd) return toast.error("Defina início e fim da semana");
    if (weekEnd < weekStart) return toast.error("A data final deve ser após a inicial");
    if (!confirm("Isto zera TODOS os votos e define uma nova semana para as músicas ativas. Confirmar?")) return;
    setResetting(true);
    const tId = toast.loading("Iniciando nova semana e zerando votos…");
    const { error } = await (supabase as any).rpc("reset_top_chart_week", {
      _start: weekStart,
      _end: weekEnd,
    });
    setResetting(false);
    if (error) {
      toast.error("Falha ao reiniciar: " + error.message, { id: tId });
      return;
    }
    await logAudit("reset_week", "top_chart", null, { week_start: weekStart, week_end: weekEnd });
    toast.success(`Nova semana iniciada (${weekStart} → ${weekEnd}). Votos zerados! 🎉`, { id: tId, duration: 5000 });
    load();
  };

  const filtered = useMemo(() => {
    let list = songs.slice();
    if (statusFilter === "active") list = list.filter((s) => s.active);
    else if (statusFilter === "hidden") list = list.filter((s) => !s.active);
    const term = query.trim().toLowerCase();
    if (term) list = list.filter((s) => s.title.toLowerCase().includes(term) || s.artist.toLowerCase().includes(term));
    if (sort === "position") list.sort((a, b) => a.position - b.position);
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.votes - a.votes || a.position - b.position);
    return list;
  }, [songs, statusFilter, query, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [query, sort, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary flex items-center gap-3">
            <Trophy className="w-8 h-8 text-gold" />
            Top Chart Semanal
          </h1>
          <p className="text-muted-foreground">
            Gerencie o ranking, os votos e o período da semana em votação.
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft(emptyDraft(songs.length + 1))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-gold text-gold-foreground font-bold shadow-md hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" /> Nova música
          </button>
        )}
      </header>

      <section className="bg-card border border-border rounded-2xl p-5 grid sm:grid-cols-3 gap-3 items-end shadow-sm">
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Início da semana
          </span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Fim da semana
          </span>
          <input
            type="date"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background"
          />
        </label>
        <button
          onClick={resetWeek}
          disabled={resetting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-deep text-white font-bold hover:opacity-90 transition disabled:opacity-60"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {resetting ? "Processando…" : "Iniciar nova semana"}
        </button>
      </section>

      {draft && (
        <div className="bg-card border border-accent/40 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-primary">
              {draft.id ? "Editar música" : "Nova música"}
            </h2>
            <button
              onClick={() => setDraft(null)}
              className="p-2 rounded-full hover:bg-muted"
              aria-label="Cancelar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Título"
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <input
              value={draft.artist}
              onChange={(e) => setDraft({ ...draft, artist: e.target.value })}
              placeholder="Artista"
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <input
              value={draft.cover_url}
              onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
              placeholder="URL da capa (opcional)"
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <input
              value={draft.youtube_url}
              onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
              placeholder="URL YouTube (opcional)"
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <label className="text-sm flex items-center gap-2">
              Posição inicial
              <input
                type="number"
                min={1}
                value={draft.position}
                onChange={(e) =>
                  setDraft({ ...draft, position: parseInt(e.target.value, 10) || 1 })
                }
                className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </label>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Ativa na votação
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDraft(null)}
              className="px-4 py-2 rounded-lg border border-border font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título ou artista…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-bold">
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="hidden">Ocultas</option>
          </select>
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground font-bold">
            <ArrowUpDown className="w-4 h-4" />
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="px-2 py-1.5 rounded-md border border-input bg-background text-xs">
              <option value="votes">Mais votadas</option>
              <option value="position">Posição</option>
              <option value="az">A–Z</option>
            </select>
          </label>
          <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
        </div>
        {loading && (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>
        )}
        {!loading && pageItems.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhum resultado neste filtro.
          </div>
        )}
        <ul className="divide-y divide-border">
          {pageItems.map((s, i) => (
              <li key={s.id} className="p-4 flex items-center gap-3">
                <span className="w-8 text-center font-display text-lg text-muted-foreground">
                  #{(currentPage - 1) * pageSize + i + 1}
                </span>
                <div className="w-12 h-12 rounded-md bg-primary/10 overflow-hidden shrink-0">
                  {s.cover_url && (
                    <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-primary truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.artist}</div>
                </div>
                <span className="text-xs font-bold text-accent shrink-0">{s.votes} votos</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${s.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                >
                  {s.active ? "Ativa" : "Oculta"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(s)}
                    className="p-2 rounded-lg border border-border hover:bg-muted"
                    title={s.active ? "Ocultar" : "Ativar"}
                  >
                    {s.active ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() =>
                      setDraft({
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        cover_url: s.cover_url ?? "",
                        youtube_url: s.youtube_url ?? "",
                        position: s.position,
                        active: s.active,
                      })
                    }
                    className="p-2 rounded-lg border border-border hover:bg-muted"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive"
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