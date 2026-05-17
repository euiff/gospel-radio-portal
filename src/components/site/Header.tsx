import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultNav = [
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
     const [isOpen, setIsOpen] = useState(false);

    const { data: siteSettings } = useQuery({
      queryKey: ["site-settings-header"],
      queryFn: async () => {
        const { data } = await supabase.from("site_settings").select("logo_url, navigation_menu").limit(1).maybeSingle();
        return data;
      }
    });

    const nav = (siteSettings?.navigation_menu as any[]) || defaultNav;
   
     // Close menu on path change
     useEffect(() => {
       setIsOpen(false);
     }, [path]);
  
    return (
      <header className="bg-background border-b border-border sticky top-0 z-40 lg:relative lg:z-auto">
       <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
         <Link to="/" className="font-display text-2xl font-bold text-primary shrink-0">
           {siteSettings?.logo_url ? (
             <img src={siteSettings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
           ) : (
             <>
               Rádio<span className="text-gradient-gold">Gospel</span>
             </>
           )}
         </Link>
 
         {/* Desktop Navigation */}
         <nav className="hidden lg:flex items-center gap-1">
           {nav.map((n) => {
             const active = path === n.to;
             return (
               <Link key={n.to} to={n.to}
                 className={`nav-link text-sm font-medium rounded-md transition ${active ? "text-accent" : "text-foreground/70 hover:text-primary hover:bg-muted"}`}>
                 {n.label}
               </Link>
             );
           })}
         </nav>
 
         <div className="flex items-center gap-2">
           {isAdmin && (
             <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-sm">
               <LayoutDashboard className="w-4 h-4" /> Admin
             </Link>
           )}
           {!user && (
             <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition">
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
                     <SheetTitle className="font-display text-xl font-bold text-primary">Navegação</SheetTitle>
                   </SheetHeader>
                   <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                     {nav.map((n) => {
                       const active = path === n.to;
                       return (
                         <Link key={n.to} to={n.to}
                           className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition ${active ? "bg-accent/10 text-accent border border-accent/20" : "text-foreground/70 hover:bg-muted"}`}>
                           {n.label}
                         </Link>
                       );
                     })}
                     <hr className="my-4 border-border" />
                     {isAdmin && (
                       <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium shadow-md">
                         <LayoutDashboard className="w-5 h-5" /> Painel Admin
                       </Link>
                     )}
                     {!user && (
                       <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border font-medium">
                         <LogIn className="w-5 h-5" /> Entrar
                       </Link>
                     )}
                   </nav>
                   <div className="p-6 text-center text-xs text-muted-foreground border-t border-border">
                     Rádio Gospel © 2026
                   </div>
                 </div>
               </SheetContent>
             </Sheet>
         </div>
       </div>
 
     </header>
   );
 }
