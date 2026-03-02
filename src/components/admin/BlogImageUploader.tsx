import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BlogImageUploaderProps {
  coverImage: string;
  galleryImages: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
}

export default function BlogImageUploader({
  coverImage,
  galleryImages,
  onCoverChange,
  onGalleryChange,
}: BlogImageUploaderProps) {
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setIsUploadingCover(true);
    try {
      const url = await uploadImage(file, "covers");
      if (url) {
        onCoverChange(url);
        toast.success("Imagem de capa enviada!");
      } else {
        toast.error("Erro ao enviar imagem");
      }
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        if (!file.type.startsWith("image/")) return Promise.resolve(null);
        return uploadImage(file, "gallery");
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        onGalleryChange([...galleryImages, ...validUrls]);
        toast.success(`${validUrls.length} imagem(s) adicionada(s) à galeria!`);
      }
    } catch (error) {
      toast.error("Erro ao enviar imagens");
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    onGalleryChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <div className="space-y-3 p-4 border rounded-lg">
        <h3 className="font-medium flex items-center gap-2">
          <ImagePlus className="w-4 h-4" />
          Imagem de Capa
        </h3>

        {coverImage ? (
          <div className="relative">
            <img
              src={coverImage}
              alt="Capa"
              className="w-full h-40 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onCoverChange("")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => coverInputRef.current?.click()}
          >
            {isUploadingCover ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {isUploadingCover ? "Enviando..." : "Clique para fazer upload"}
            </p>
          </div>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        <div className="text-xs text-muted-foreground">Ou cole uma URL:</div>
        <Input
          value={coverImage}
          onChange={(e) => onCoverChange(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Gallery */}
      <div className="space-y-3 p-4 border rounded-lg">
        <h3 className="font-medium flex items-center gap-2">
          <ImagePlus className="w-4 h-4" />
          Galeria de Imagens
        </h3>

        {galleryImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {galleryImages.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6"
                  onClick={() => removeGalleryImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => galleryInputRef.current?.click()}
        >
          {isUploadingGallery ? (
            <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin" />
          ) : (
            <ImagePlus className="w-6 h-6 mx-auto text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {isUploadingGallery ? "Enviando..." : "Adicionar imagens"}
          </p>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
