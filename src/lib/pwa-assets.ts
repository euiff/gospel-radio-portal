export type PwaAssetKind = "favicon" | "icon" | "apple-touch-icon" | "splash";

export type PwaAsset = {
  key: string;
  label: string;
  kind: PwaAssetKind;
  url: string;
  width: number;
  height: number;
  maxKB: number;
  mimeType: string;
  sizeBytes?: number;
};

export type PwaAssetSpec = Omit<PwaAsset, "url" | "mimeType" | "sizeBytes"> & {
  fileName: string;
  acceptedTypes: string[];
  required: boolean;
};

const png = ["image/png"];

export const PWA_ASSET_SPECS: PwaAssetSpec[] = [
  { key: "favicon-ico", label: "Favicon ICO", kind: "favicon", fileName: "favicon.ico", width: 0, height: 0, maxKB: 300, acceptedTypes: ["image/x-icon", "image/vnd.microsoft.icon"], required: false },
  { key: "favicon-64", label: "Favicon 64", kind: "favicon", fileName: "favicon-64.png", width: 64, height: 64, maxKB: 60, acceptedTypes: png, required: true },
  ...[96, 144, 192, 384, 512].map((size): PwaAssetSpec => ({ key: `icon-${size}`, label: `Ícone ${size}`, kind: "icon", fileName: `icon-${size}.png`, width: size, height: size, maxKB: size >= 384 ? 600 : 180, acceptedTypes: png, required: true })),
  ...[152, 167, 180].map((size): PwaAssetSpec => ({ key: `apple-${size}`, label: `Apple Touch ${size}`, kind: "apple-touch-icon", fileName: `apple-touch-icon-${size}.png`, width: size, height: size, maxKB: 180, acceptedTypes: png, required: true })),
  ...[[1170, 2532], [1284, 2778], [1179, 2556], [1290, 2796], [1125, 2436], [828, 1792], [1242, 2688], [750, 1334], [1536, 2048], [1668, 2388], [2048, 2732]].map(([width, height]): PwaAssetSpec => ({ key: `splash-${width}x${height}`, label: `Splash ${width}x${height}`, kind: "splash", fileName: `splash-${width}x${height}.png`, width, height, maxKB: 1200, acceptedTypes: png, required: false })),
];

export function defaultPwaAssets(): PwaAsset[] {
  return PWA_ASSET_SPECS.filter((spec) => spec.key !== "favicon-ico").map((spec) => ({
    key: spec.key,
    label: spec.label,
    kind: spec.kind,
    url: spec.kind === "favicon" ? "/favicon.png" : spec.kind === "apple-touch-icon" ? `/icons/apple-touch-icon${spec.width === 180 ? "" : `-${spec.width}`}.png` : `/icons/${spec.fileName}`,
    width: spec.width,
    height: spec.height,
    maxKB: spec.maxKB,
    mimeType: "image/png",
  }));
}

export function readPwaAssets(value: unknown): PwaAsset[] {
  if (!Array.isArray(value)) return [];
  return value.filter((asset): asset is PwaAsset => Boolean(asset && typeof asset === "object" && typeof (asset as PwaAsset).key === "string" && typeof (asset as PwaAsset).url === "string"));
}