 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2, Upload, X } from "lucide-react";
 import { toast } from "sonner";
 
 interface ImageUploadProps {
   value: string;
   onChange: (url: string) => void;
   label: string;
 }
 
 export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
   const [uploading, setUploading] = useState(false);
 
   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     try {
       setUploading(true);
       const fileExt = file.name.split(".").pop();
       const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
       const filePath = `${fileName}`;
 
       const { error: uploadError, data } = await supabase.storage
         .from("site-assets")
         .upload(filePath, file);
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from("site-assets")
         .getPublicUrl(filePath);
 
       onChange(publicUrl);
       toast.success("Imagem enviada com sucesso!");
     } catch (error: any) {
       toast.error("Erro no upload: " + error.message);
     } finally {
       setUploading(false);
     }
   };
 
   return (
     <div className="space-y-2">
       <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
         {label}
       </label>
       <div className="flex items-center gap-4">
         {value ? (
           <div className="relative w-20 h-20 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
             <img
               src={value}
               alt="Preview"
               className="max-w-full max-h-full object-contain"
             />
             <button
               type="button"
               onClick={() => onChange("")}
               className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition shadow-lg"
             >
               <X className="w-3 h-3" />
             </button>
           </div>
         ) : (
           <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition group">
             {uploading ? (
               <Loader2 className="w-6 h-6 text-accent animate-spin" />
             ) : (
               <>
                 <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent transition" />
                 <span className="text-[10px] text-muted-foreground mt-1">Enviar</span>
               </>
             )}
             <input
               type="file"
               className="hidden"
               accept="image/*"
               onChange={handleUpload}
               disabled={uploading}
             />
           </label>
         )}
         <div className="flex-1">
           <input
             value={value}
             onChange={(e) => onChange(e.target.value)}
             placeholder="Cole a URL ou faça o upload ao lado"
             className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-accent transition shadow-sm text-sm"
           />
         </div>
       </div>
     </div>
   );
 }