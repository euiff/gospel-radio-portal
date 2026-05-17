import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Radio, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Program {
  id: string;
  title: string;
  host: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
}

export function ScheduleDisplay() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [upcomingPrograms, setUpcomingPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const today = new Date().getDay();
      const { data, error } = await supabase
        .from("programming")
        .select("*")
        .eq("day_of_week", today)
        .order("start_time", { ascending: true });

      if (!error && data) {
        setPrograms(data);
        updateSchedule(data);
      }
    };

    fetchPrograms();
    const interval = setInterval(() => updateSchedule(programs), 60000); // Update every minute
    return () => clearInterval(interval);
  }, [programs.length]);

  const updateSchedule = (allPrograms: Program[]) => {
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString("pt-BR", { hour12: false });

    const current = allPrograms.find(p => 
      currentTimeStr >= p.start_time && currentTimeStr < p.end_time
    );

    const upcoming = allPrograms.filter(p => 
      p.start_time > currentTimeStr
    ).slice(0, 3);

    setCurrentProgram(current || null);
    setUpcomingPrograms(upcoming);
  };

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm h-full">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Radio className="w-5 h-5 text-primary animate-pulse" />
        <h2 className="text-xl font-display font-bold">No Ar Agora</h2>
      </div>

      {currentProgram ? (
        <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="default" className="bg-red-500 hover:bg-red-600 animate-pulse">AO VIVO</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {currentProgram.start_time.slice(0, 5)} - {currentProgram.end_time.slice(0, 5)}
            </div>
          </div>
          <h3 className="text-lg font-bold text-primary mb-1">{currentProgram.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            {currentProgram.host}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
          Nenhum programa ao vivo no momento.
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Próximos Programas</h4>
        {upcomingPrograms.length > 0 ? (
          upcomingPrograms.map((prog) => (
            <div key={prog.id} className="flex items-center gap-4 group">
              <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {prog.start_time.slice(0, 5)}
              </div>
              <div className="flex-1 border-l-2 border-transparent group-hover:border-primary pl-3 transition-colors">
                <p className="text-sm font-medium leading-none mb-1">{prog.title}</p>
                <p className="text-xs text-muted-foreground">{prog.host}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">Fim da programação de hoje.</p>
        )}
      </div>
    </div>
  );
}