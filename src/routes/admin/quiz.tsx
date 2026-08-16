import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { BookOpen, Plus, Trash2, Edit3, X, Check, Search, ArrowUpDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/quiz")({ component: AdminQuiz });

interface Q {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  reference: string | null;
  active: boolean;
  created_at: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface Draft {
  id: string | null;
  question: string;
  options: [string, string, string, string];
  correct_index: number;
  reference: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyDraft = (): Draft => ({
  id: null,
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  reference: "",
  active: true,
  starts_at: "",
  ends_at: "",
});

function AdminQuiz() {
  const [items, setItems] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "scheduled">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("quiz_questions")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Q[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft) return;
    if (draft.question.trim().length < 5) return toast.error("Pergunta muito curta");
    if (draft.options.some((o) => !o.trim())) return toast.error("Preencha as 4 alternativas");
    const payload = {
      question: draft.question.trim(),
      options: draft.options.map((o) => o.trim()),
      correct_index: draft.correct_index,
      reference: draft.reference.trim() || null,
      active: draft.active,
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
    };
    const q = draft.id
      ? await (supabase as any).from("quiz_questions").update(payload).eq("id", draft.id)
      : await (supabase as any).from("quiz_questions").insert(payload);
    if (q.error) return toast.error("Erro ao salvar");
    await logAudit(draft.id ? "update" : "create", "quiz_question", draft.id, { question: payload.question });
    toast.success(draft.id ? "Pergunta atualizada" : "Pergunta criada");
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta pergunta?")) return;
    const target = items.find((x) => x.id === id);
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    await logAudit("delete", "quiz_question", id, { question: target?.question });
    toast.success("Excluída");
    load();
  };

  const toggleActive = async (q: Q) => {
    await (supabase as any).from("quiz_questions").update({ active: !q.active }).eq("id", q.id);
    await logAudit(q.active ? "deactivate" : "activate", "quiz_question", q.id, {});
    toast.success(q.active ? "Pergunta ocultada" : "Pergunta publicada");
    load();
  };

  const editItem = (q: Q) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const toLocal = (v: string | null) => {
      if (!v) return "";
      const d = new Date(v);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setDraft({
      id: q.id,
      question: q.question,
      options: [opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""],
      correct_index: q.correct_index,
      reference: q.reference ?? "",
      active: q.active,
      starts_at: toLocal(q.starts_at),
      ends_at: toLocal(q.ends_at),
    });
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const inWindow = (q: Q) => {
      const s = q.starts_at ? new Date(q.starts_at) : null;
      const e = q.ends_at ? new Date(q.ends_at) : null;
      if (s && s > now) return false;
      if (e && e < now) return false;
      return true;
    };
    let list = items.slice();
    if (statusFilter === "active") list = list.filter((q) => q.active && inWindow(q));
    else if (statusFilter === "draft") list = list.filter((q) => !q.active);
    else if (statusFilter === "scheduled") list = list.filter((q) => q.starts_at && new Date(q.starts_at) > now);
    const term = query.trim().toLowerCase();
    if (term) list = list.filter((q) => q.question.toLowerCase().includes(term) || (q.reference ?? "").toLowerCase().includes(term));
    if (sort === "oldest") list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sort === "az") list.sort((a, b) => a.question.localeCompare(b.question));
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [items, statusFilter, query, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [query, sort, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-accent" />
            Quiz Bíblico
          </h1>
          <p className="text-muted-foreground">
            Cadastre e revise as perguntas do quiz do dia e suas referências.
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft(emptyDraft())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-gold text-gold-foreground font-bold shadow-md hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" /> Nova pergunta
          </button>
        )}
      </header>

      {draft && (
        <div className="bg-card border border-accent/40 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-primary">
              {draft.id ? "Editar pergunta" : "Nova pergunta"}
            </h2>
            <button
              onClick={() => setDraft(null)}
              className="p-2 rounded-full hover:bg-muted"
              aria-label="Cancelar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Pergunta
            </span>
            <textarea
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              placeholder="Ex.: Quem construiu a arca?"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            {draft.options.map((opt, i) => (
              <label key={i} className="block">
                <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                  Alternativa {i + 1}
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, correct_index: i })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${draft.correct_index === i ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {draft.correct_index === i ? "Correta" : "Marcar correta"}
                  </button>
                </span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const options = [...draft.options] as Draft["options"];
                    options[i] = e.target.value;
                    setDraft({ ...draft, options });
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Referência bíblica
            </span>
            <input
              value={draft.reference}
              onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
              placeholder="Ex.: Gênesis 6:14"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Publicada (aparece no site)
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Início automático (opcional)
              </span>
              <input
                type="datetime-local"
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fim automático (opcional)
              </span>
              <input
                type="datetime-local"
                value={draft.ends_at}
                onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Se preenchidos, a pergunta só aparece no site dentro deste período (além de precisar estar Publicada).
          </p>

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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por pergunta ou referência…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-bold">
          <option value="all">Todas</option>
          <option value="active">Ativas agora</option>
          <option value="scheduled">Agendadas</option>
          <option value="draft">Rascunhos</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground font-bold">
          <ArrowUpDown className="w-4 h-4" />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="px-2 py-1.5 rounded-md border border-input bg-background text-xs">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="az">A–Z</option>
          </select>
        </label>
        <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading && (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>
        )}
        {!loading && pageItems.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhuma pergunta neste filtro.
          </div>
        )}
        <ul className="divide-y divide-border">
          {pageItems.map((q) => (
            <li key={q.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${q.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                  >
                    {q.active ? "Publicada" : "Rascunho"}
                  </span>
                  {q.reference && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold-foreground font-bold">
                      {q.reference}
                    </span>
                  )}
                  {(q.starts_at || q.ends_at) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {q.starts_at ? new Date(q.starts_at).toLocaleString("pt-BR") : "…"}
                      {" → "}
                      {q.ends_at ? new Date(q.ends_at).toLocaleString("pt-BR") : "…"}
                    </span>
                  )}
                </div>
                <p className="font-display text-lg text-primary mt-1">{q.question}</p>
                <ol className="mt-2 grid sm:grid-cols-2 gap-1 text-sm">
                  {(Array.isArray(q.options) ? q.options : []).map((o: string, i: number) => (
                    <li
                      key={i}
                      className={`px-2 py-1 rounded ${i === q.correct_index ? "bg-emerald-50 text-emerald-900 font-bold" : "text-muted-foreground"}`}
                    >
                      {i === q.correct_index && <Check className="inline w-3 h-3 mr-1" />}
                      {o}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(q)}
                  className="p-2 rounded-lg border border-border hover:bg-muted"
                  title={q.active ? "Ocultar" : "Publicar"}
                >
                  {q.active ? (
                    <X className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
                <button
                  onClick={() => editItem(q)}
                  className="p-2 rounded-lg border border-border hover:bg-muted"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(q.id)}
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