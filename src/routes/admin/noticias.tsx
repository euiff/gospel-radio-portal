import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/noticias")({ component: NewsAdmin });

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface FormState {
  id?: string; title: string; slug: string; excerpt: string; content: string;
  cover_image: string; category_id: string; published: boolean; featured: boolean;
}

const emptyForm: FormState = { title: "", slug: "", excerpt: "", content: "", cover_image: "", category_id: "", published: false, featured: false };

function NewsAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<FormState | null>(null);

  const { data: news } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => (await supabase.from("news").select("*,category:categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: cats } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return;
    const payload: any = {
      title: editing.title,
      slug: editing.slug || slugify(editing.title),
      excerpt: editing.excerpt || null,
      content: editing.content,
      cover_image: editing.cover_image || null,
      category_id: editing.category_id || null,
      published: editing.published,
      featured: editing.featured,
      published_at: editing.published ? new Date().toISOString() : null,
      author_id: user?.id,
    };
    const { error } = editing.id
      ? await supabase.from("news").update(payload).eq("id", editing.id)
      : await supabase.from("news").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Salvo!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-news"] });
    qc.invalidateQueries({ queryKey: ["news-featured"] });
    qc.invalidateQueries({ queryKey: ["news-latest"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta notícia?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-news"] }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-primary">Notícias</h1>
          <p className="text-muted-foreground">Gerencie todo o conteúdo do portal.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyForm })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md gradient-gold text-gold-foreground font-semibold"><Plus className="w-4 h-4" /> Nova notícia</button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Título</th><th className="p-3">Categoria</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(news ?? []).map((n: any) => (
              <tr key={n.id} className="border-t border-border">
                <td className="p-3 font-medium flex items-center gap-2">{n.featured && <Star className="w-3.5 h-3.5 text-accent fill-accent" />}{n.title}</td>
                <td className="p-3 text-muted-foreground">{n.category?.name ?? "—"}</td>
                <td className="p-3">{n.published ? <span className="text-green-600">Publicada</span> : <span className="text-muted-foreground">Rascunho</span>}</td>
                <td className="p-3">{n.views}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing({ id: n.id, title: n.title, slug: n.slug, excerpt: n.excerpt ?? "", content: n.content, cover_image: n.cover_image ?? "", category_id: n.category_id ?? "", published: n.published, featured: n.featured })} className="p-2 hover:bg-muted rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => remove(n.id)} className="p-2 hover:bg-muted rounded text-destructive"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {(!news || news.length === 0) && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Nenhuma notícia criada ainda.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-card rounded-xl w-full max-w-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-primary">{editing.id ? "Editar notícia" : "Nova notícia"}</h2>
              <button type="button" onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Título</label>
                <input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" /></div>
              <div><label className="text-sm font-medium">Slug (URL)</label>
                <input required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" /></div>
              <div><label className="text-sm font-medium">Categoria</label>
                <select value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background">
                  <option value="">— sem categoria —</option>
                  {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-sm font-medium">Imagem de capa (URL)</label>
                <input value={editing.cover_image} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} placeholder="https://..." className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" /></div>
              <div><label className="text-sm font-medium">Resumo</label>
                <textarea value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" /></div>
              <div><label className="text-sm font-medium">Conteúdo</label>
                <textarea required value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={10} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" /></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publicada</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destaque na home</label>
              </div>
              <button className="w-full py-3 rounded gradient-gold text-gold-foreground font-semibold mt-2">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
