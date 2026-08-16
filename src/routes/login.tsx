import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Painel da Rádio" },
      {
        name: "description",
        content:
          "Acesso restrito à equipe: entre com seu e-mail e senha para gerenciar a programação, notícias e pedidos da rádio.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    setTimeout(() => nav({ to: "/admin" }), 0);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
        nav({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se necessário.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-glow">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-accent focus-visible:outline-none focus-visible:underline"
        >
          ← Início
        </Link>
        <h1 className="font-display text-4xl text-primary mt-4 mb-2">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Acesso ao painel administrativo</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>
          <button
            disabled={loading}
            className="w-full py-3 rounded-md gradient-gold text-gold-foreground font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 transition"
          >
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Cadastrar"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-primary hover:text-accent focus-visible:outline-none focus-visible:underline w-full"
        >
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Após criar a primeira conta, conceda a si mesmo o papel de admin no painel do Lovable
          Cloud (tabela <code>user_roles</code>).
        </p>
      </div>
    </main>
  );
}
