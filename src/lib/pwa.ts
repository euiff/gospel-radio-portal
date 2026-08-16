const SW_PATH = "/sw.js";

function isRefusedContext() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    return new URLSearchParams(window.location.search).get("sw") === "off";
  }
  return false;
}

async function unregisterAppSW() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.allSettled(
    regs
      .filter((r) => (r.active || r.installing || r.waiting)?.scriptURL.endsWith(SW_PATH))
      .map((r) => r.unregister()),
  );
}

export async function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppSW();
    return;
  }
  navigator.serviceWorker.register(SW_PATH).catch(() => {});
}