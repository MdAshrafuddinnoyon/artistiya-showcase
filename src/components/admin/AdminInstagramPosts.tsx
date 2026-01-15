import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Upload, Eye, EyeOff, GripVertical, ExternalLink, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstagramPost {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminInstagramPosts = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPost = async () => {
    try {
      const { error } = await supabase.from("instagram_posts").insert({
        image_url: "https://placehold.co/400x400/1a1a1a/d4af37?text=Upload+Image",
        caption: "Add caption...",
        link_url: "https://instagram.com/artistiya.store",
        display_order: posts.length,
      });

      if (error) throw error;
      toast.success("Post added");
      fetchPosts();
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error("Failed to add post");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;

    try {
      const { error } = await supabase.from("instagram_posts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Post deleted");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const updatePostField = (id: string, field: keyof InstagramPost, value: any) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const post of posts) {
        const { error } = await supabase
          .from("instagram_posts")
          .update({
            image_url: post.image_url,
            caption: post.caption,
            link_url: post.link_url,
            is_active: post.is_active,
            display_order: post.display_order,
          })
          .eq("id", post.id);

        if (error) throw error;
      }
      toast.success("All posts saved");
    } catch (error) {
      console.error("Error saving posts:", error);
      toast.error("Failed to save posts");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (postId: string, file: File) => {
    setUploading(postId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `instagram-${postId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      updatePostField(postId, "image_url", publicUrl);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Instagram className="h-5 w-5 text-gold" />
            Instagram Posts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Instagram section images (these display on homepage)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addPost}>
            <Plus className="h-4 w-4 mr-2" />
            Add Post
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedPostId) {
            handleImageUpload(selectedPostId, file);
          }
        }}
      />

      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <Instagram className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No Instagram posts yet</p>
          <Button variant="gold" onClick={addPost}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Post
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post, index) => (
            <Card key={post.id} className="overflow-hidden">
              <div
                className="aspect-square relative cursor-pointer group"
                onClick={() => {
                  setSelectedPostId(post.id);
                  fileInputRef.current?.click();
                }}
              >
                {uploading === post.id ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <img
                      src={post.image_url}
                      alt={post.caption || "Instagram post"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {post.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={post.is_active}
                      onCheckedChange={(checked) => updatePostField(post.id, "is_active", checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Caption</Label>
                  <Textarea
                    value={post.caption || ""}
                    onChange={(e) => updatePostField(post.id, "caption", e.target.value)}
                    className="mt-1 text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-xs">Link URL</Label>
                  <Input
                    value={post.link_url || ""}
                    onChange={(e) => updatePostField(post.id, "link_url", e.target.value)}
                    className="mt-1 text-sm"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInstagramPosts;
