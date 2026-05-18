import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/programacao")({ component: Programacao });

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function Programacao() {
  const qc = useQueryClient();
  const empty = {
    name: "",
    host: "",
    description: "",
    day_of_week: 0,
    start_time: "08:00",
    end_time: "10:00",
  };
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["progs-admin"],
    queryFn: async () =>
      (await supabase.from("programs").select("*").order("day_of_week").order("start_time")).data ??
      [],
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("programs").insert(form);
    if (error) toast.error(error.message);
    else {
      setForm(empty);
      toast.success("Programa criado");
      qc.invalidateQueries({ queryKey: ["progs-admin"] });
    }
  };
  const del = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("programs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["progs-admin"] });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-primary mb-6">Programação</h1>
      <form
        onSubmit={add}
        className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-2 gap-3 mb-6"
      >
        <input
          required
          placeholder="Nome do programa"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded border border-input bg-background sm:col-span-2"
        />
        <input
          placeholder="Apresentador"
          value={form.host}
          onChange={(e) => setForm({ ...form, host: e.target.value })}
          className="px-3 py-2 rounded border border-input bg-background"
        />
        <select
          value={form.day_of_week}
          onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
          className="px-3 py-2 rounded border border-input bg-background"
        >
          {days.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          required
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          className="px-3 py-2 rounded border border-input bg-background"
        />
        <input
          type="time"
          required
          value={form.end_time}
          onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          className="px-3 py-2 rounded border border-input bg-background"
        />
        <textarea
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="px-3 py-2 rounded border border-input bg-background sm:col-span-2"
          rows={2}
        />
        <button className="sm:col-span-2 py-2 rounded gradient-gold text-gold-foreground font-semibold inline-flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar programa
        </button>
      </form>
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">
                {p.name}{" "}
                <span className="text-xs text-muted-foreground">
                  — {days[p.day_of_week]} {p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}
                </span>
              </div>
              {p.host && <div className="text-xs text-muted-foreground">com {p.host}</div>}
            </div>
            <button
              onClick={() => del(p.id)}
              className="p-2 hover:bg-muted rounded text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Nenhum programa cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
