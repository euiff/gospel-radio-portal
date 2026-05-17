import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Newspaper, Radio, Settings, Calendar, FolderTree, LogOut, Home } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const menu = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/programacao", label: "Programação", icon: Calendar },
  { to: "/admin/radio", label: "Configurar Rádio", icon: Radio },
  { to: "/admin/site", label: "Configurar Site", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="font-display text-3xl text-primary">Acesso restrito</h1>
      <p className="text-muted-foreground mt-2">Sua conta não tem permissão de administrador.</p>
      <p className="text-sm text-muted-foreground mt-4">Atribua o papel <code>admin</code> à sua conta na tabela <code>user_roles</code> via Lovable Cloud.</p>
      <button onClick={() => signOut().then(() => nav({ to: "/login" }))} className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground">Sair</button>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-72px)] flex bg-secondary">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <div className="font-display text-xl">Painel Admin</div>
          <div className="text-xs text-sidebar-foreground/60 truncate">{user.email}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menu.map((m) => {
            const active = m.exact ? path === m.to : path.startsWith(m.to);
            return (
              <Link key={m.to} to={m.to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent"}`}>
                <m.icon className="w-4 h-4" /> {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent"><Home className="w-4 h-4" /> Ver site</Link>
          <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-left"><LogOut className="w-4 h-4" /> Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
