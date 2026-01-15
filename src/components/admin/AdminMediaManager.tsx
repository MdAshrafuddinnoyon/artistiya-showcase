import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Copy, Search, Image, FileText, File, Grid, List, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

const AdminMediaManager = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data: mediaFiles, error: mediaError } = await supabase.storage
        .from("media")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      const { data: productFiles, error: productError } = await supabase.storage
        .from("product-images")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      const allFiles: MediaFile[] = [];

      if (mediaFiles) {
        for (const file of mediaFiles) {
          if (file.name) {
            const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(file.name);
            allFiles.push({
              id: file.id || file.name,
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || "unknown",
              created_at: file.created_at || new Date().toISOString(),
            });
          }
        }
      }

      if (productFiles) {
        for (const file of productFiles) {
          if (file.name && !file.name.startsWith(".")) {
            const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(file.name);
            allFiles.push({
              id: `product-${file.id || file.name}`,
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || "unknown",
              created_at: file.created_at || new Date().toISOString(),
            });
          }
        }
      }

      setFiles(allFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(uploadedFiles)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("media")
          .upload(fileName, file);

        if (error) throw error;
      }
      
      toast.success("Files uploaded successfully");
      fetchFiles();
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

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const bucket = file.id.startsWith("product-") ? "product-images" : "media";
      const { error } = await supabase.storage
        .from(bucket)
        .remove([file.name]);

      if (error) throw error;
      
      toast.success("File deleted");
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (type === "application/pdf") return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const isImage = (type: string) => type.startsWith("image/");

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Media Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your website images and files
          </p>
        </div>
        <Button
          variant="gold"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
          accept="image/*,.pdf,.doc,.docx"
        />
      </div>

      {/* Search and View Mode */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border border-border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No files found" : "No media files yet"}
          </p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload your first file
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-gold transition-all"
              onClick={() => {
                setSelectedFile(file);
                setPreviewOpen(true);
              }}
            >
              <div className="aspect-square bg-muted relative">
                {isImage(file.type) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gold"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(file.url);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs truncate text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                setSelectedFile(file);
                setPreviewOpen(true);
              }}
            >
              <div className="h-12 w-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                {isImage(file.type) ? (
                  <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  getFileIcon(file.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(file.url);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {isImage(selectedFile.type) ? (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="w-full max-h-[60vh] object-contain"
                  />
                </div>
              ) : (
                <div className="py-12 text-center">
                  {getFileIcon(selectedFile.type)}
                  <p className="text-muted-foreground mt-2">Preview not available</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyUrl(selectedFile.url)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button variant="outline" asChild>
                  <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedFile);
                    setPreviewOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
                <p><strong>URL:</strong> <code className="text-xs">{selectedFile.url}</code></p>
                <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMediaManager;
