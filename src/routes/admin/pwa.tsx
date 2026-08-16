import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logAudit } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/pwa")({ component: PwaAdmin });

const DISPLAY_MODES = ["standalone", "fullscreen", "minimal-ui", "browser"];
const ORIENTATIONS = ["portrait", "landscape", "any"];

type AssetSpec = { path: string; label: string; width: number; height: number; maxKB: number };

const ASSETS: AssetSpec[] = [
  { path: "/favicon.ico", label: "Favicon (.ico)", width: 0, height: 0, maxKB: 300 },
  { path: "/favicon.png", label: "Favicon PNG", width: 64, height: 64, maxKB: 60 },
  { path: "/icons/icon-96.png", label: "Ícone 96", width: 96, height: 96, maxKB: 80 },
  { path: "/icons/icon-144.png", label: "Ícone 144", width: 144, height: 144, maxKB: 120 },
  { path: "/icons/icon-192.png", label: "Ícone 192", width: 192, height: 192, maxKB: 160 },
  { path: "/icons/icon-384.png", label: "Ícone 384", width: 384, height: 384, maxKB: 400 },
  { path: "/icons/icon-512.png", label: "Ícone 512", width: 512, height: 512, maxKB: 600 },
  { path: "/icons/apple-touch-icon.png", label: "Apple Touch 180", width: 180, height: 180, maxKB: 150 },
  { path: "/icons/apple-touch-icon-167.png", label: "Apple Touch 167", width: 167, height: 167, maxKB: 150 },
  { path: "/icons/apple-touch-icon-152.png", label: "Apple Touch 152", width: 152, height: 152, maxKB: 150 },
  ...[
    [1170, 2532],
    [1284, 2778],
    [1179, 2556],
    [1290, 2796],
    [1125, 2436],
    [828, 1792],
    [1242, 2688],
    [750, 1334],
    [1536, 2048],
    [1668, 2388],
    [2048, 2732],
  ].map(([w, h]) => ({
    path: `/icons/splash-${w}x${h}.png`,
    label: `Splash ${w}x${h}`,
    width: w,
    height: h,
    maxKB: 900,
  })),
];

type Result = {
  spec: AssetSpec;
  status: "ok" | "warn" | "missing";
  message: string;
  sizeKB?: number;
  dims?: string;
};

async function checkAsset(spec: AssetSpec, v: number): Promise<Result> {
  const url = `${spec.path}?v=${v}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { spec, status: "missing", message: `Arquivo não encontrado (HTTP ${res.status})` };
    const blob = await res.blob();
    const sizeKB = Math.round(blob.size / 1024);
    let dims = "";
    let status: Result["status"] = "ok";
    let message = "Tudo certo";

    if (spec.width > 0 && blob.type.startsWith("image/") && !spec.path.endsWith(".ico")) {
      const bmp = await createImageBitmap(blob).catch(() => null);
      if (bmp) {
        dims = `${bmp.width}x${bmp.height}`;
        if (bmp.width !== spec.width || bmp.height !== spec.height) {
          status = "warn";
          message = `Dimensão incorreta: esperado ${spec.width}x${spec.height}. Reenvie a logo e salve a Aparência para regerar.`;
        }
      }
    }
    if (status === "ok" && sizeKB > spec.maxKB) {
      status = "warn";
      message = `Arquivo pesado (${sizeKB} KB). Recomendado até ${spec.maxKB} KB para carregar mais rápido.`;
    }
    return { spec, status, message, sizeKB, dims };
  } catch {
    return { spec, status: "missing", message: "Falha ao carregar o arquivo" };
  }
}

function PwaAdmin() {
  const [row, setRow] = useState<any>(null);
  const [pwa, setPwa] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data);
        setPwa((data as any)?.pwa_settings ?? {});
      });
  }, []);

  const runCheck = async () => {
    setChecking(true);
    const v = pwa?.asset_version ?? 1;
    const out: Result[] = [];
    for (const spec of ASSETS) out.push(await checkAsset(spec, v));
    setResults(out);
    setChecking(false);
  };

  useEffect(() => {
    if (pwa) void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwa?.asset_version]);

  const save = async (bumpVersion: boolean) => {
    if (!row?.id) return toast.error("Configure o site primeiro.");
    setSaving(true);
    const next = {
      ...pwa,
      asset_version: bumpVersion ? Number(pwa?.asset_version ?? 1) + 1 : Number(pwa?.asset_version ?? 1),
    };
    const { error } = await supabase
      .from("site_settings")
      .update({ pwa_settings: next })
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setPwa(next);
    await logAudit("update", "pwa_settings", row.id, { asset_version: next.asset_version });
    toast.success(
      bumpVersion
        ? `Salvo! Nova versão dos arquivos (v${next.asset_version}) — os apps instalados vão atualizar sozinhos.`
        : "Preferências do app salvas!",
    );
  };

  if (!pwa) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  const problems = results.filter((r) => r.status !== "ok");

  const field = (key: string, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={pwa[key] ?? ""}
        onChange={(e) => setPwa({ ...pwa, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="max-w-5xl pb-16 space-y-8">
      <div>
        <h1 className="font-display text-4xl text-primary mb-2">App (PWA)</h1>
        <p className="text-muted-foreground">
          Configure o app instalável, verifique os ícones e force a atualização nos celulares.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-display text-primary border-b border-border pb-2">
          Manifest do App
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {field("name", "Nome completo")}
          {field("short_name", "Nome curto (tela inicial)")}
          <div className="md:col-span-2">{field("description", "Descrição")}</div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cor de fundo (splash)
            </Label>
            <div className="flex gap-3">
              <input
                type="color"
                value={pwa.background_color ?? "#04281f"}
                onChange={(e) => setPwa({ ...pwa, background_color: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer p-0"
              />
              <Input
                value={pwa.background_color ?? ""}
                onChange={(e) => setPwa({ ...pwa, background_color: e.target.value })}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cor do tema (barra de status)
            </Label>
            <div className="flex gap-3">
              <input
                type="color"
                value={pwa.theme_color ?? "#04281f"}
                onChange={(e) => setPwa({ ...pwa, theme_color: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer p-0"
              />
              <Input
                value={pwa.theme_color ?? ""}
                onChange={(e) => setPwa({ ...pwa, theme_color: e.target.value })}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Modo de exibição
            </Label>
            <select
              value={pwa.display ?? "standalone"}
              onChange={(e) => setPwa({ ...pwa, display: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm"
            >
              {DISPLAY_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Orientação
            </Label>
            <select
              value={pwa.orientation ?? "portrait"}
              onChange={(e) => setPwa({ ...pwa, orientation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm"
            >
              {ORIENTATIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {field("start_url", "Página inicial do app")}
          {field("icon_url", "Ícone personalizado (URL, opcional)")}
        </div>

        <div className="rounded-2xl border border-border p-5 flex items-center gap-4 bg-muted/30">
          <div
            className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: pwa.background_color ?? "#04281f" }}
          >
            <img
              src={pwa.icon_url || `/icons/icon-192.png?v=${pwa.asset_version ?? 1}`}
              alt="Prévia do ícone do app"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Prévia na tela inicial
            </p>
            <p className="font-bold truncate">{pwa.short_name || "Rádio"}</p>
            <p className="text-xs text-muted-foreground truncate">{pwa.name || "Rádio Gospel"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save(false)} disabled={saving} className="rounded-xl">
            Salvar preferências
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={saving}
            variant="secondary"
            className="rounded-xl gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Salvar e forçar atualização (v
            {Number(pwa.asset_version ?? 1) + 1})
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-xl font-display text-primary">Verificação de Ícones e Splash</h2>
          <Button variant="outline" size="sm" onClick={runCheck} disabled={checking} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> Verificar agora
          </Button>
        </div>

        {problems.length === 0 && results.length > 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-4 text-sm">
            <CheckCircle2 className="w-5 h-5" /> Todos os {results.length} arquivos estão corretos.
          </div>
        ) : problems.length > 0 ? (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 p-4 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              {problems.length} arquivo(s) precisam de atenção. Reenvie a logo em “Configurar Site” e
              use “Salvar e forçar atualização” para regenerar o cache dos usuários.
            </span>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Arquivo</th>
                <th className="py-2 pr-3">Dimensão</th>
                <th className="py-2 pr-3">Tamanho</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.spec.path} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{r.spec.label}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.dims || "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {r.sizeKB != null ? `${r.sizeKB} KB` : "—"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        r.status === "ok"
                          ? "text-emerald-600"
                          : r.status === "warn"
                            ? "text-amber-600"
                            : "text-destructive"
                      }`}
                    >
                      {r.status === "ok" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : r.status === "warn" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {r.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}