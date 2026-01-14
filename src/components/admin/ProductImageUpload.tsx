import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ProductImageUpload = ({ images, onImagesChange }: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const url = await uploadImage(file);
        newUrls.push(url);
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (urlToRemove: string) => {
    // Extract file path from URL for deletion
    try {
      const url = new URL(urlToRemove);
      const pathParts = url.pathname.split('/product-images/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('product-images').remove([filePath]);
      }
    } catch (error) {
      console.error("Error deleting from storage:", error);
    }

    onImagesChange(images.filter(img => img !== urlToRemove));
  };

  const setAsPrimary = (index: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Product Images</label>
        <span className="text-xs text-muted-foreground">
          {images.length} image(s) • Max 5MB each
        </span>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div 
              key={url} 
              className={`relative aspect-square rounded-lg overflow-hidden bg-muted group ${
                index === 0 ? 'ring-2 ring-gold' : ''
              }`}
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gold text-charcoal-deep text-[10px] font-semibold rounded">
                  Primary
                </span>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index !== 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/80 hover:bg-background text-foreground"
                    onClick={() => setAsPrimary(index)}
                    title="Set as primary"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-destructive/80 hover:bg-destructive text-white"
                  onClick={() => removeImage(url)}
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 cursor-pointer'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageUpload;
