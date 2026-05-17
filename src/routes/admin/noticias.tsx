import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
 import { Plus, Trash2, Edit, Star } from "lucide-react";
 import { ResponsiveModal } from "@/components/ui/responsive-modal";
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
    const current = (news as any[])?.find(n => n.id === editing.id);
    const wasPublished = current?.published;
    const payload: any = {
      title: editing.title,
      slug: editing.slug || slugify(editing.title),
      excerpt: editing.excerpt || null,
      content: editing.content,
      cover_image: editing.cover_image || null,
      category_id: editing.category_id || null,
      published: editing.published,
      featured: editing.featured,
      author_id: user?.id,
    };

    if (editing.published && !wasPublished) {
      payload.published_at = new Date().toISOString();
    } else if (!editing.published) {
      payload.published_at = null;
    } else if (wasPublished) {
      payload.published_at = current.published_at;
    }

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
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
         <div>
           <h1 className="font-display text-primary leading-tight">Notícias</h1>
           <p className="text-muted-foreground mt-1">Gerencie todo o conteúdo do portal.</p>
         </div>
         <button 
           onClick={() => setEditing({ ...emptyForm })} 
           className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-gold text-gold-foreground font-bold shadow-md hover:scale-105 active:scale-95 transition"
         >
           <Plus className="w-5 h-5" /> Nova notícia
         </button>
       </div>
 
       <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
         <div className="responsive-table-container">
           <table className="w-full text-sm text-left">
             <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
               <tr>
                 <th className="p-4">Título</th>
                 <th className="p-4">Categoria</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Views</th>
                 <th className="p-4 text-right">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border">
               {(news ?? []).map((n: any) => (
                 <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-2 max-w-[300px]">
                       {n.featured && <Star className="w-4 h-4 text-accent fill-accent shrink-0" />}
                       <span className="font-bold text-primary truncate" title={n.title}>{n.title}</span>
                     </div>
                   </td>
                   <td className="p-4">
                     <span className="px-2 py-1 rounded bg-secondary text-xs">{n.category?.name ?? "—"}</span>
                   </td>
                   <td className="p-4">
                     {n.published ? (
                       <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Publicada
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                         <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Rascunho
                       </span>
                     )}
                   </td>
                   <td className="p-4 font-mono text-xs">{n.views}</td>
                   <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-1">
                       <button 
                         onClick={() => setEditing({ id: n.id, title: n.title, slug: n.slug, excerpt: n.excerpt ?? "", content: n.content, cover_image: n.cover_image ?? "", category_id: n.category_id ?? "", published: n.published, featured: n.featured })} 
                         className="p-2.5 hover:bg-muted rounded-lg transition text-primary"
                         aria-label="Editar"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => remove(n.id)} 
                         className="p-2.5 hover:bg-destructive/10 rounded-lg transition text-destructive"
                         aria-label="Excluir"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))}
               {(!news || news.length === 0) && (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                     Nenhuma notícia encontrada. Comece criando uma agora!
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
 
        <ResponsiveModal
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title={editing?.id ? "Editar notícia" : "Nova notícia"}
          className="max-w-2xl"
        >
          {editing && (
            <form onSubmit={save} className="space-y-6">
              <div className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título</label>
                    <input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slug (URL)</label>
                    <input required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</label>
                    <select value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition">
                      <option value="">— sem categoria —</option>
                      {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Imagem de capa (URL)</label>
                    <input value={editing.cover_image} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} placeholder="https://..." className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo (opcional)</label>
                  <textarea value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo Completo</label>
                  <textarea required value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={8} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" />
                </div>

                <div className="flex flex-wrap gap-8 p-4 bg-muted/30 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="w-5 h-5 rounded border-input text-accent focus:ring-accent" />
                    <span className="text-sm font-bold text-primary group-hover:text-accent transition">Publicar notícia</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="w-5 h-5 rounded border-input text-accent focus:ring-accent" />
                    <span className="text-sm font-bold text-primary group-hover:text-accent transition">Destaque na Home</span>
                  </label>
                </div>
              </div>

              <div className="p-6 pt-0 bg-muted/20 flex gap-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl border border-border font-bold hover:bg-muted transition">Cancelar</button>
                <button className="flex-[2] py-3 rounded-xl gradient-gold text-gold-foreground font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition">Salvar Notícia</button>
              </div>
            </form>
          )}
        </ResponsiveModal>
    </div>
  );
}
