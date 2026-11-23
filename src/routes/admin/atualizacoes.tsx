import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RefreshCw, GitBranch, ExternalLink, ShieldCheck, AlertTriangle, Rocket } from "lucide-react";

type Latest = { sha: string; shortSha: string; message: string; date: string | null; url: string };
type Info = { repository: string; branch: string; latest: Latest; deployConfigured: boolean; notice: string };

export const Route = createFileRoute("/admin/atualizacoes")({
  head: () => ({ meta: [{ title: "Atualizações — Administração" }, { name: "robots", content: "noindex" }] }),
  component: Updates,
});

function Updates() {
  const { session } = useAuth();
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(method: "GET" | "POST") {
    const token = session?.access_token;
    if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
    const response = await fetch("/api/admin/updates", {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
    return data;
  }

  async function check() {
    setBusy(true); setError(""); setMessage("");
    try { setInfo(await request("GET")); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao consultar GitHub."); }
    finally { setBusy(false); }
  }

  async function deploy() {
    if (!window.confirm("Deseja solicitar uma nova implantação da versão main do GitHub?")) return;
    setDeploying(true); setError(""); setMessage("");
    try { const result = await request("POST"); setMessage(result.message); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao solicitar implantação."); }
    finally { setDeploying(false); }
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary">Atualizações do Sistema</h1>
        <p className="text-muted-foreground mt-2">Consulte o GitHub e solicite uma implantação com segurança.</p>
      </header>
      <section className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-5">
        <div className="flex gap-3 items-center"><GitBranch className="w-6 h-6 text-accent" />
          <div><h2 className="font-bold">Repositório oficial</h2><p className="text-sm text-muted-foreground">euiff/gospel-radio-portal · main (privado)</p></div>
        </div>
        <button onClick={check} disabled={busy || deploying}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold hover:bg-muted disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Consultando…" : "Verificar atualizações"}
        </button>
        {info && (
          <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-3">
            <p className="text-sm"><strong>Último commit:</strong> {info.latest.shortSha}</p>
            <p className="text-sm"><strong>Alterações:</strong> {info.latest.message}</p>
            {info.latest.date && <p className="text-sm"><strong>Publicado:</strong> {new Date(info.latest.date).toLocaleString("pt-BR")}</p>}
            <a href={info.latest.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent underline">
              Ver alterações no GitHub <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-xs text-muted-foreground">A versão atualmente publicada não é determinada por esta consulta; confirme-a na hospedagem.</p>
          </div>
        )}
        {info?.deployConfigured ? (
          <button onClick={deploy} disabled={deploying || busy}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50">
            <Rocket className="w-5 h-5" />{deploying ? "Solicitando…" : "Atualizar sistema"}
          </button>
        ) : info ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>Atualização ainda não habilitada: configure a variável VERCEL_DEPLOY_HOOK_URL na hospedagem. O site não será alterado até essa configuração.</p>
          </div>
        ) : null}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-primary">{message}</p>}
      </section>
      <div className="flex gap-3 bg-muted/50 rounded-xl p-5 text-sm text-muted-foreground">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <p>Apenas administradores autorizados podem solicitar uma implantação. Este botão não instala código diretamente no cPanel nem substitui o banco de dados. Para hospedagem cPanel é necessária uma rotina própria de deploy.</p>
      </div>
    </div>
  );
}
