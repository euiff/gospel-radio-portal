import {
  normalizeMetadataUrl,
  parseNowPlaying,
  type NowPlayingInfo,
} from "@/lib/radio-metadata";

export interface VoxFieldMap {
  title: string;
  station: string;
  cover: string;
  listeners: string;
  next: string;
  genre: string;
  bitrate: string;
}

export const DEFAULT_VOX_FIELD_MAP: VoxFieldMap = {
  title: "musica_atual",
  station: "titulo",
  cover: "capa_musica",
  listeners: "ouvintes_conectados",
  next: "proxima_musica",
  genre: "genero",
  bitrate: "plano_bitrate",
};

export const VOX_FIELD_LABELS: Record<keyof VoxFieldMap, string> = {
  title: "Música atual (obrigatório)",
  station: "Nome/título da rádio",
  cover: "Capa da música",
  listeners: "Ouvintes conectados",
  next: "Próxima música",
  genre: "Gênero",
  bitrate: "Bitrate / plano",
};

export type VoxSeverity = "error" | "warning";

export interface VoxIssue {
  field: string;
  message: string;
  severity: VoxSeverity;
}

export interface VoxFetchResult {
  ok: boolean;
  info: NowPlayingInfo | null;
  issues: VoxIssue[];
  raw: unknown;
  fetchedAt: string;
  error: string | null;
}

export function normalizeFieldMap(value: unknown): VoxFieldMap {
  const record = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_VOX_FIELD_MAP };
  (Object.keys(DEFAULT_VOX_FIELD_MAP) as Array<keyof VoxFieldMap>).forEach((key) => {
    const custom = record[key];
    if (typeof custom === "string" && custom.trim()) out[key] = custom.trim();
  });
  return out;
}

function pick(payload: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, payload);
}

function asText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

export function validateVoxPayload(payload: unknown, map: VoxFieldMap) {
  const issues: VoxIssue[] = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    issues.push({
      field: "payload",
      severity: "error",
      message: "A resposta da Vox não é um objeto JSON válido (esperado um objeto com os campos da rádio).",
    });
    return issues;
  }

  const titleValue = pick(payload, map.title);
  if (titleValue === undefined || titleValue === null || titleValue === "") {
    issues.push({
      field: map.title,
      severity: "error",
      message: `O campo obrigatório "${map.title}" não veio no payload da Vox. Ajuste o mapeamento de campos.`,
    });
  } else if (typeof titleValue !== "string" && typeof titleValue !== "number") {
    issues.push({
      field: map.title,
      severity: "error",
      message: `O campo "${map.title}" deveria ser texto, mas veio como ${Array.isArray(titleValue) ? "lista" : typeof titleValue}.`,
    });
  }

  const listeners = pick(payload, map.listeners);
  if (listeners !== undefined && listeners !== null && listeners !== "") {
    const parsed = Number.parseInt(String(listeners), 10);
    if (!Number.isFinite(parsed)) {
      issues.push({
        field: map.listeners,
        severity: "warning",
        message: `O campo "${map.listeners}" não é numérico; a contagem de ouvintes será ignorada.`,
      });
    }
  }

  const cover = pick(payload, map.cover);
  if (cover !== undefined && cover !== null && cover !== "") {
    if (typeof cover !== "string") {
      issues.push({
        field: map.cover,
        severity: "warning",
        message: `O campo "${map.cover}" deveria ser uma URL em texto.`,
      });
    } else if (!/^https?:\/\//i.test(cover.trim())) {
      issues.push({
        field: map.cover,
        severity: "warning",
        message: `A capa recebida em "${map.cover}" não é uma URL http(s) válida.`,
      });
    }
  }

  return issues;
}

export function mapVoxPayload(payload: unknown, map: VoxFieldMap): NowPlayingInfo | null {
  const title = asText(pick(payload, map.title));
  if (!title) return parseNowPlaying(payload);

  const listenersText = asText(pick(payload, map.listeners));
  const listeners = listenersText === null ? null : Number.parseInt(listenersText, 10);
  const cover = pick(payload, map.cover);

  return {
    title,
    stationTitle: asText(pick(payload, map.station)),
    status: asText(pick(payload, "status")),
    listeners: listeners !== null && Number.isFinite(listeners) ? listeners : null,
    nextTrack: asText(pick(payload, map.next)),
    genre: asText(pick(payload, map.genre)),
    coverUrl: typeof cover === "string" && /^https?:\/\//i.test(cover.trim()) ? cover.trim() : null,
    bitrate: asText(pick(payload, map.bitrate)),
  };
}

export async function fetchVoxNowPlaying(
  url: string,
  options: { token?: string | null; fieldMap?: unknown; signal?: AbortSignal } = {},
): Promise<VoxFetchResult> {
  const map = normalizeFieldMap(options.fieldMap);
  const fetchedAt = new Date().toISOString();
  const base: VoxFetchResult = { ok: false, info: null, issues: [], raw: null, fetchedAt, error: null };

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.token?.trim()) headers["Authorization"] = `Bearer ${options.token.trim()}`;

    const res = await fetch(normalizeMetadataUrl(url), {
      cache: "no-store",
      headers,
      ...(options.signal ? { signal: options.signal } : {}),
    });
    if (!res.ok) {
      return { ...base, error: `A Vox respondeu com status HTTP ${res.status}.` };
    }

    const text = await res.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ...base, error: "A Vox não retornou JSON válido (verifique a URL da API)." };
    }

    const issues = validateVoxPayload(payload, map);
    const info = mapVoxPayload(payload, map);
    const hasError = issues.some((i) => i.severity === "error");

    return {
      ok: !hasError && !!info,
      info,
      issues,
      raw: payload,
      fetchedAt,
      error: hasError
        ? "Formato de dados inconsistente na resposta da Vox."
        : info
          ? null
          : "Não foi possível identificar a música atual no payload da Vox.",
    };
  } catch (e) {
    return {
      ...base,
      error:
        e instanceof Error
          ? `Falha de comunicação com a Vox: ${e.message}`
          : "Falha de comunicação com a Vox.",
    };
  }
}
