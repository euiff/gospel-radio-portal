import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 import { Clock, Calendar } from "lucide-react";

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
     <main className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
       <div className="max-w-3xl mb-12">
         <h1 className="font-display leading-tight text-primary">Grade de Programação</h1>
         <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
           Sintonize conosco e acompanhe os melhores louvores, notícias e mensagens de fé durante toda a semana.
         </p>
       </div>
 
       <div className="space-y-16">
         {days.map((dayName, idx) => {
           const items = (data ?? []).filter((p: any) => p.day_of_week === idx);
           if (items.length === 0) return null;
           return (
             <div key={idx} className="relative">
               <div className="sticky top-[140px] z-20 bg-background/95 backdrop-blur-md py-4 border-b border-border mb-8">
                 <h2 className="font-display text-3xl text-primary flex items-center gap-3">
                   <span className="w-8 h-8 rounded-lg gradient-gold text-gold-foreground flex items-center justify-center text-sm font-bold">{dayName.slice(0,1)}</span>
                   {dayName}
                 </h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {items.map((p: any) => (
                   <div key={p.id} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                     <div className="flex items-center gap-2 text-accent text-sm font-bold mb-4">
                       <Clock className="w-4 h-4" />
                       <span className="bg-accent/10 px-2 py-0.5 rounded-md">
                         {p.start_time?.slice(0,5)} – {p.end_time?.slice(0,5)}
                       </span>
                     </div>
                     <h3 className="font-display text-2xl text-primary mb-2 group-hover:text-accent transition-colors leading-tight">
                       {p.name}
                     </h3>
                     {p.host && (
                       <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium italic mt-4 border-t border-border pt-4">
                         <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary not-italic">
                           {p.host.slice(0,1)}
                         </div>
                         Apresentado por {p.host}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           );
         })}
         {(!data || data.length === 0) && (
           <div className="text-center py-32 bg-muted/30 rounded-3xl border border-dashed border-border">
             <Calendar className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
             <p className="text-muted-foreground text-lg italic">A programação completa está sendo atualizada. Volte em breve!</p>
           </div>
         )}
       </div>
     </main>
   );
}
