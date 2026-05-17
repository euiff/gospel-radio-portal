import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categorias")({ component: Categorias });

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Categorias() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data } = useQuery({ queryKey: ["cats-admin"], queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [] });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
    if (error) toast.error(error.message); else { setName(""); toast.success("Categoria criada"); qc.invalidateQueries({ queryKey: ["cats-admin"] }); }
  };
  const del = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["cats-admin"] });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl text-primary mb-6">Categorias</h1>
      <form onSubmit={add} className="bg-card border border-border rounded-xl p-4 flex gap-2 mb-6">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" className="flex-1 px-3 py-2 rounded border border-input bg-background" />
        <button className="px-4 rounded gradient-gold text-gold-foreground font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar</button>
      </form>
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">/{c.slug}</div></div>
            <button onClick={() => del(c.id)} className="p-2 hover:bg-muted rounded text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
