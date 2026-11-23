import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function authorized(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY)
    return false;
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data: auth, error: authError } = await db.auth.getUser(bearer);
  if (authError || !auth.user) return false;
  const { data, error } = await db.from("user_roles")
    .select("role").eq("user_id", auth.user.id).eq("role", "admin").limit(1);
  return !error && !!data?.length;
}

async function githubLatest() {
  const token = process.env.GITHUB_UPDATER_TOKEN;
  if (!token) throw new Error("GITHUB_UPDATER_TOKEN não configurado no servidor.");
  const response = await fetch("https://api.github.com/repos/euiff/gospel-radio-portal/commits/main", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "gospel-radio-portal-updater" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Não foi possível verificar a versão no repositório privado.");
  const commit = await response.json();
  return {
    sha: String(commit.sha || ""),
    shortSha: String(commit.sha || "").slice(0, 7),
    message: String(commit.commit?.message || "").split("\n")[0].slice(0, 180),
    date: commit.commit?.committer?.date ?? null,
    url: `https://github.com/euiff/gospel-radio-portal/commit/${commit.sha}`,
  };
}

export const Route = createFileRoute("/api/admin/updates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          if (!(await authorized(request))) return json({ error: "Acesso administrativo necessário." }, 403);
          const latest = await githubLatest();
          return json({
            repository: "euiff/gospel-radio-portal", branch: "main", latest,
            deployConfigured: Boolean(process.env.VERCEL_DEPLOY_HOOK_URL),
            deploymentType: "vercel-hook",
            notice: "O botão solicita uma nova implantação. A disponibilidade só é confirmada após o deploy finalizar.",
          });
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "Erro ao verificar atualizações." }, 503);
        }
      },
      POST: async ({ request }) => {
        try {
          if (!(await authorized(request))) return json({ error: "Acesso administrativo necessário." }, 403);
          const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
          if (!hook) return json({ error: "Configure VERCEL_DEPLOY_HOOK_URL no servidor antes de atualizar." }, 409);
          const hookUrl = new URL(hook);
          if (hookUrl.protocol !== "https:" || hookUrl.hostname !== "api.vercel.com" ||
              !hookUrl.pathname.startsWith("/v1/integrations/deploy/"))
            return json({ error: "A URL de deploy configurada não é um hook válido da Vercel." }, 500);
          const response = await fetch(hookUrl.toString(), { method: "POST", signal: AbortSignal.timeout(15000) });
          if (!response.ok) return json({ error: "A plataforma recusou a solicitação de implantação." }, 502);
          return json({ triggered: true, message: "Implantação solicitada. Aguarde a confirmação na plataforma de hospedagem; esta mensagem não confirma que o site já foi atualizado." }, 202);
        } catch {
          return json({ error: "Não foi possível iniciar a implantação." }, 503);
        }
      },
    },
  },
});
