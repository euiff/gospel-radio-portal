import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Music, MessageSquare } from "lucide-react";

const formSchema = z.object({
  userName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  songTitle: z.string().min(1, "Título da música é obrigatório"),
  artist: z.string().min(1, "Nome do artista é obrigatório"),
  message: z.string().optional(),
});

export function SongRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      songTitle: "",
      artist: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("song_requests").insert({
        user_name: values.userName,
        song_title: values.songTitle,
        artist: values.artist,
        message: values.message,
      });

      if (error) throw error;

      toast.success("Pedido enviado! Sua música foi solicitada com sucesso.");

      // WhatsApp Integration (Example number, should be configurable)
      const whatsappNumber = "5511999999999"; 
      const text = encodeURIComponent(
        `*Pedido de Música - Portal Gospel*\n\n*Nome:* ${values.userName}\n*Música:* ${values.songTitle}\n*Artista:* ${values.artist}\n*Mensagem:* ${values.message || "Sem mensagem"}`
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");

      form.reset();
    } catch (error) {
      toast.error("Erro ao enviar: Ocorreu um problema ao processar seu pedido.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Music className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Peça sua Música</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Como você quer ser chamado?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="songTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Música</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da música" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artista/Banda</FormLabel>
                  <FormControl>
                    <Input placeholder="Quem canta?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Oferecimento/Mensagem (Opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Para quem você oferece essa música?" 
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            <MessageSquare className="w-4 h-4" />
            {isLoading ? "Enviando..." : "Enviar Pedido via WhatsApp"}
          </Button>
        </form>
      </Form>
    </div>
  );
}