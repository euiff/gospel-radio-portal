import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, LogIn } from "lucide-react";

const nav = [
  { to: "/", label: "Início" },
  { to: "/categoria/noticias", label: "Notícias" },
  { to: "/categoria/musica", label: "Música" },
  { to: "/categoria/eventos", label: "Eventos" },
  { to: "/categoria/devocional", label: "Devocional" },
  { to: "/programacao", label: "Programação" },
];

export function Header() {
  const { user, isAdmin } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">
          Rádio<span className="text-gradient-gold">Gospel</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${active ? "text-accent" : "text-foreground/70 hover:text-primary hover:bg-muted"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
          )}
          {!user && (
            <Link to="/login" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
