 import { Link, useRouterState } from "@tanstack/react-router";
 import { useAuth } from "@/lib/auth-context";
 import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
  import { useState, useEffect, useRef } from "react";

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
    const [isOpen, setIsOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const firstElementRef = useRef<HTMLButtonElement>(null);
  
    // Close menu on path change
    useEffect(() => {
      setIsOpen(false);
    }, [path]);
  
    // Accessibility and scroll lock
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        // Focus first element in menu
        setTimeout(() => firstElementRef.current?.focus(), 100);
  
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') setIsOpen(false);
          if (e.key === 'Tab' && mobileMenuRef.current) {
            const focusableElements = mobileMenuRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        };
  
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      } else {
        document.body.style.overflow = 'unset';
        // Restore focus to toggle button when closed
        toggleRef.current?.focus();
      }
    }, [isOpen]);
  
    return (
      <header className="bg-background border-b border-border sticky top-0 z-40 lg:relative lg:z-auto">
       <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
         <Link to="/" className="font-display text-2xl font-bold text-primary shrink-0">
           Rádio<span className="text-gradient-gold">Gospel</span>
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
           
            {/* Mobile Menu Toggle */}
            <button 
              ref={toggleRef}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary transition text-primary"
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
         </div>
       </div>
 
       {/* Mobile Sidebar Overlay */}
       {isOpen && (
         <div 
           className="fixed inset-0 z-50 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
           onClick={() => setIsOpen(false)}
         />
       )}
 
        {/* Mobile Sidebar */}
        <div 
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de Navegação"
          className={`fixed top-0 right-0 bottom-0 z-50 w-[80%] max-w-sm bg-background border-l border-border transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-display text-xl font-bold text-primary">Navegação</span>
              <button 
                ref={firstElementRef}
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-muted rounded-full focus-visible:ring-2 focus-visible:ring-primary transition"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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
       </div>
     </header>
   );
 }
