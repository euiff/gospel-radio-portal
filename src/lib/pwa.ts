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

export type AppServiceWorkerStatus = { supported: boolean; registered: boolean; appliedVersion: number };

export async function registerAppServiceWorker(version: number | string = 1): Promise<AppServiceWorkerStatus> {
  const appliedVersion = Number(version) || 1;
  if (!("serviceWorker" in navigator)) return { supported: false, registered: false, appliedVersion };
  if (isRefusedContext()) {
    await unregisterAppSW();
    return { supported: true, registered: false, appliedVersion };
  }
  try {
    const reg = await navigator.serviceWorker.register(`${SW_PATH}?v=${version}`);
    // Force check for a new worker whenever the asset version changes.
    reg.update().catch(() => {});
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          sw.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
    await navigator.serviceWorker.ready;
    return { supported: true, registered: true, appliedVersion };
  } catch {
    return { supported: true, registered: false, appliedVersion };
  }
}