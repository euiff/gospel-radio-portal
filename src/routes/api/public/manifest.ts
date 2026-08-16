import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { defaultPwaAssets, readPwaAssets } from "@/lib/pwa-assets";

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

        const v = Number(cfg.asset_version ?? 1);
        const publishedAssets = readPwaAssets(cfg.assets);
        const assets = publishedAssets.length > 0 ? publishedAssets : defaultPwaAssets();
        const versioned = (url: string) => `${url}${url.includes("?") ? "&" : "?"}v=${v}`;
        const icons = cfg.icon_url
          ? [
              { src: versioned(String(cfg.icon_url)), sizes: "512x512", type: "image/png", purpose: "any maskable" },
            ]
          : assets.filter((asset) => asset.kind === "icon").map((asset) => ({
              src: versioned(asset.url),
              sizes: `${asset.width}x${asset.height}`,
              type: asset.mimeType,
              purpose: asset.width === 512 ? "any maskable" : "any",
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
          version: v,
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