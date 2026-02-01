import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, GripVertical, Upload, Library, X, Maximize2, Star } from "lucide-react";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Collection {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  description_bn: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
}

const AdminCollections = () => {
  const queryClient = useQueryClient();
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Collection[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (collection: Partial<Collection>) => {
      if (collection.id) {
        const { error } = await supabase
          .from("collections")
          .update(collection)
          .eq("id", collection.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = collection;
        const { error } = await supabase
          .from("collections")
          .insert([insertData as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections-admin"] });
      setEditingCollection(null);
      toast.success("Collection saved!");
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error("Failed to save collection");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections-admin"] });
      toast.success("Collection deleted!");
    },
  });

  const handleAdd = () => {
    setEditingCollection({
      id: "",
      name: "",
      name_bn: "",
      slug: "",
      description: "",
      description_bn: "",
      image_url: "",
      display_order: collections.length,
      is_active: true,
      is_featured: false,
    });
  };

  const handleSave = () => {
    if (!editingCollection?.name || !editingCollection?.slug) {
      toast.error("Name and slug are required");
      return;
    }
    const { id, ...data } = editingCollection;
    saveMutation.mutate(id ? editingCollection : data);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageUpload = async (file: File) => {
    if (!editingCollection) return;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `collection-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      setEditingCollection({ ...editingCollection, image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (editingCollection) {
      setEditingCollection({ ...editingCollection, image_url: url });
    }
    setMediaPickerOpen(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Collections Manager</h2>
          <p className="text-muted-foreground">Manage curated collections with media support</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Collection
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Collection Image"
      />

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {editingCollection && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCollection.id ? "Edit" : "Add"} Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Collection Image</Label>
                <div className="relative">
                  {editingCollection.image_url ? (
                    <div className="relative group">
                      <img
                        src={editingCollection.image_url}
                        alt="Collection"
                        className="w-full aspect-[3/4] object-cover rounded-lg border border-border"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" onClick={() => setPreviewImage(editingCollection.image_url)}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => setMediaPickerOpen(true)}>
                          <Library className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => setEditingCollection({ ...editingCollection, image_url: "" })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
                      onClick={() => setMediaPickerOpen(true)}
                    >
                      {uploading ? (
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to add image</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Upload
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setMediaPickerOpen(true)}>
                    <Library className="h-4 w-4 mr-1" /> Library
                  </Button>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingCollection.is_active}
                      onCheckedChange={(checked) => setEditingCollection({ ...editingCollection, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingCollection.is_featured}
                      onCheckedChange={(checked) => setEditingCollection({ ...editingCollection, is_featured: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-gold" /> Featured
                    </Label>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="bn">বাংলা</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name (English)</Label>
                        <Input
                          value={editingCollection.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const updates: Partial<Collection> = { name };
                            if (!editingCollection.id || !editingCollection.slug) {
                              updates.slug = generateSlug(name);
                            }
                            setEditingCollection({ ...editingCollection, ...updates });
                          }}
                          placeholder="Summer Collection"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={editingCollection.slug}
                          onChange={(e) => setEditingCollection({ ...editingCollection, slug: e.target.value })}
                          placeholder="summer-collection"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description (English)</Label>
                      <Textarea
                        value={editingCollection.description || ""}
                        onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                        placeholder="Describe this collection..."
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="bn" className="space-y-4">
                    <div>
                      <Label>নাম (বাংলা)</Label>
                      <Input
                        value={editingCollection.name_bn || ""}
                        onChange={(e) => setEditingCollection({ ...editingCollection, name_bn: e.target.value })}
                        placeholder="গ্রীষ্মকালীন কালেকশন"
                        className="font-bengali"
                      />
                    </div>
                    <div>
                      <Label>বিবরণ (বাংলা)</Label>
                      <Textarea
                        value={editingCollection.description_bn || ""}
                        onChange={(e) => setEditingCollection({ ...editingCollection, description_bn: e.target.value })}
                        placeholder="এই কালেকশন সম্পর্কে লিখুন..."
                        rows={4}
                        className="font-bengali"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                    <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Collection"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingCollection(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className={`overflow-hidden ${!collection.is_active ? "opacity-60" : ""}`}>
            <div className="relative aspect-[3/4]">
              {collection.image_url ? (
                <img
                  src={collection.image_url}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {collection.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/90 text-charcoal-deep text-xs rounded mb-2">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
                <h3 className="font-display text-lg text-white">{collection.name}</h3>
                <p className="text-white/70 text-sm line-clamp-2">{collection.description}</p>
              </div>
            </div>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">/{collection.slug}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCollection(collection)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this collection?")) {
                      deleteMutation.mutate(collection.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="mb-4">No collections yet</p>
            <Button variant="gold" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Collection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCollections;
