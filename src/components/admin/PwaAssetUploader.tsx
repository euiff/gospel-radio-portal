import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PWA_ASSET_SPECS, type PwaAsset, type PwaAssetSpec } from "@/lib/pwa-assets";

type ValidatedFile = { file: File; spec: PwaAssetSpec; width: number; height: number; error?: string };

async function dimensions(file: File) {
  if (file.type.includes("icon") || file.name.toLowerCase().endsWith(".ico")) return { width: 0, height: 0 };
  const bitmap = await createImageBitmap(file);
  const result = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return result;
}

function matchSpec(file: File, width: number, height: number) {
  if (file.name.toLowerCase().endsWith(".ico")) return PWA_ASSET_SPECS.find((spec) => spec.key === "favicon-ico");
  const exact = PWA_ASSET_SPECS.filter((spec) => spec.width === width && spec.height === height);
  if (exact.length === 1) return exact[0];
  return exact.find((spec) => file.name.toLowerCase().includes(spec.kind === "splash" ? "splash" : spec.kind === "favicon" ? "favicon" : spec.kind === "apple-touch-icon" ? "apple" : "icon"));
}

export function PwaAssetUploader({ version, assets, onChange }: { version: number; assets: PwaAsset[]; onChange: (assets: PwaAsset[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<ValidatedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const selectFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: ValidatedFile[] = [];
    const used = new Set<string>();
    for (const file of Array.from(files)) {
      let width = 0;
      let height = 0;
      try {
        ({ width, height } = await dimensions(file));
      } catch {
        next.push({ file, width, height, spec: PWA_ASSET_SPECS[0], error: "Imagem inválida ou corrompida" });
        continue;
      }
      const spec = matchSpec(file, width, height);
      if (!spec) {
        next.push({ file, width, height, spec: PWA_ASSET_SPECS[0], error: `Resolução ${width}x${height} não reconhecida` });
        continue;
      }
      const typeOk = spec.acceptedTypes.includes(file.type) || (spec.key === "favicon-ico" && file.name.toLowerCase().endsWith(".ico"));
      const error = !typeOk ? "Formato incompatível" : file.size > spec.maxKB * 1024 ? `Máximo de ${spec.maxKB} KB` : used.has(spec.key) ? "Resolução duplicada neste lote" : undefined;
      used.add(spec.key);
      next.push({ file, spec, width, height, error });
    }
    setQueue(next);
  };

  const upload = async () => {
    const valid = queue.filter((item) => !item.error);
    if (!valid.length) return toast.error("Selecione ao menos um arquivo válido.");
    setUploading(true);
    const uploaded = [...assets];
    try {
      for (const item of valid) {
        const path = `pwa/v${version}/${item.spec.fileName}`;
        const { error } = await supabase.storage.from("site-assets").upload(path, item.file, { contentType: item.file.type, upsert: true, cacheControl: "31536000" });
        if (error) throw error;
        const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
        const asset: PwaAsset = { key: item.spec.key, label: item.spec.label, kind: item.spec.kind, url: data.publicUrl, width: item.spec.width, height: item.spec.height, maxKB: item.spec.maxKB, mimeType: item.file.type || "image/png", sizeBytes: item.file.size };
        const index = uploaded.findIndex((current) => current.key === asset.key);
        if (index >= 0) uploaded[index] = asset;
        else uploaded.push(asset);
      }
      onChange(uploaded);
      setQueue([]);
      if (inputRef.current) inputRef.current.value = "";
      toast.success(`${valid.length} arquivo(s) preparado(s) para a versão v${version}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar os arquivos.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" className="gap-2" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" /> Selecionar arquivos
        </Button>
        <input ref={inputRef} type="file" multiple accept="image/png,image/x-icon,.ico" className="hidden" onChange={(event) => void selectFiles(event.target.files)} />
        <p className="text-xs text-muted-foreground">O sistema identifica a finalidade pela dimensão e valida formato e peso antes do envio.</p>
      </div>
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
              {item.error ? <XCircle className="size-5 shrink-0 text-destructive" /> : <CheckCircle2 className="size-5 shrink-0 text-primary" />}
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.file.name}</p><p className="text-xs text-muted-foreground">{item.width > 0 ? `${item.width}x${item.height} · ` : ""}{Math.ceil(item.file.size / 1024)} KB · {item.error || item.spec.label}</p></div>
            </div>
          ))}
          <Button type="button" onClick={upload} disabled={uploading || queue.every((item) => item.error)} className="gap-2">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Enviar arquivos válidos
          </Button>
        </div>
      )}
    </div>
  );
}