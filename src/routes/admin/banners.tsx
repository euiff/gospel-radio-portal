import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/banners")({ component: Banners });

const POSITIONS = [
  { value: "hero", label: "Topo (abaixo do destaque)" },
  { value: "home-mid", label: "Meio da home" },
  { value: "player", label: "Próximo ao player / ouvinte" },
  { value: "footer", label: "Rodapé" },
];

function Banners() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("hero");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["banners-admin"],
    queryFn: async () =>
      (await supabase.from("banners").select("*").order("position").order("sort_order")).data ?? [],
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["banners-admin"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return toast.error("Envie a imagem do anúncio");
    setSaving(true);
    const { error } = await supabase.from("banners").insert({
      title,
      image_url: imageUrl,
      link_url: linkUrl || null,
      position,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    toast.success("Anúncio publicado");
    refresh();
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("banners").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(!active ? "Anúncio ativado" : "Anúncio pausado");
      refresh();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este anúncio?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Anúncio excluído");
      refresh();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-primary">Anúncios</h1>
        <p className="text-muted-foreground text-sm">
          Banners de publicidade exibidos no app. Escolha a posição e ative/pause quando quiser.
        </p>
      </div>

      <form onSubmit={add} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Título / anunciante</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background"
              placeholder="Ex.: Loja Fé & Vida"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Link ao clicar (opcional)</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Posição no app</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          label="Imagem do anúncio (recomendado 1200x400)"
          aspect={3}
        />

        <button
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl gradient-gold text-gold-foreground font-bold disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> {saving ? "Publicando…" : "Publicar anúncio"}
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {(data ?? []).map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <img src={b.image_url} alt={b.title} className="w-full h-36 object-cover" loading="lazy" />
            <div className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {POSITIONS.find((p) => p.value === b.position)?.label ?? b.position} ·{" "}
                  {b.active ? "Ativo" : "Pausado"}
                </p>
              </div>
              <button
                onClick={() => toggle(b.id, b.active)}
                className="p-2 rounded-lg hover:bg-muted"
                aria-label={b.active ? "Pausar" : "Ativar"}
              >
                {b.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => del(b.id)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                aria-label="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum anúncio cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
