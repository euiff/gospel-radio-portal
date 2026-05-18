import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos")({ component: AdminRequests });

function AdminRequests() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-song-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("song_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("song_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-song-requests"] });
      toast.success("Status atualizado!");
    },
  });

  if (isLoading) return <div>Carregando pedidos...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-primary">Pedidos de Música</h1>
        <p className="text-muted-foreground">Gerencie as solicitações feitas pelos ouvintes.</p>
      </header>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ouvinte</TableHead>
              <TableHead>Música / Artista</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.user_name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{req.song_title}</span>
                    <span className="text-xs text-muted-foreground">{req.artist}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      req.status === "played"
                        ? "default"
                        : req.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {req.status === "played"
                      ? "Tocado"
                      : req.status === "pending"
                        ? "Pendente"
                        : "Recusado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {req.status === "pending" && (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "played" })}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "rejected" })}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
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
