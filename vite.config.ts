// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
 // You can pass additional config via defineConfig({ vite: { ... } }) if needed.
 import { defineConfig } from "@lovable.dev/vite-tanstack-config";
 
 import { nitro } from "nitro/vite";
 
 // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
 // @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
  export default defineConfig({
     vite: {
       plugins: [nitro({
         preset: "vercel",
       })],
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
                // Group all UI and utility libraries together to prevent SSR circular dependency cycles.
                // Circular dependencies in manual chunks can cause runtime "TypeError: __assign is not a function"
                // and "Cannot set properties of undefined (setting 'Activity')" during SSR.
                return "vendor";
               }
            },
          },
        },
      },
    },
 });
