import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRadio } from "@/lib/radio-context";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/radio")({ component: RadioSettings });

const fields: Array<{
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  aspect?: number;
}> = [
  { key: "station_name", label: "Nome da rádio" },
  { key: "tagline", label: "Slogan" },
  {
    key: "stream_url",
    label: "URL do stream",
    placeholder: "https://stream.suaradio.com/live",
    hint: "Aceita Shoutcast / Icecast / HLS / MP3",
  },
  {
    key: "api_now_playing",
    label: "API Agora Tocando (JSON)",
    placeholder: "https://api.suaradio.com/nowplaying",
    hint: "URL que retorna JSON com campo 'title' ou 'song'",
  },
  { key: "logo_url", label: "Logo da Rádio", type: "image", aspect: 1 },
  { key: "cover_url", label: "Capa do Player", type: "image", aspect: 1.777 },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "5511999998888",
    hint: "Somente números com DDI+DDD",
  },
  { key: "instagram", label: "Instagram (URL)" },
  { key: "facebook", label: "Facebook (URL)" },
  { key: "youtube", label: "YouTube (URL)" },
];

function RadioSettings() {
  const { reload } = useRadio();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("radio_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setData(data ?? {}));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...data };
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = data?.id
      ? await supabase.from("radio_settings").update(payload).eq("id", data.id)
      : await supabase.from("radio_settings").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Configurações salvas!");
      reload();
    }
  };

  if (!data) return <div>Carregando…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl text-primary mb-2">Configurar Rádio</h1>
      <p className="text-muted-foreground mb-8">
        Defina o stream, o nome e as redes sociais que aparecem no player.
      </p>
      <form onSubmit={save} className="bg-card border border-border rounded-xl p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            {f.type === "image" ? (
              <ImageUpload
                label={f.label}
                value={data[f.key] ?? ""}
                onChange={(url) => setData({ ...data, [f.key]: url })}
                aspect={(f as any).aspect}
              />
            ) : (
              <>
                <label className="text-sm font-medium">{f.label}</label>
                <input
                  value={data[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded border border-input bg-background"
                />
              </>
            )}
            {f.hint && <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>}
          </div>
        ))}
        <button
          disabled={saving}
          className="w-full py-3 rounded gradient-gold text-gold-foreground font-semibold disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
