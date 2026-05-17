  import { useEffect, useState } from "react";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { Outlet, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts, Link } from "@tanstack/react-router";
 import { supabase } from "@/integrations/supabase/client";
  function ThemeSync() {
    const [settings, setSettings] = useState<{ primary_color?: string | null; accent_color?: string | null } | null>(null);
 
   useEffect(() => {
     if (typeof window === "undefined") return;
     let cancelled = false;
     (async () => {
       try {
         const { data } = await supabase.from("site_settings").select("primary_color, accent_color").limit(1).maybeSingle();
         if (!cancelled && data) setSettings(data);
       } catch {}
     })();
     return () => { cancelled = true; };
   }, []);
 
    useEffect(() => {
      if (!settings || typeof document === "undefined") return;
      const root = document.documentElement;
      if (settings.primary_color) {
        root.style.setProperty("--primary", settings.primary_color);
        root.style.setProperty("--sidebar", settings.primary_color);
      }
      if (settings.accent_color) {
        root.style.setProperty("--accent", settings.accent_color);
        root.style.setProperty("--gold", settings.accent_color);
        root.style.setProperty("--ring", settings.accent_color);
      }
    }, [settings]);
 
    return null;
  }
 
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { RadioProvider } from "@/lib/radio-context";
import { AuthProvider } from "@/lib/auth-context";
import { RadioPlayer } from "@/components/site/RadioPlayer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-flex px-4 py-2 rounded-md gradient-gold text-gold-foreground font-medium">Voltar ao início</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground">Tentar novamente</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rádio Alternativa Gospel  Portal de notícias e música cristã" },
      { name: "description", content: "Ouça a melhor música gospel ao vivo e acompanhe as notícias do mundo cristão." },
      { property: "og:title", content: "Rádio Alternativa Gospel  Portal de notícias e música cristã" },
      { name: "twitter:title", content: "Rádio Alternativa Gospel  Portal de notícias e música cristã" },
      { property: "og:description", content: "Ouça a melhor música gospel ao vivo e acompanhe as notícias do mundo cristão." },
      { name: "twitter:description", content: "Ouça a melhor música gospel ao vivo e acompanhe as notícias do mundo cristão." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07e6355f-44f7-4464-8a3d-991a257d1c13/id-preview-7d19905f--200fef07-f222-45f8-bb31-f063c40ad46e.lovable.app-1778977090172.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07e6355f-44f7-4464-8a3d-991a257d1c13/id-preview-7d19905f--200fef07-f222-45f8-bb31-f063c40ad46e.lovable.app-1778977090172.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07e6355f-44f7-4464-8a3d-991a257d1c13/id-preview-7d19905f--200fef07-f222-45f8-bb31-f063c40ad46e.lovable.app-1778977090172.png" }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

 function RootComponent() {
   const { queryClient } = Route.useRouteContext();
   const path = useRouterState({ select: (r) => r.location.pathname });
   const isAdmin = path.startsWith("/admin");
   return (
     <QueryClientProvider client={queryClient}>
       <AuthProvider>
         <RadioProvider>
           <a 
             href="#main-content" 
             className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
           >
             Pular para o conteúdo
           </a>
           <RadioPlayer />
           {!isAdmin && <Header />}
           <main id="main-content">
             <Outlet />
           </main>
           {!isAdmin && <Footer />}
            <ThemeSync />
            <Toaster />
         </RadioProvider>
       </AuthProvider>
     </QueryClientProvider>
   );
 }
