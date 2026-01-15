import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    title_bn: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    is_published: false,
    is_featured: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        published_at: formData.is_published ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast.success("Blog post updated!");
      } else {
        const { error } = await supabase.from("blog_posts").insert(postData);

        if (error) throw error;
        toast.success("Blog post created!");
      }

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message || "Failed to save blog post");
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      title_bn: post.title_bn || "",
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      featured_image: post.featured_image || "",
      is_published: post.is_published,
      is_featured: post.is_featured,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Blog post deleted!");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          is_published: !post.is_published,
          published_at: !post.is_published ? new Date().toISOString() : null,
        })
        .eq("id", post.id);

      if (error) throw error;
      toast.success(post.is_published ? "Post unpublished" : "Post published");
      fetchPosts();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update post");
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      title_bn: "",
      slug: "",
      excerpt: "",
      content: "",
      featured_image: "",
      is_published: false,
      is_featured: false,
    });
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? "Edit Blog Post" : "Create Blog Post"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title (English)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (!editingPost) {
                          setFormData((prev) => ({
                            ...prev,
                            slug: generateSlug(e.target.value),
                          }));
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title_bn">Title (Bengali)</Label>
                    <Input
                      id="title_bn"
                      value={formData.title_bn}
                      onChange={(e) =>
                        setFormData({ ...formData, title_bn: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={8}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_published: checked })
                      }
                    />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                    <Label>Featured</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold">
                    {editingPost ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No blog posts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{post.title}</h3>
                    {post.is_featured && (
                      <Star className="h-4 w-4 text-gold fill-gold" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">/{post.slug}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={post.is_published ? "default" : "secondary"}
                      className={
                        post.is_published
                          ? "bg-green-500/20 text-green-500"
                          : ""
                      }
                    >
                      {post.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublished(post)}
                >
                  {post.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(post)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogPosts;