import { useState, useEffect, useRef } from "react";
import { Upload, Search, Image, X, Loader2, Check, FileVideo, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  bucket: string;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  multiple?: boolean;
  onSelectMultiple?: (urls: string[]) => void;
  accept?: string; // "image/*", "video/*", "application/pdf", etc.
  title?: string;
}

const MediaPickerModal = ({ 
  open, 
  onClose, 
  onSelect, 
  multiple = false,
  onSelectMultiple,
  accept = "image/*",
  title = "Select Media"
}: MediaPickerModalProps) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("library");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchFiles();
      setSelectedFiles([]);
    }
  }, [open]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFiles: MediaFile[] = [];

      // Fetch from media bucket
      const { data: mediaFiles } = await supabase.storage
        .from("media")
        .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

      if (mediaFiles) {
        for (const file of mediaFiles) {
          if (file.name && !file.name.startsWith(".")) {
            const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(file.name);
            allFiles.push({
              id: file.id || file.name,
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || getMimeTypeFromName(file.name),
              created_at: file.created_at || new Date().toISOString(),
              bucket: "media",
            });
          }
        }
      }

      // Fetch from product-images bucket
      const { data: productFiles } = await supabase.storage
        .from("product-images")
        .list("products", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

      if (productFiles) {
        for (const file of productFiles) {
          if (file.name && !file.name.startsWith(".")) {
            const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(`products/${file.name}`);
            allFiles.push({
              id: `product-${file.id || file.name}`,
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || getMimeTypeFromName(file.name),
              created_at: file.created_at || new Date().toISOString(),
              bucket: "product-images",
            });
          }
        }
      }

      setFiles(allFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMimeTypeFromName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      pdf: 'application/pdf',
      csv: 'text/csv',
      ico: 'image/x-icon',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(uploadedFiles)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("media")
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      
      toast.success("Files uploaded successfully");
      fetchFiles();

      // Auto-select uploaded files
      if (multiple && onSelectMultiple) {
        setSelectedFiles(prev => [...prev, ...uploadedUrls]);
      } else if (uploadedUrls.length > 0) {
        onSelect(uploadedUrls[0]);
        onClose();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleFileSelection = (url: string) => {
    if (multiple) {
      setSelectedFiles(prev => 
        prev.includes(url) 
          ? prev.filter(u => u !== url)
          : [...prev, url]
      );
    } else {
      onSelect(url);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiple && onSelectMultiple) {
      onSelectMultiple(selectedFiles);
    } else if (selectedFiles.length > 0) {
      onSelect(selectedFiles[0]);
    }
    onClose();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-6 w-6 text-muted-foreground" />;
    if (type.startsWith("video/")) return <FileVideo className="h-6 w-6 text-muted-foreground" />;
    if (type === "application/pdf") return <FileText className="h-6 w-6 text-muted-foreground" />;
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  const isImage = (type: string) => type.startsWith("image/");
  const isVideo = (type: string) => type.startsWith("video/");

  // Filter files based on accept prop
  const getFilteredFiles = () => {
    let filtered = files;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by accepted types
    if (accept && accept !== "*/*") {
      const acceptTypes = accept.split(",").map(t => t.trim());
      filtered = filtered.filter(file => {
        return acceptTypes.some(acceptType => {
          if (acceptType === "image/*") return file.type.startsWith("image/");
          if (acceptType === "video/*") return file.type.startsWith("video/");
          if (acceptType === "audio/*") return file.type.startsWith("audio/");
          return file.type === acceptType || file.name.endsWith(acceptType.replace(".", ""));
        });
      });
    }

    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  const getAcceptAttribute = () => {
    if (accept === "image/*") return "image/*";
    if (accept === "video/*") return "video/*";
    return accept || "*/*";
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFiles.includes(file.url);
                    return (
                      <div
                        key={file.id}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected ? 'border-gold ring-2 ring-gold/30' : 'border-transparent hover:border-gold/50'
                        }`}
                        onClick={() => toggleFileSelection(file.url)}
                      >
                        {isImage(file.type) ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        ) : isVideo(file.type) ? (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <FileVideo className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-2">
                            {getFileIcon(file.type)}
                            <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <div className="bg-gold rounded-full p-1">
                              <Check className="h-4 w-4 text-background" />
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-[10px] text-white truncate">{file.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col items-center justify-center mt-4">
            <div
              className={`w-full max-w-md border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                uploading ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 cursor-pointer'
              }`}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                accept={getAcceptAttribute()}
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-gold animate-spin" />
                  <p className="text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Click to upload files</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports images, videos, PDFs, and more
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <p className="text-sm text-muted-foreground">
            {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : "No files selected"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {multiple && (
              <Button 
                variant="gold" 
                onClick={handleConfirmSelection}
                disabled={selectedFiles.length === 0}
              >
                Select ({selectedFiles.length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerModal;
