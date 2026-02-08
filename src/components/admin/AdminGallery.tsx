import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical, Image, FolderOpen, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

interface GalleryAlbum {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  cover_image_url: string | null;
  display_order: number;
  is_active: boolean;
  published_at: string;
}

interface GalleryItem {
  id: string;
  album_id: string | null;
  title: string | null;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  media_url: string;
  media_type: string;
  display_order: number;
  is_active: boolean;
}

const AdminGallery = () => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAlbums, setExpandedAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [albumsRes, itemsRes] = await Promise.all([
        supabase.from("gallery_albums").select("*").order("display_order"),
        supabase.from("gallery_items").select("*").order("display_order"),
      ]);

      if (albumsRes.error) throw albumsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setAlbums(albumsRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error("Error fetching gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAlbum = async () => {
    try {
      const { error } = await supabase.from("gallery_albums").insert({
        title: "New Album",
        display_order: albums.length,
      });

      if (error) throw error;
      toast.success("Album created");
      fetchData();
    } catch (error) {
      console.error("Error adding album:", error);
      toast.error("Failed to create album");
    }
  };

  const deleteAlbum = async (id: string) => {
    if (!confirm("Delete this album and all its items?")) return;

    try {
      const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
      if (error) throw error;
      toast.success("Album deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting album:", error);
      toast.error("Failed to delete album");
    }
  };

  const addItem = async (albumId: string) => {
    try {
      const albumItems = items.filter((i) => i.album_id === albumId);
      const { error } = await supabase.from("gallery_items").insert({
        album_id: albumId,
        media_url: "/placeholder.svg",
        display_order: albumItems.length,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Item added - Please upload an image");
      fetchData();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const { error } = await supabase.from("gallery_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const updateAlbumField = (id: string, field: keyof GalleryAlbum, value: any) => {
    setAlbums((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const updateItemField = (id: string, field: keyof GalleryItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const toggleAlbum = (id: string) => {
    setExpandedAlbums((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save albums
      for (const album of albums) {
        const { error } = await supabase
          .from("gallery_albums")
          .update({
            title: album.title,
            title_bn: album.title_bn,
            description: album.description,
            description_bn: album.description_bn,
            cover_image_url: album.cover_image_url,
            display_order: album.display_order,
            is_active: album.is_active,
            published_at: album.published_at,
          })
          .eq("id", album.id);

        if (error) throw error;
      }

      // Save items
      for (const item of items) {
        const { error } = await supabase
          .from("gallery_items")
          .update({
            title: item.title,
            title_bn: item.title_bn,
            description: item.description,
            description_bn: item.description_bn,
            media_url: item.media_url,
            media_type: item.media_type,
            display_order: item.display_order,
            is_active: item.is_active,
          })
          .eq("id", item.id);

        if (error) throw error;
      }

      toast.success("Gallery saved successfully");
    } catch (error) {
      console.error("Error saving gallery:", error);
      toast.error("Failed to save gallery");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Image className="h-5 w-5 text-gold" />
            Gallery / Archive
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your handmade work showcases in albums
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={addAlbum} className="flex-1 sm:flex-none">
            <FolderOpen className="h-4 w-4 mr-2" />
            New Album
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {albums.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No albums yet</p>
          <Button variant="gold" onClick={addAlbum}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Album
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {albums.map((album) => {
            const albumItems = items.filter((i) => i.album_id === album.id);
            const isExpanded = expandedAlbums.includes(album.id);

            return (
              <Card key={album.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleAlbum(album.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Cover thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {album.cover_image_url ? (
                        <img
                          src={album.cover_image_url}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Input
                        value={album.title}
                        onChange={(e) => updateAlbumField(album.id, "title", e.target.value)}
                        className="font-medium text-foreground bg-transparent border-none p-0 h-auto text-lg focus-visible:ring-0"
                        placeholder="Album Title"
                      />
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          {albumItems.length} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(album.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {album.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={album.is_active}
                        onCheckedChange={(checked) => updateAlbumField(album.id, "is_active", checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteAlbum(album.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-4 pt-0 border-t border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      {/* Album Details */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Title (বাংলা)</Label>
                          <Input
                            value={album.title_bn || ""}
                            onChange={(e) => updateAlbumField(album.id, "title_bn", e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={album.description || ""}
                            onChange={(e) => updateAlbumField(album.id, "description", e.target.value)}
                            className="mt-1 text-sm"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Published Date</Label>
                          <Input
                            type="date"
                            value={album.published_at?.split("T")[0] || ""}
                            onChange={(e) => updateAlbumField(album.id, "published_at", e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Cover Image */}
                      <div>
                        <Label className="text-xs mb-1.5 block">Cover Image</Label>
                        <ImageUploadZone
                          value={album.cover_image_url || ""}
                          onChange={(url) => updateAlbumField(album.id, "cover_image_url", url)}
                          onRemove={() => updateAlbumField(album.id, "cover_image_url", null)}
                          aspectRatio="video"
                          bucket="media"
                          folder="gallery"
                          showUrlInput={false}
                        />
                      </div>
                    </div>

                    {/* Album Items */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Album Items</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addItem(album.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {albumItems.length === 0 ? (
                        <div className="p-8 text-center bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">No items in this album</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {albumItems.map((item, index) => (
                            <div key={item.id} className="group relative">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <ImageUploadZone
                                  value={item.media_url}
                                  onChange={(url) => updateItemField(item.id, "media_url", url)}
                                  onRemove={() => {}}
                                  aspectRatio="square"
                                  bucket="media"
                                  folder="gallery"
                                  showUrlInput={false}
                                />
                              </div>
                              <div className="absolute top-1 left-1 flex items-center gap-1">
                                <GripVertical className="h-3 w-3 text-white/70" />
                                <span className="text-xs text-white/70">#{index + 1}</span>
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <div className="mt-1">
                                <Input
                                  value={item.title || ""}
                                  onChange={(e) => updateItemField(item.id, "title", e.target.value)}
                                  className="text-xs h-7"
                                  placeholder="Caption..."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
