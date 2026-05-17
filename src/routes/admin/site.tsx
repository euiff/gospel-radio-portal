import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site")({ component: SiteSettings });

const fields = [
  { key: "site_name", label: "Nome do portal" },
  { key: "site_description", label: "Descrição (SEO)" },
  { key: "hero_title", label: "Título do hero" },
  { key: "hero_subtitle", label: "Subtítulo do hero" },
  { key: "footer_text", label: "Texto do rodapé" },
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
      <form onSubmit={save} className="bg-card border border-border rounded-xl p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium">{f.label}</label>
            <input value={data[f.key] ?? ""} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} className="mt-1 w-full px-3 py-2 rounded border border-input bg-background" />
          </div>
        ))}
        <button disabled={saving} className="w-full py-3 rounded gradient-gold text-gold-foreground font-semibold">{saving ? "Salvando…" : "Salvar"}</button>
      </form>
    </div>
  );
}
