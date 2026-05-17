import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  userName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  content: z.string().min(10, "O pedido de oração deve ser mais detalhado"),
});

interface PrayerRequest {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export function PrayerMural() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      content: "",
    },
  });

  useEffect(() => {
    const fetchPrayers = async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setPrayers(data);
      }
    };

    fetchPrayers();

    // Real-time updates
    const channel = supabase
      .channel("public:prayer_requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prayer_requests" },
        () => fetchPrayers()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "prayer_requests" },
        () => fetchPrayers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        user_name: values.userName,
        content: values.content,
        status: "pending", // Default to pending for moderation
      });

      if (error) throw error;

      toast.success("Pedido enviado! Seu pedido passará por moderação antes de aparecer no mural.");
      form.reset();
    } catch (error) {
      toast.error("Erro ao enviar pedido de oração.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-card p-6 rounded-xl border shadow-sm sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="text-xl font-display font-bold">Mural de Oração</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Deixe aqui seu pedido de oração. Nossa equipe e comunidade estarão intercedendo por você.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome ou apelido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido de Oração</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Pelo que você gostaria que orássemos?" 
                        className="resize-none h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                <Send className="w-4 h-4" />
                {isLoading ? "Enviando..." : "Enviar Pedido"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Pedidos Recentes
        </h3>
        {prayers.length > 0 ? (
          prayers.map((prayer) => (
            <div key={prayer.id} className="bg-card p-5 rounded-xl border shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-primary">{prayer.user_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-foreground/80 italic leading-relaxed">
                "{prayer.content}"
              </p>
              <div className="mt-4 pt-4 border-t flex gap-4">
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                  <Heart className="w-3.5 h-3.5" />
                  Estou Orando
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground">Nenhum pedido de oração público no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}