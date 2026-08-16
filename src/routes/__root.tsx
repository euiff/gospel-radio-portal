import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  Link,
  ErrorComponentProps,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, RefreshCw, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function ThemeSync() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-theme"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("primary_color, accent_color")
          .limit(1)
          .maybeSingle();

        if (error) {
          // Handle JWT expired specifically by not throwing, just returning null
          if (error.code === "PGRST303" || error.message?.includes("JWT expired")) {
            console.warn("Supabase JWT expired, falling back to default theme");
            return null;
          }
          throw error;
        }
        return data;
      } catch (e) {
        console.error("Theme sync error:", e);
        return null;
      }
    },
    staleTime: Infinity,
  });

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
import { RadioProvider, radioSettingsQueryOptions } from "@/lib/radio-context";
import { AuthProvider } from "@/lib/auth-context";
import { RadioPlayer } from "@/components/site/RadioPlayer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { siteSettingsQuery } from "@/hooks/use-site-data";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
        <Link
          to="/"
          className="mt-6 inline-flex px-4 py-2 rounded-md gradient-gold text-gold-foreground font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("Root Error:", error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl text-primary mb-2">Ops! Tivemos um problema</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Ocorreu um erro inesperado. Pedimos desculpas pelo transtorno.
          {process.env.NODE_ENV === "development" && (
            <code className="block mt-4 p-4 bg-muted rounded-lg text-left text-[10px] overflow-auto max-h-32">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </code>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="default"
            className="gap-2 rounded-xl h-12 px-6"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </Button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-muted rounded-xl font-medium hover:bg-muted/80 transition text-sm"
          >
            <HomeIcon className="w-4 h-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context: { queryClient } }) => {
    const [radio, site] = await Promise.all([
      queryClient.ensureQueryData(radioSettingsQueryOptions),
      queryClient.ensureQueryData(siteSettingsQuery),
    ]);
    return { radio, site };
  },
  head: ({ loaderData }) => {
    const { radio, site } = loaderData || {};
    const title =
      radio?.station_name && radio?.tagline
        ? `${radio.station_name} | ${radio.tagline}`
        : radio?.station_name || "Portal de Rádio Gospel";
    const description =
      site?.site_description ||
      radio?.tagline ||
      "Ouça a melhor música gospel ao vivo e acompanhe as notícias do mundo cristão.";
    const logoUrl = site?.logo_url || radio?.logo_url;
    const fallbackIcon = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07e6355f-44f7-4464-8a3d-991a257d1c13/id-preview-7d19905f--200fef07-f222-45f8-bb31-f063c40ad46e.lovable.app-1778977090172.png";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { name: "twitter:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:description", content: description },
        { property: "og:image", content: logoUrl || fallbackIcon },
        { name: "twitter:image", content: logoUrl || fallbackIcon },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "theme-color", content: "#04281f" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "Rádio Gospel" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Fira+Sans:wght@300;400;500;600;700;800&display=swap",
        },
        { rel: "icon", href: logoUrl || fallbackIcon },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
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
