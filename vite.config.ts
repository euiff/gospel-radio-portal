// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
 // You can pass additional config via defineConfig({ vite: { ... } }) if needed.
 import { defineConfig } from "@lovable.dev/vite-tanstack-config";
 
 // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
 // @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
 export default defineConfig({
    tanstackStart: {
      server: { entry: "server" },
    },
    vite: {
      build: {
        target: "esnext",
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes("node_modules")) {
                if (id.includes("@supabase")) return "vendor-supabase";
                if (id.includes("@tanstack")) return "vendor-tanstack";
                // Keep React, UI libraries and tslib helpers together to avoid SSR chunk cycles.
                if (
                  id.includes("react") ||
                  id.includes("scheduler") ||
                  id.includes("prop-types") ||
                  id.includes("tslib") ||
                  id.includes("@radix-ui") ||
                  id.includes("lucide-react") ||
                  id.includes("sonner") ||
                  id.includes("cmdk") ||
                  id.includes("vaul") ||
                  id.includes("embla-carousel-react") ||
                  id.includes("react-day-picker") ||
                  id.includes("react-hook-form") ||
                  id.includes("@hookform") ||
                  id.includes("input-otp") ||
                  id.includes("react-resizable-panels") ||
                  id.includes("recharts") ||
                  id.includes("framer-motion") ||
                  id.includes("class-variance-authority") ||
                  id.includes("clsx") ||
                  id.includes("tailwind-merge") ||
                  id.includes("tw-animate-css")
                ) return "vendor-react";
                return "vendor";
               }
            },
          },
        },
      },
    },
 });
