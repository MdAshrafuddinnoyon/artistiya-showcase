import { useState, useRef } from "react";
import { Upload, Library, ZoomIn, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";

interface ImageUploadZoneProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  bucket?: string;
  folder?: string;
  aspectRatio?: "square" | "video" | "banner" | "portrait";
  showUrlInput?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const ImageUploadZone = ({
  value,
  onChange,
  onRemove,
  label,
  bucket = "product-images",
  folder = "uploads",
  aspectRatio = "video",
  showUrlInput = true,
  placeholder = "No image selected",
  disabled = false,
}: ImageUploadZoneProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
    portrait: "aspect-[3/4]",
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = "";
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
  };

  const handleMediaSelect = (url: string) => {
    onChange(url);
    setMediaPickerOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {value ? (
        <div className="relative group">
          <div className={`${aspectClasses[aspectRatio]} rounded-lg overflow-hidden border border-border bg-muted`}>
            <img
              src={value}
              alt={label || "Uploaded image"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          
          {/* Hover Controls */}
          <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMediaPickerOpen(true)}
                disabled={disabled}
              >
                <Library className="h-3 w-3 mr-1" />
                Library
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPreviewOpen(true)}
              >
                <ZoomIn className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${aspectClasses[aspectRatio]} rounded-lg border-2 border-dashed border-border bg-muted/50`}>
          {isUploading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gold mb-2" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  disabled={disabled}
                >
                  <Library className="h-3 w-3 mr-1" />
                  Library
                </Button>
              </div>
              {showUrlInput && (
                <>
                  <p className="text-[10px] text-muted-foreground">or paste image URL below</p>
                  <Input
                    placeholder="https://..."
                    className="max-w-[200px] h-7 text-xs"
                    disabled={disabled}
                    onBlur={(e) => {
                      if (e.target.value) {
                        onChange(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        if (target.value) {
                          onChange(target.value);
                        }
                      }
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Image"
      />

      {/* Image Preview Modal */}
      {previewOpen && value && (
        <div
          className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={value}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80"
              onClick={() => setPreviewOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
