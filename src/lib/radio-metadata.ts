export interface NowPlayingInfo {
  title: string;
  stationTitle: string | null;
  status: string | null;
  listeners: number | null;
  nextTrack: string | null;
  genre: string | null;
  coverUrl: string | null;
  bitrate: string | null;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text || null;
}

function readableTrack(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  return text.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function songFromObject(value: unknown): string | null {
  const song = asRecord(value);
  if (!song) return null;
  const title = readableTrack(song.title ?? song.name ?? song.text);
  const artist = readableTrack(song.artist ?? song.author);
  if (artist && title && !title.toLocaleLowerCase().includes(artist.toLocaleLowerCase())) {
    return `${artist} - ${title}`;
  }
  return title;
}

export function normalizeMetadataUrl(value: string): string {
  const url = value.trim();
  if (url.startsWith("http://")) return `https://${url.slice("http://".length)}`;
  return url;
}

export function parseNowPlaying(payload: unknown): NowPlayingInfo | null {
  const root = asRecord(payload);
  if (!root) return null;

  const nowPlaying = asRecord(root.now_playing);
  const current = asRecord(root.current);
  const nestedSong = nowPlaying?.song;
  const directSong = root.song;
  const isVox = asText(root.musica_atual) !== null;

  const title =
    readableTrack(root.musica_atual) ??
    songFromObject(directSong) ??
    readableTrack(directSong) ??
    songFromObject(nestedSong) ??
    readableTrack(nestedSong) ??
    songFromObject(current) ??
    readableTrack(root.current_song) ??
    readableTrack(root.current) ??
    readableTrack(root.text) ??
    (!isVox ? readableTrack(root.title ?? root.titulo) : null);

  if (!title) return null;

  const listenerText = asText(root.ouvintes_conectados ?? root.listeners ?? root.listener_count);
  const parsedListeners = listenerText === null ? null : Number.parseInt(listenerText, 10);

  return {
    title,
    stationTitle: asText(root.titulo ?? root.station_name ?? root.station),
    status: asText(root.status),
    listeners: parsedListeners !== null && Number.isFinite(parsedListeners) ? parsedListeners : null,
    nextTrack: readableTrack(root.proxima_musica ?? root.next_song),
    genre: asText(root.genero ?? root.genre),
    coverUrl: asText(root.capa_musica ?? root.cover_url ?? root.artwork),
    bitrate: asText(root.plano_bitrate ?? root.bitrate),
  };
}