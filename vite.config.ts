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
  // Vercel must build the full TanStack server output. Treating this project as
  // a static Vite site makes its builder look for an index.html that does not exist.
  nitro: process.env.VERCEL ? { preset: "vercel" } : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      target: "esnext",
    },
  },
});
