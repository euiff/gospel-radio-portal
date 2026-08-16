import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, LogIn, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRadio } from "@/lib/radio-context";
import appIcon from "@/assets/app-icon.png";

const defaultNav = [
  { to: "/", label: "Início" },
  { to: "/categoria/noticias", label: "Notícias" },
  { to: "/categoria/musica", label: "Música" },
  { to: "/categoria/eventos", label: "Eventos" },
  { to: "/categoria/devocional", label: "Devocional" },
  { to: "/programacao", label: "Programação" },
  { to: "/ouvinte", label: "Ouvinte" },
  { to: "/pedidos", label: "Pedidos" },
];

const FALLBACK_STATION_NAME = "Alternativa gospel";

type NavItem = { to?: string; label?: string };

function PublicNavLink({ item, className }: { item: NavItem; className: string }) {
  const label = item.label || "Link";
  const to = item.to || "/";
  const categoryMatch = to.match(/^\/categoria\/([^/]+)$/);

  if (to === "/")
    return (
      <Link to="/" className={className}>
        {label}
      </Link>
    );
  if (to === "/programacao")
    return (
      <Link to="/programacao" className={className}>
        {label}
      </Link>
    );
  if (to === "/ouvinte")
    return (
      <Link to="/ouvinte" className={className}>
        {label}
      </Link>
    );
  if (to === "/pedidos")
    return (
      <Link to="/pedidos" className={className}>
        {label}
      </Link>
    );
  if (to === "/login")
    return (
      <Link to="/login" className={className}>
        {label}
      </Link>
    );
  if (to === "/admin")
    return (
      <Link to="/admin" className={className}>
        {label}
      </Link>
    );
  if (categoryMatch)
    return (
      <Link to="/categoria/$slug" params={{ slug: categoryMatch[1] }} className={className}>
        {label}
      </Link>
    );

  const external = /^https?:\/\//.test(to);
  return (
    <a
      href={to}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {label}
    </a>
  );
}

export function Header() {
  const { user, isAdmin } = useAuth();
  const { settings: radioSettings } = useRadio();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [isOpen, setIsOpen] = useState(false);
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-header"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("logo_url, navigation_menu, logo_settings")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const stationName = radioSettings?.station_name || FALLBACK_STATION_NAME;
  const nav = (siteSettings?.navigation_menu as NavItem[] | null) || defaultNav;

  // Close menu on path change
  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40 lg:relative lg:z-auto">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {(() => {
          const logoSettings = (siteSettings as any)?.logo_settings || { mobile: "small", desktop: "medium" };
          const mobileHeight = logoSettings.mobile === 'small' ? 'h-8' : logoSettings.mobile === 'large' ? 'h-14' : 'h-10';
          const desktopHeight = logoSettings.desktop === 'small' ? 'md:h-12' : logoSettings.desktop === 'large' ? 'md:h-24' : 'md:h-16';

          return (
            <Link to="/" className="font-display text-2xl md:text-3xl font-bold text-primary shrink-0 flex items-center h-full">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt="Logo"
                  className={`${mobileHeight} ${desktopHeight} w-auto max-w-[200px] md:max-w-[300px] object-contain transition-all duration-300 hover:scale-105`}
                />
              ) : (
                <span className="flex items-center gap-2">
                  <img
                    src={appIcon}
                    alt=""
                    width={40}
                    height={40}
                    className={`${mobileHeight} ${desktopHeight} w-auto rounded-xl shadow-sm`}
                  />
                  <span className="truncate max-w-[9rem] sm:max-w-none">{stationName}</span>
                </span>
              )}
            </Link>
          );
        })()}

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <PublicNavLink
                key={`${n.to}-${n.label}`}
                item={n}
                className={`nav-link text-sm font-medium rounded-md transition ${active ? "text-accent" : "text-foreground/70 hover:text-primary hover:bg-muted"}`}
              />
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
          )}
          {!user && (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary transition text-primary"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] max-w-sm p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-4 border-b border-border text-left">
                  <SheetTitle className="font-display text-xl font-bold text-primary">
                    Navegação
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  {nav.map((n) => {
                    const active = path === n.to;
                    return (
                      <PublicNavLink
                        key={`${n.to}-${n.label}`}
                        item={n}
                        className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition ${active ? "bg-accent/10 text-accent border border-accent/20" : "text-foreground/70 hover:bg-muted"}`}
                      />
                    );
                  })}
                  <hr className="my-4 border-border" />
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium shadow-md"
                    >
                      <LayoutDashboard className="w-5 h-5" /> Painel Admin
                    </Link>
                  )}
                  {!user && (
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border font-medium"
                    >
                      <LogIn className="w-5 h-5" /> Entrar
                    </Link>
                  )}
                </nav>
                <div className="p-6 text-center text-xs text-muted-foreground border-t border-border">
                  {stationName} © 2026
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
