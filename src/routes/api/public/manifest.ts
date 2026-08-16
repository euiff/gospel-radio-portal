import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const DEFAULTS = {
  name: "Rádio Gospel",
  short_name: "Rádio",
  description: "App oficial da rádio gospel: player ao vivo, notícias, Top 10 e pedidos de música.",
  background_color: "#04281f",
  theme_color: "#04281f",
  display: "standalone",
  orientation: "portrait",
  start_url: "/",
  icon_url: "",
  asset_version: 1,
};

export const Route = createFileRoute("/api/public/manifest")({
  server: {
    handlers: {
      GET: async () => {
        let cfg: Record<string, any> = DEFAULTS;
        try {
          const supabase = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const { data } = await supabase
            .from("site_settings")
            .select("pwa_settings, logo_url")
            .limit(1)
            .maybeSingle();
          cfg = { ...DEFAULTS, ...((data?.pwa_settings as Record<string, any>) ?? {}) };
        } catch {
          cfg = DEFAULTS;
        }

        const v = cfg.asset_version ?? 1;
        const base = cfg.icon_url || "/icons/icon-";
        const icons = cfg.icon_url
          ? [
              { src: `${cfg.icon_url}`, sizes: "512x512", type: "image/png", purpose: "any" },
              { src: `${cfg.icon_url}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
            ]
          : [96, 144, 192, 384, 512].map((s) => ({
              src: `${base}${s}.png?v=${v}`,
              sizes: `${s}x${s}`,
              type: "image/png",
              purpose: s === 512 ? "any maskable" : "any",
            }));

        const manifest = {
          name: cfg.name,
          short_name: cfg.short_name,
          description: cfg.description,
          start_url: cfg.start_url || "/",
          scope: "/",
          display: cfg.display || "standalone",
          orientation: cfg.orientation || "portrait",
          background_color: cfg.background_color,
          theme_color: cfg.theme_color,
          lang: "pt-BR",
          categories: ["music", "news", "entertainment"],
          icons,
          shortcuts: [
            { name: "Ouvir agora", url: "/ouvinte" },
            { name: "Pedir música", url: "/pedidos" },
          ],
        };

        return new Response(JSON.stringify(manifest, null, 2), {
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});