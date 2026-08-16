import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PWAInstall() {
  const [deferred, setDeferred] = useState<Prompt | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") setDismissed(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Prompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,26rem)] rounded-2xl border border-border bg-card/95 backdrop-blur p-4 shadow-2xl flex items-center gap-3">
      <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-primary">Instale o app da rádio</p>
        <p className="text-xs text-muted-foreground">Ouça ao vivo direto da tela inicial.</p>
      </div>
      <button
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice.catch(() => null);
          setDeferred(null);
        }}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-gold text-gold-foreground text-xs font-bold"
      >
        <Download className="w-4 h-4" /> Instalar
      </button>
      <button
        aria-label="Dispensar"
        onClick={() => {
          localStorage.setItem("pwa-install-dismissed", "1");
          setDismissed(true);
        }}
        className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
