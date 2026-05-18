import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/site")({ component: SiteSettings });

const sections = [
  {
    title: "Identidade Visual & Cores",
    fields: [
      { key: "site_name", label: "Nome do Portal / Rádio" },
      { key: "logo_url", label: "URL do Logo (SVG ou PNG transparente recomendado)" },
      { key: "primary_color", label: "Cor Primária (Fundo, Menus)", type: "color" },
      { key: "accent_color", label: "Cor de Destaque (Botões, Links)", type: "color" },
    ],
  },
  {
    title: "SEO & Redes Sociais",
    fields: [{ key: "site_description", label: "Descrição SEO (O que aparece no Google)" }],
  },
  {
    title: "Página Inicial (Hero)",
    fields: [
      { key: "hero_title", label: "Título Principal (Hero)" },
      { key: "hero_subtitle", label: "Subtítulo / Slogan (Hero)" },
    ],
  },
  {
    title: "Rodapé",
    fields: [{ key: "footer_text", label: "Texto Personalizado do Rodapé" }],
  },
];

function SiteSettings() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setData(data ?? { navigation_menu: [] });
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...data };
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = data?.id
      ? await supabase.from("site_settings").update(payload).eq("id", data.id)
      : await supabase.from("site_settings").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Site atualizado!");
  };

  if (!data) return <div>Carregando…</div>;

  const addMenuItem = () => {
    const menu = [...(data.navigation_menu || [])];
    menu.push({ label: "Novo Link", to: "/" });
    setData({ ...data, navigation_menu: menu });
  };

  const removeMenuItem = (index: number) => {
    const menu = [...(data.navigation_menu || [])];
    menu.splice(index, 1);
    setData({ ...data, navigation_menu: menu });
  };

  const updateMenuItem = (index: number, field: string, value: string) => {
    const menu = [...(data.navigation_menu || [])];
    menu[index] = { ...menu[index], [field]: value };
    setData({ ...data, navigation_menu: menu });
  };

  return (
    <div className="max-w-4xl pb-12">
      <h1 className="font-display text-4xl text-primary mb-2">Configurar Site</h1>
      <p className="text-muted-foreground mb-8">Textos institucionais e SEO.</p>
      <form onSubmit={save} className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-card border border-border rounded-xl p-6 space-y-6"
          >
            <h2 className="text-xl font-display text-primary border-b border-border pb-2">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((f) => (
                <div
                  key={f.key}
                  className={f.type === "color" ? "col-span-1" : "col-span-1 md:col-span-2"}
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {f.label}
                  </label>
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
                        className="flex-1 px-4 py-3 rounded-xl border border-input bg-background font-mono text-sm uppercase"
                        placeholder="#000000"
                      />
                    </div>
                  ) : (
                    <input
                      value={data[f.key] ?? ""}
                      onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition shadow-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display text-primary">Menu de Navegação</h2>
            <button
              type="button"
              onClick={addMenuItem}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>

          <div className="space-y-3">
            {(data.navigation_menu || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex gap-3 items-end p-4 bg-muted/30 rounded-xl border border-border"
              >
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Rótulo
                  </label>
                  <input
                    value={item.label}
                    onChange={(e) => updateMenuItem(idx, "label", e.target.value)}
                    placeholder="Ex: Contato"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
                <div className="flex-[2] space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Link (URL ou Rota)
                  </label>
                  <input
                    value={item.to}
                    onChange={(e) => updateMenuItem(idx, "to", e.target.value)}
                    placeholder="Ex: /contato ou https://..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMenuItem(idx)}
                  className="p-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
