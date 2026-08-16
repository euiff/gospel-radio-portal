import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Newspaper,
  Radio,
  Settings,
  Calendar,
  FolderTree,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import { MessageSquare, Heart, BookOpen, Trophy, MessagesSquare, ClipboardList, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const menu = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/programacao", label: "Programação", icon: Calendar },
  { to: "/admin/pedidos", label: "Pedidos de Música", icon: MessageSquare },
  { to: "/admin/oracao", label: "Mural de Oração", icon: Heart },
  { to: "/admin/shoutbox", label: "Shoutbox", icon: MessagesSquare },
  { to: "/admin/quiz", label: "Quiz Bíblico", icon: BookOpen },
  { to: "/admin/top-chart", label: "Top Chart", icon: Trophy },
  { to: "/admin/audit", label: "Auditoria", icon: ClipboardList },
  { to: "/admin/banners", label: "Anúncios", icon: Megaphone },
  { to: "/admin/radio", label: "Configurar Rádio", icon: Radio },
  { to: "/admin/site", label: "Configurar Site", icon: Settings },
];

function AdminMenuLink({ item, active }: { item: (typeof menu)[number]; active: boolean }) {
  const className = `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-md shadow-black/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`;
  const content = (
    <>
      <item.icon className="w-5 h-5 shrink-0" /> {item.label}
    </>
  );

  if (item.to === "/admin")
    return (
      <Link to="/admin" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/noticias")
    return (
      <Link to="/admin/noticias" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/categorias")
    return (
      <Link to="/admin/categorias" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/programacao")
    return (
      <Link to="/admin/programacao" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/pedidos")
    return (
      <Link to="/admin/pedidos" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/oracao")
    return (
      <Link to="/admin/oracao" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/shoutbox")
    return (
      <Link to="/admin/shoutbox" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/quiz")
    return (
      <Link to="/admin/quiz" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/top-chart")
    return (
      <Link to="/admin/top-chart" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/audit")
    return (
      <Link to="/admin/audit" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/banners")
    return (
      <Link to="/admin/banners" className={className}>
        {content}
      </Link>
    );
  if (item.to === "/admin/radio")
    return (
      <Link to="/admin/radio" className={className}>
        {content}
      </Link>
    );
  return (
    <Link to="/admin/site" className={className}>
      {content}
    </Link>
  );
}

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;
  if (!isAdmin)
    return (
      <div className="container mx-auto py-20 text-center px-4">
        <h1 className="font-display text-3xl text-primary">Acesso restrito</h1>
        <p className="text-muted-foreground mt-2">
          Sua conta ({user.email}) não possui permissões administrativas ativas no momento.
        </p>

        <div className="mt-10 max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 text-left shadow-sm">
          <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Já possui acesso?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se você acabou de receber permissões, tente atualizar a página ou clique no botão abaixo
            para recarregar sua sessão e verificar as novas credenciais.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full py-3 rounded-xl gradient-gold text-gold-foreground font-bold shadow-md hover:scale-[1.02] transition"
          >
            Atualizar Permissões
          </button>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl border border-border font-bold hover:bg-muted transition text-sm"
          >
            Voltar ao Site
          </Link>
          <button
            onClick={() => signOut().then(() => nav({ to: "/login" }))}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition text-sm"
          >
            Sair e entrar novamente
          </button>
        </div>
      </div>
    );

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-sidebar-border shrink-0">
        <div className="font-display text-xl text-gradient-gold font-bold">
          Painel Administrativo
        </div>
        <div className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-widest mt-1 font-semibold">
          {user.email}
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menu.map((m) => {
          const active = m.exact ? path === m.to : path.startsWith(m.to);
          return <AdminMenuLink key={m.to} item={m} active={active} />;
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-1 bg-black/10">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Home className="w-5 h-5" /> Ver site público
        </Link>
        <button
          onClick={() => signOut().then(() => nav({ to: "/" }))}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all text-left font-medium"
        >
          <LogOut className="w-5 h-5" /> Encerrar sessão
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Admin Header */}
      <header className="md:hidden bg-sidebar text-sidebar-foreground p-4 border-b border-sidebar-border flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 hover:bg-sidebar-accent rounded-lg transition"
            aria-label="Menu Admin"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-bold">Painel</span>
        </div>
        <Link
          to="/"
          className="text-xs font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground transition"
        >
          Sair do Painel
        </Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-[280px] bg-sidebar text-sidebar-foreground z-[101] shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-sidebar-foreground/60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
