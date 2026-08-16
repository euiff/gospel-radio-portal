import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRadio } from "@/lib/radio-context";
import { logAudit } from "@/lib/audit-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_VOX_FIELD_MAP,
  VOX_FIELD_LABELS,
  fetchVoxNowPlaying,
  normalizeFieldMap,
  type VoxFetchResult,
  type VoxFieldMap,
} from "@/lib/vox";
import { AlertTriangle, CheckCircle2, RefreshCw, Radio, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/vox")({ component: VoxAdmin });

interface LogEntry {
  at: string;
  level: "success" | "error" | "warning";
  message: string;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR") : "—";

function VoxAdmin() {
  const { reload, voxStatus, nowPlayingInfo } = useRadio();
  const [row, setRow] = useState<any>(null);
  const [map, setMap] = useState<VoxFieldMap>(DEFAULT_VOX_FIELD_MAP);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<VoxFetchResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const autoSynced = useRef<string | null>(null);

  const pushLog = (level: LogEntry["level"], message: string) =>
    setLog((prev) => [{ at: new Date().toISOString(), level, message }, ...prev].slice(0, 30));

  useEffect(() => {
    supabase
      .from("radio_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data ?? {});
        setMap(normalizeFieldMap((data as any)?.vox_field_map));
      });
  }, []);

  const runTest = async (silent = false) => {
    if (!row?.api_now_playing) {
      toast.error("Informe a URL da API da Vox antes de testar.");
      return null;
    }
    setTesting(true);
    const res = await fetchVoxNowPlaying(row.api_now_playing, {
      token: row.vox_token,
      fieldMap: map,
    });
    setTesting(false);
    setResult(res);
    if (res.ok) {
      pushLog("success", `Conexão OK — tocando "${res.info?.title}".`);
      if (!silent) toast.success("Conexão com a Vox validada!");
    } else {
      pushLog("error", res.error ?? "Falha desconhecida na Vox.");
      if (!silent) toast.error(res.error ?? "Falha ao consultar a Vox.");
    }
    res.issues
      .filter((i) => i.severity === "warning")
      .forEach((i) => pushLog("warning", `${i.field}: ${i.message}`));
    return res;
  };

  const saveFallback = async (info: { title: string; coverUrl: string | null }) => {
    if (!row?.id) return;
    const payload = { ...info, savedAt: new Date().toISOString() };
    const { error } = await supabase
      .from("radio_settings")
      .update({ vox_last_valid: payload } as any)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRow((prev: any) => ({ ...prev, vox_last_valid: payload }));
    await logAudit("sync_highlight", "radio_settings", row.id, payload);
    reload();
  };

  // Sincronização automática do destaque principal com a música da Vox
  useEffect(() => {
    if (!row?.id || row?.vox_auto_highlight === false) return;
    const info = result?.ok ? result.info : nowPlayingInfo;
    if (!info?.title || autoSynced.current === info.title) return;
    autoSynced.current = info.title;
    saveFallback({ title: info.title, coverUrl: info.coverUrl });
  }, [result, nowPlayingInfo, row?.id, row?.vox_auto_highlight]);

  const save = async () => {
    setSaving(true);
    const payload = {
      api_now_playing: row.api_now_playing ?? null,
      vox_token: row.vox_token ?? null,
      vox_field_map: map,
      vox_auto_highlight: row.vox_auto_highlight !== false,
    };
    const { error } = row?.id
      ? await supabase.from("radio_settings").update(payload as any).eq("id", row.id)
      : await supabase.from("radio_settings").insert(payload as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    await logAudit("update", "radio_settings_vox", row?.id ?? null, payload);
    toast.success("Configuração da Vox salva!");
    reload();
    runTest(true);
  };

  if (!row) return <div>Carregando…</div>;

  const errors = result?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = result?.issues.filter((i) => i.severity === "warning") ?? [];
  const lastValid = row.vox_last_valid as { title?: string; coverUrl?: string; savedAt?: string } | null;

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-4xl text-primary mb-1">Destaques & Vox</h1>
        <p className="text-muted-foreground text-sm">
          Sincronize o destaque principal com a música tocada na Vox, valide o formato do payload e
          acompanhe o status da integração.
        </p>
      </header>

      {/* Status */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Clock className="w-4 h-4" /> Última atualização
          </div>
          <div className="font-display text-xl text-primary">{fmt(voxStatus.lastSuccessAt)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Última tentativa: {fmt(voxStatus.lastAttemptAt)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Users className="w-4 h-4" /> Ouvintes agora
          </div>
          <div className="font-display text-xl text-primary">
            {nowPlayingInfo?.listeners ?? "Indisponível"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {nowPlayingInfo?.title ?? "Sem música identificada"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Radio className="w-4 h-4" /> Estado
          </div>
          {voxStatus.stale || voxStatus.error ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" /> Fallback ativo
            </Badge>
          ) : (
            <Badge className="gap-1 bg-emerald-600 text-white">
              <CheckCircle2 className="w-3 h-3" /> Em tempo real
            </Badge>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            Falhas seguidas: {voxStatus.consecutiveFailures}
          </div>
        </div>
      </section>

      {voxStatus.error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {voxStatus.error}
        </div>
      )}

      {/* Conexão */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-2xl text-primary">Conexão com a Vox</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vox-url">URL da API Vox (JSON)</Label>
            <Input
              id="vox-url"
              value={row.api_now_playing ?? ""}
              placeholder="https://voxhd.com.br/api-json/sua-radio"
              onChange={(e) => setRow({ ...row, api_now_playing: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Links HTTP são acessados automaticamente por HTTPS para evitar bloqueio do navegador.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vox-token">Token de autenticação (opcional)</Label>
            <Input
              id="vox-token"
              type="password"
              value={row.vox_token ?? ""}
              placeholder="Somente se a sua API exigir"
              onChange={(e) => setRow({ ...row, vox_token: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Enviado como cabeçalho Authorization: Bearer.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <div className="font-bold text-sm">Sincronizar destaque automaticamente</div>
            <p className="text-xs text-muted-foreground">
              Mantém o destaque principal (título e capa) igual à música tocada na Vox.
            </p>
          </div>
          <Switch
            checked={row.vox_auto_highlight !== false}
            onCheckedChange={(v) => setRow({ ...row, vox_auto_highlight: v })}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar configuração"}
          </Button>
          <Button variant="outline" onClick={() => runTest()} disabled={testing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} />
            Testar conexão
          </Button>
          {nowPlayingInfo?.title && (
            <Button
              variant="secondary"
              onClick={() =>
                saveFallback({ title: nowPlayingInfo.title, coverUrl: nowPlayingInfo.coverUrl })
              }
            >
              Sincronizar destaque agora
            </Button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-1">
            <div className="font-bold text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Formato de dados inconsistente
            </div>
            {errors.map((i) => (
              <p key={i.field + i.message} className="text-xs text-destructive">
                {i.message}
              </p>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1">
            <div className="font-bold text-sm text-amber-700">Avisos de validação</div>
            {warnings.map((i) => (
              <p key={i.field + i.message} className="text-xs text-amber-700">
                {i.message}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Mapeamento */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-2xl text-primary">Mapeamento de campos</h2>
        <p className="text-sm text-muted-foreground">
          Informe o nome do campo no JSON da Vox correspondente a cada informação do sistema. Use
          ponto para campos aninhados (ex.: <code>now_playing.song.title</code>).
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campo do sistema</TableHead>
              <TableHead>Campo no payload da Vox</TableHead>
              <TableHead className="w-40">Valor recebido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.keys(DEFAULT_VOX_FIELD_MAP) as Array<keyof VoxFieldMap>).map((key) => {
              const preview = result?.info
                ? ({
                    title: result.info.title,
                    station: result.info.stationTitle,
                    cover: result.info.coverUrl,
                    listeners: result.info.listeners,
                    next: result.info.nextTrack,
                    genre: result.info.genre,
                    bitrate: result.info.bitrate,
                  } as Record<string, unknown>)[key]
                : null;
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{VOX_FIELD_LABELS[key]}</TableCell>
                  <TableCell>
                    <Input
                      value={map[key]}
                      onChange={(e) => setMap({ ...map, [key]: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-40">
                    {preview === null || preview === undefined ? "—" : String(preview)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Button variant="ghost" onClick={() => setMap(DEFAULT_VOX_FIELD_MAP)}>
          Restaurar padrão Vox
        </Button>
      </section>

      {/* Fallback */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl text-primary mb-3">Destaque de fallback</h2>
        {lastValid?.title ? (
          <div className="flex items-center gap-4">
            {lastValid.coverUrl && (
              <img src={lastValid.coverUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            )}
            <div>
              <div className="font-bold">{lastValid.title}</div>
              <div className="text-xs text-muted-foreground">
                Registrado em {fmt(lastValid.savedAt ?? null)}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum destaque válido registrado ainda. Ele é salvo automaticamente quando a Vox
            responde corretamente.
          </p>
        )}
      </section>

      {/* Log */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl text-primary mb-3">Log de erros e eventos</h2>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento registrado nesta sessão.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Quando</TableHead>
                <TableHead className="w-28">Nível</TableHead>
                <TableHead>Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((entry, i) => (
                <TableRow key={`${entry.at}-${i}`}>
                  <TableCell className="text-xs">{fmt(entry.at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.level === "error" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {entry.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{entry.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
