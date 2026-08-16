import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://gospel-radio-portal.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/ouvinte", changefreq: "hourly", priority: "0.9" },
          { path: "/programacao", changefreq: "weekly", priority: "0.8" },
          { path: "/pedidos", changefreq: "weekly", priority: "0.7" },
        ];

        try {
          const supabase = createClient(
            process.env["VITE_SUPABASE_URL"]!,
            process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { persistSession: false } },
          );
          const [{ data: news }, { data: categories }] = await Promise.all([
            supabase.from("news").select("slug").eq("published", true).limit(1000),
            supabase.from("categories").select("slug").limit(200),
          ]);
          for (const c of categories ?? [])
            if (c.slug) entries.push({ path: `/categoria/${c.slug}`, changefreq: "daily", priority: "0.6" });
          for (const n of news ?? [])
            if (n.slug) entries.push({ path: `/noticia/${n.slug}`, changefreq: "monthly", priority: "0.6" });
        } catch {
          // fall back to the static routes above
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});