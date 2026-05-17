import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/oracao")({ component: AdminPrayer });

function AdminPrayer() {
  const queryClient = useQueryClient();
  const { data: prayers, isLoading } = useQuery({
    queryKey: ["admin-prayers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prayer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from("prayer_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-prayers"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-prayers"] });
      toast.success("Pedido excluído!");
    },
  });

  if (isLoading) return <div>Carregando mural...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-primary">Mural de Oração</h1>
        <p className="text-muted-foreground">Modere os pedidos de oração antes que apareçam no site.</p>
      </header>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autor</TableHead>
              <TableHead className="max-w-md">Pedido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prayers?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.user_name}</TableCell>
                <TableCell className="max-w-md truncate">{p.content}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                    {p.status === 'approved' ? 'Aprovado' : p.status === 'pending' ? 'Pendente' : 'Arquivado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {p.status !== 'approved' && (
                      <Button size="icon" variant="outline" onClick={() => updateStatus.mutate({ id: p.id, status: 'approved' })}>
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {p.status !== 'archived' && (
                      <Button size="icon" variant="outline" onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })}>
                        <X className="w-4 h-4 text-orange-500" />
                      </Button>
                    )}
                    <Button size="icon" variant="destructive" onClick={() => {
                      if(confirm("Deseja excluir permanentemente?")) deleteRequest.mutate(p.id);
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}