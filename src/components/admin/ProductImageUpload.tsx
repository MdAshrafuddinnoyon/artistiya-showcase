import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ProductImageUpload = ({ images, onImagesChange }: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
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

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error("Please enter an image URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    // Check if URL looks like an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExt = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    const isDataUrl = url.startsWith('data:image/');
    
    if (!hasImageExt && !isDataUrl && !url.includes('unsplash') && !url.includes('pexels') && !url.includes('cloudinary')) {
      // Still allow it but warn
      console.warn("URL may not be an image:", url);
    }

    if (images.includes(url)) {
      toast.error("This image URL already exists");
      return;
    }

    onImagesChange([...images, url]);
    setUrlInput("");
    toast.success("Image URL added");
  };

  const handleMediaSelect = (urls: string[]) => {
    const newImages = urls.filter(url => !images.includes(url));
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) added from library`);
    }
  };

  const removeImage = async (urlToRemove: string) => {
    // Check if it's a storage URL (from our bucket)
    if (urlToRemove.includes('product-images')) {
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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Product Images</label>
          <span className="text-xs text-muted-foreground">
            {images.length} image(s)
          </span>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
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

        {/* Upload / Library / URL Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="gap-2 text-xs sm:text-sm">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 text-xs sm:text-sm">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2 text-xs sm:text-sm">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">URL</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-3">
            <Button 
              variant="outline" 
              className="w-full h-20 border-dashed gap-2"
              onClick={() => setShowMediaPicker(true)}
            >
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
              <span>Select from Media Library</span>
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="mt-3">
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
          </TabsContent>

          <TabsContent value="url" className="mt-3">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                />
                <Button 
                  type="button" 
                  variant="gold" 
                  onClick={handleAddUrl}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter an external image URL. Supports Unsplash, Pexels, Cloudinary, and direct image links.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={() => {}}
        multiple
        onSelectMultiple={handleMediaSelect}
        accept="image/*"
        title="Select Product Images"
      />
    </>
  );
};

export default ProductImageUpload;
