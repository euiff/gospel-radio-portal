import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, History, Loader2, RefreshCw, RotateCcw, Smartphone, UploadCloud, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PwaAssetUploader } from "@/components/admin/PwaAssetUploader";
import { defaultPwaAssets, PWA_ASSET_SPECS, readPwaAssets, type PwaAsset } from "@/lib/pwa-assets";
import { logAudit } from "@/lib/audit-log";
import type { Database, Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/pwa")({
  head: () => ({ meta: [{ title: "Gerenciar PWA | Painel da Rádio" }, { name: "description", content: "Versões, assets e atualizações do aplicativo da rádio." }, { property: "og:title", content: "Gerenciar PWA | Painel da Rádio" }, { property: "og:description", content: "Versões, assets e atualizações do aplicativo da rádio." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PwaAdmin,
});

type PwaVersion = Database["public"]["Tables"]["pwa_versions"]["Row"];
type Installation = Database["public"]["Tables"]["pwa_installations"]["Row"];
type CheckResult = { asset: PwaAsset; status: "ok" | "warning" | "missing"; message: string; actual?: string };
const DISPLAY_MODES = ["standalone", "fullscreen", "minimal-ui", "browser"];
const ORIENTATIONS = ["portrait", "landscape", "any"];

async function verifyAsset(asset: PwaAsset): Promise<CheckResult> {
  try {
    const response = await fetch(`${asset.url}${asset.url.includes("?") ? "&" : "?"}check=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return { asset, status: "missing", message: `Não publicado (HTTP ${response.status})` };
    const blob = await response.blob();
    const sizeKB = Math.ceil(blob.size / 1024);
    if (asset.width > 0 && !asset.mimeType.includes("icon")) {
      const bitmap = await createImageBitmap(blob).catch(() => null);
      if (!bitmap) return { asset, status: "warning", message: "Não foi possível ler a dimensão" };
      const actual = `${bitmap.width}x${bitmap.height}`;
      const valid = bitmap.width === asset.width && bitmap.height === asset.height;
      bitmap.close();
      if (!valid) return { asset, status: "missing", message: `Esperado ${asset.width}x${asset.height}`, actual };
    }
    if (sizeKB > asset.maxKB) return { asset, status: "warning", message: `${sizeKB} KB; recomendado até ${asset.maxKB} KB` };
    return { asset, status: "ok", message: `${sizeKB} KB`, actual: asset.width ? `${asset.width}x${asset.height}` : undefined };
  } catch {
    return { asset, status: "missing", message: "Arquivo inacessível" };
  }
}

function PwaAdmin() {
  const [settingsId, setSettingsId] = useState("");
  const [pwa, setPwa] = useState<Record<string, unknown>>({});
  const [assets, setAssets] = useState<PwaAsset[]>([]);
  const [versions, setVersions] = useState<PwaVersion[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState("");
  const [rollbackVersion, setRollbackVersion] = useState<PwaVersion | null>(null);

  const load = useCallback(async () => {
    const [settingsResult, versionsResult, installationsResult] = await Promise.all([
      supabase.from("site_settings").select("id,pwa_settings").limit(1).maybeSingle(),
      supabase.from("pwa_versions").select("*").order("version", { ascending: false }).limit(30),
      supabase.from("pwa_installations").select("*").order("last_seen_at", { ascending: false }),
    ]);
    if (settingsResult.error) toast.error(settingsResult.error.message);
    const config = (settingsResult.data?.pwa_settings as Record<string, unknown> | null) ?? {};
    setSettingsId(settingsResult.data?.id ?? "");
    setPwa(config);
    const configured = readPwaAssets(config.assets);
    setAssets(configured.length ? configured : defaultPwaAssets());
    setVersions(versionsResult.data ?? []);
    setInstallations(installationsResult.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeVersion = Number(pwa.asset_version ?? versions.find((version) => version.is_active)?.version ?? 1);
  const nextVersion = Math.max(activeVersion, versions[0]?.version ?? 0) + 1;
  const updated = installations.filter((installation) => installation.applied_version >= activeVersion).length;
  const pending = installations.length - updated;
  const adoption = installations.length ? Math.round((updated / installations.length) * 100) : 0;
  const activeRecord = versions.find((version) => version.is_active);

  const requiredKeys = useMemo(() => new Set(PWA_ASSET_SPECS.filter((spec) => spec.required).map((spec) => spec.key)), []);
  const missingRequired = [...requiredKeys].filter((key) => !assets.some((asset) => asset.key === key));
  const failedChecks = checks.filter((result) => result.status === "missing");
  const manifestMismatch = activeRecord ? activeRecord.version !== activeVersion || activeRecord.sw_version !== String(activeVersion) : true;
  const forceUpdateActive = Boolean(activeRecord?.force_update && pending > 0);
  const canPublish = missingRequired.length === 0 && failedChecks.length === 0 && settingsId.length > 0;

  const runChecks = async () => {
    setChecking(true);
    const results = await Promise.all(assets.map(verifyAsset));
    setChecks(results);
    setChecking(false);
    const failures = results.filter((result) => result.status === "missing").length;
    failures ? toast.error(`${failures} inconsistência(s) encontrada(s).`) : toast.success("Manifest e assets estão consistentes.");
  };

  const publish = async () => {
    if (!canPublish) return toast.error("Corrija os assets obrigatórios antes de publicar.");
    setPublishing(true);
    const manifest = { ...pwa, assets, icon_url: "" };
    const { data, error } = await supabase.rpc("publish_pwa_version", { _manifest: manifest as Json, _assets: assets as unknown as Json, _force_update: true, _change_note: note || "Atualização dos assets do PWA", _integrity_status: checks.some((item) => item.status === "warning") ? "warning" : "valid" });
    setPublishing(false);
    if (error) return toast.error(error.message);
    await logAudit("publish", "pwa_version", String(data.version), { asset_count: assets.length, force_update: true });
    setNote("");
    toast.success(`Versão v${data.version} publicada. A atualização será aplicada quando cada app abrir.`);
    await load();
  };

  const rollback = async () => {
    if (!rollbackVersion) return;
    setPublishing(true);
    const { data, error } = await supabase.rpc("rollback_pwa_version", { _version: rollbackVersion.version, _change_note: `Rollback para o conteúdo da v${rollbackVersion.version}` });
    setPublishing(false);
    setRollbackVersion(null);
    if (error) return toast.error(error.message);
    await logAudit("rollback", "pwa_version", String(data.version), { source_version: rollbackVersion.version });
    toast.success(`Rollback publicado como v${data.version}.`);
    await load();
  };

  const field = (key: string, label: string) => <div className="space-y-1.5"><Label htmlFor={`pwa-${key}`}>{label}</Label><Input id={`pwa-${key}`} value={String(pwa[key] ?? "")} onChange={(event) => setPwa((current) => ({ ...current, [key]: event.target.value }))} /></div>;

  if (loading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <header><h1 className="font-display text-4xl text-primary">Central do App</h1><p className="mt-2 text-muted-foreground">Publique identidades visuais versionadas, acompanhe a atualização dos apps e reverta com segurança.</p></header>

      {(manifestMismatch || missingRequired.length > 0 || failedChecks.length > 0) && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Inconsistências detectadas</AlertTitle><AlertDescription>{manifestMismatch && <p>Manifest ativo e service worker não apontam para a mesma versão.</p>}{missingRequired.length > 0 && <p>{missingRequired.length} asset(s) obrigatório(s) não estão na lista publicada.</p>}{failedChecks.length > 0 && <p>{failedChecks.length} arquivo(s) referenciado(s) não existem ou têm dimensão incorreta.</p>}</AlertDescription></Alert>}

      <section className="grid gap-4 md:grid-cols-4">
        <StatusCard icon={Smartphone} label="Versão ativa" value={`v${activeVersion}`} detail={`Worker v${activeRecord?.sw_version ?? "—"}`} />
        <StatusCard icon={RefreshCw} label="Forçar atualização" value={forceUpdateActive ? "Em andamento" : "Concluída"} detail={forceUpdateActive ? `${pending} instalação(ões) pendentes` : "Nenhuma pendência conhecida"} />
        <StatusCard icon={Users} label="Adoção conhecida" value={`${updated}/${installations.length}`} detail={`${adoption}% aplicaram a versão`} />
        <StatusCard icon={Clock3} label="Último recebimento" value={installations[0] ? new Date(installations[0].last_seen_at).toLocaleDateString("pt-BR") : "Sem dados"} detail="Apps offline só confirmam ao abrir" />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Distribuição da atualização</h2><p className="text-sm text-muted-foreground">Contagem anônima dos apps que abriram após a publicação.</p></div><Badge variant={forceUpdateActive ? "secondary" : "default"}>{forceUpdateActive ? "Distribuindo" : "Estável"}</Badge></div><Progress value={adoption} /><div className="flex justify-between text-xs text-muted-foreground"><span>{updated} atualizados</span><span>{pending} pendentes</span></div></section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-6"><div><h2 className="text-xl font-semibold">Manifest</h2><p className="text-sm text-muted-foreground">As alterações entram no ar somente ao publicar uma nova versão.</p></div><div className="grid gap-5 md:grid-cols-2">{field("name", "Nome completo")}{field("short_name", "Nome curto")}<div className="md:col-span-2">{field("description", "Descrição")}</div>{field("start_url", "Página inicial")}<div className="space-y-1.5"><Label>Modo de exibição</Label><select value={String(pwa.display ?? "standalone")} onChange={(event) => setPwa((current) => ({ ...current, display: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{DISPLAY_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select></div><div className="space-y-1.5"><Label>Orientação</Label><select value={String(pwa.orientation ?? "portrait")} onChange={(event) => setPwa((current) => ({ ...current, orientation: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{ORIENTATIONS.map((orientation) => <option key={orientation}>{orientation}</option>)}</select></div>{field("theme_color", "Cor do tema")}{field("background_color", "Cor de fundo")}</div></section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Ícones, favicon e splash</h2><p className="text-sm text-muted-foreground">Próximo conjunto imutável: v{nextVersion}. Envie várias resoluções de uma vez.</p></div><Button variant="outline" onClick={() => void runChecks()} disabled={checking} className="gap-2">{checking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Verificar publicados</Button></div><PwaAssetUploader version={nextVersion} assets={assets} onChange={setAssets} />
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Asset</th><th>Dimensão</th><th>Origem</th><th>Status</th></tr></thead><tbody>{assets.map((asset) => { const result = checks.find((item) => item.asset.key === asset.key); return <tr key={asset.key} className="border-b border-border/60"><td className="py-3 font-medium">{asset.label}</td><td>{asset.width ? `${asset.width}x${asset.height}` : "ICO"}</td><td className="max-w-52 truncate text-muted-foreground">{asset.url}</td><td>{!result ? <Badge variant="outline">Não verificado</Badge> : result.status === "ok" ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="size-4" /> {result.message}</span> : result.status === "warning" ? <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="size-4" /> {result.message}</span> : <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="size-4" /> {result.message}</span>}</td></tr>; })}</tbody></table></div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4"><div><h2 className="text-xl font-semibold">Publicar versão v{nextVersion}</h2><p className="text-sm text-muted-foreground">A publicação cria um snapshot completo e solicita atualização dos apps instalados.</p></div><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Resumo da alteração (opcional)" /><div className="flex flex-wrap gap-3"><Button onClick={() => void publish()} disabled={!canPublish || publishing} className="gap-2">{publishing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} Publicar e forçar atualização</Button><Button variant="outline" onClick={() => void runChecks()} disabled={checking}>Validar antes de publicar</Button></div>{!canPublish && <p className="text-sm text-destructive">A publicação está bloqueada até que todos os assets obrigatórios estejam listados e acessíveis.</p>}</section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4"><div className="flex items-center gap-2"><History className="size-5 text-primary" /><h2 className="text-xl font-semibold">Histórico de versões</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Versão</th><th>Publicada</th><th>Assets</th><th>Integridade</th><th>Alteração</th><th className="text-right">Ação</th></tr></thead><tbody>{versions.map((version) => <tr key={version.id} className="border-b border-border/60"><td className="py-3 font-semibold">v{version.version} {version.is_active && <Badge className="ml-2">Ativa</Badge>}</td><td>{new Date(version.created_at).toLocaleString("pt-BR")}</td><td>{readPwaAssets(version.assets).length}</td><td><Badge variant={version.integrity_status === "invalid" ? "destructive" : "outline"}>{version.integrity_status}</Badge></td><td className="max-w-64 truncate text-muted-foreground">{version.change_note || "—"}</td><td className="text-right"><Button size="sm" variant="ghost" disabled={version.is_active || publishing} onClick={() => setRollbackVersion(version)} className="gap-1"><RotateCcw className="size-4" /> Reverter</Button></td></tr>)}</tbody></table></div></section>

      <AlertDialog open={Boolean(rollbackVersion)} onOpenChange={(open) => !open && setRollbackVersion(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reverter para o conteúdo da v{rollbackVersion?.version}?</AlertDialogTitle><AlertDialogDescription>Uma nova versão será criada com o manifest e os assets desse snapshot. O histórico atual será preservado e os apps receberão a reversão na próxima abertura.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void rollback()}>Publicar rollback</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, detail }: { icon: typeof Smartphone; label: string; value: string; detail: string }) {
  return <div className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="size-5" /></div><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}