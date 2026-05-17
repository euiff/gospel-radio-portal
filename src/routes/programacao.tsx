import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/programacao")({
  head: () => ({ meta: [{ title: "Programação — Rádio Gospel" }] }),
  component: Programacao,
});

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function Programacao() {
  const { data } = useQuery({
    queryKey: ["programs-all"],
    queryFn: async () => (await supabase.from("programs").select("*").order("day_of_week").order("start_time")).data ?? [],
  });

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="font-display text-5xl text-primary mb-2">Programação</h1>
      <p className="text-muted-foreground mb-10">A grade completa da nossa rádio.</p>
      <div className="space-y-8">
        {days.map((dayName, idx) => {
          const items = (data ?? []).filter((p: any) => p.day_of_week === idx);
          if (items.length === 0) return null;
          return (
            <div key={idx}>
              <h2 className="font-display text-3xl text-primary border-b border-border pb-2 mb-4">{dayName}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((p: any) => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 text-accent text-sm font-semibold"><Clock className="w-4 h-4" />{p.start_time?.slice(0,5)} – {p.end_time?.slice(0,5)}</div>
                    <h3 className="font-display text-xl text-primary mt-2">{p.name}</h3>
                    {p.host && <p className="text-sm text-muted-foreground">com {p.host}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(!data || data.length === 0) && <p className="text-center text-muted-foreground py-20">Nenhum programa cadastrado.</p>}
      </div>
    </main>
  );
}
