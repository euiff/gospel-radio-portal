import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site")({ component: SiteSettings });

 const fields: Array<{ key: string; label: string; type?: string }> = [
   { key: "site_name", label: "Nome do portal" },
   { key: "site_description", label: "Descrição (SEO)" },
   { key: "hero_title", label: "Título do hero" },
   { key: "hero_subtitle", label: "Subtítulo do hero" },
   { key: "footer_text", label: "Texto do rodapé" },
   { key: "primary_color", label: "Cor Primária", type: "color" },
   { key: "accent_color", label: "Cor de Destaque", type: "color" },
 ];

function SiteSettings() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { supabase.from("site_settings").select("*").limit(1).maybeSingle().then(({ data }) => setData(data ?? {})); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...data }; delete payload.created_at; delete payload.updated_at;
    const { error } = data?.id
      ? await supabase.from("site_settings").update(payload).eq("id", data.id)
      : await supabase.from("site_settings").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Site atualizado!");
  };

  if (!data) return <div>Carregando…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl text-primary mb-2">Configurar Site</h1>
      <p className="text-muted-foreground mb-8">Textos institucionais e SEO.</p>
       <form onSubmit={save} className="bg-card border border-border rounded-xl p-6 space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {fields.map((f) => (
             <div key={f.key} className={f.type === "color" ? "col-span-1" : "col-span-1 md:col-span-2"}>
               <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{f.label}</label>
               {f.type === "color" ? (
                 <div className="flex items-center gap-3">
                   <input 
                     type="color" 
                     value={data[f.key] ?? "#000000"} 
                     onChange={(e) => setData({ ...data, [f.key]: e.target.value })} 
                     className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer overflow-hidden p-0" 
                   />
                   <input 
                     type="text" 
                     value={data[f.key] ?? ""} 
                     onChange={(e) => setData({ ...data, [f.key]: e.target.value })} 
                     className="flex-1 px-4 py-3 rounded-xl border border-input bg-background font-mono text-sm" 
                   />
                 </div>
               ) : (
                 <input 
                   value={data[f.key] ?? ""} 
                   onChange={(e) => setData({ ...data, [f.key]: e.target.value })} 
                   className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition" 
                 />
               )}
             </div>
           ))}
         </div>
         <button 
           disabled={saving} 
           className="w-full py-4 rounded-xl gradient-gold text-gold-foreground font-bold shadow-lg hover:scale-[1.01] active:scale-95 transition disabled:opacity-50"
         >
           {saving ? "Salvando…" : "Salvar Alterações"}
         </button>
       </form>
    </div>
  );
}
