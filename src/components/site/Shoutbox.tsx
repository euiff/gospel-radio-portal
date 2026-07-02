import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { z } from "zod";

interface ShoutMessage {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(40),
  message: z.string().trim().min(2, "Mensagem muito curta").max(240),
});

export function Shoutbox() {
  const [messages, setMessages] = useState<ShoutMessage[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("shoutbox_messages")
      .select("id,name,message,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setMessages((data ?? []) as ShoutMessage[]));

    const channel = supabase
      .channel("shoutbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shoutbox_messages" },
        (payload) => {
          const m = payload.new as ShoutMessage & { approved: boolean };
          if (m.approved) setMessages((prev) => [m, ...prev].slice(0, 30));
        },
      )
      .subscribe();

    const savedName = typeof window !== "undefined" ? localStorage.getItem("shout-name") : null;
    if (savedName) setName(savedName);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, message: text });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from("shoutbox_messages")
      .insert({ name: parsed.data.name, message: parsed.data.message });
    setSending(false);
    if (error) return toast.error("Não foi possível enviar. Tente novamente.");
    localStorage.setItem("shout-name", parsed.data.name);
    setText("");
    toast.success("Mensagem enviada ao vivo! 🎙️");
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-premium overflow-hidden flex flex-col h-full">
      <div className="gradient-deep text-white px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl leading-tight">Shoutbox ao Vivo</h3>
          <p className="text-xs text-white/60">Fale com a rádio em tempo real</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[340px] min-h-[220px]">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent/60" />
            Seja o primeiro a mandar um recado!
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 uppercase">
              {m.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-snug break-words">{m.message}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="p-3 border-t border-border bg-muted/30 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          maxLength={40}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mande um recado..."
            maxLength={240}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={sending}
            aria-label="Enviar mensagem"
            className="shrink-0 w-11 h-11 rounded-lg gradient-gold text-gold-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition shadow disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-right">{text.length}/240</p>
      </form>
    </div>
  );
}