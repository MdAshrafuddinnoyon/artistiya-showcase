import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Star, Search, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BulkSelectionToolbar from "./BulkSelectionToolbar";
import RichTextEditor from "./RichTextEditor";
import AdminBlogCategories from "./AdminBlogCategories";
import AdminBlogSettings from "./AdminBlogSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_bn: string | null;
  content: string;
  content_bn: string | null;
  featured_image: string | null;
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
  created_at: string;
  category?: {
    name: string;
    name_bn: string | null;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
}

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("posts");

  const [formData, setFormData] = useState({
    title: "",
    title_bn: "",
    slug: "",
    excerpt: "",
    excerpt_bn: "",
    content: "",
    content_bn: "",
    featured_image: "",
    category_id: "",
    is_published: false,
    is_featured: false,
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(name, name_bn)
        `)
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, name_bn, slug")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
        title: formData.title,
        title_bn: formData.title_bn || null,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt || null,
        excerpt_bn: formData.excerpt_bn || null,
        content: formData.content,
        content_bn: formData.content_bn || null,
        featured_image: formData.featured_image || null,
        category_id: formData.category_id || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
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
      excerpt_bn: post.excerpt_bn || "",
      content: post.content,
      content_bn: post.content_bn || "",
      featured_image: post.featured_image || "",
      category_id: post.category_id || "",
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
      excerpt_bn: "",
      content: "",
      content_bn: "",
      featured_image: "",
      category_id: "",
      is_published: false,
      is_featured: false,
    });
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => setSelectedIds(filteredPosts.map(p => p.id));
  const handleDeselectAll = () => setSelectedIds([]);

  const handleBulkPublish = async () => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ is_published: true, published_at: new Date().toISOString() })
        .in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} posts published`);
      setSelectedIds([]);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to publish posts");
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ is_published: false, published_at: null })
        .in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} posts unpublished`);
      setSelectedIds([]);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to unpublish posts");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} posts? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} posts deleted`);
      setSelectedIds([]);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete posts");
    }
  };

  const handleExport = () => {
    const exportData = posts.map(p => ({
      title: p.title,
      title_bn: p.title_bn,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      is_published: p.is_published,
      is_featured: p.is_featured,
      created_at: p.created_at,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-posts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Posts exported!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedPosts = JSON.parse(text);
      
      if (!Array.isArray(importedPosts)) {
        throw new Error("Invalid format");
      }

      for (const post of importedPosts) {
        await supabase.from("blog_posts").insert({
          title: post.title,
          title_bn: post.title_bn,
          slug: post.slug + '-imported-' + Date.now(),
          excerpt: post.excerpt,
          content: post.content,
          is_published: false,
          is_featured: post.is_featured || false,
        });
      }

      toast.success(`${importedPosts.length} posts imported as drafts`);
      fetchPosts();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import posts. Check file format.");
    }
    
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage blog content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6 mt-6">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? "Edit Blog Post" : "Create Blog Post"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="english">
                    <TabsList className="mb-4">
                      <TabsTrigger value="english">English</TabsTrigger>
                      <TabsTrigger value="bengali">বাংলা</TabsTrigger>
                    </TabsList>

                    <TabsContent value="english" className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
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
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                          rows={2}
                          placeholder="Brief summary of the post..."
                        />
                      </div>

                      <div>
                        <Label>Content</Label>
                        <RichTextEditor
                          content={formData.content}
                          onChange={(html) => setFormData({ ...formData, content: html })}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="bengali" className="space-y-4">
                      <div>
                        <Label htmlFor="title_bn">Title (Bengali)</Label>
                        <Input
                          id="title_bn"
                          value={formData.title_bn}
                          onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                          className="font-bengali"
                        />
                      </div>

                      <div>
                        <Label htmlFor="excerpt_bn">Excerpt (Bengali)</Label>
                        <Textarea
                          id="excerpt_bn"
                          value={formData.excerpt_bn}
                          onChange={(e) => setFormData({ ...formData, excerpt_bn: e.target.value })}
                          rows={2}
                          className="font-bengali"
                        />
                      </div>

                      <div>
                        <Label>Content (Bengali)</Label>
                        <RichTextEditor
                          content={formData.content_bn}
                          onChange={(html) => setFormData({ ...formData, content_bn: html })}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="featured_image">Featured Image URL</Label>
                    <Input
                      id="featured_image"
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      placeholder="https://..."
                    />
                    {formData.featured_image && (
                      <img 
                        src={formData.featured_image} 
                        alt="Preview" 
                        className="mt-2 h-32 w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                      <Label>Published</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                      />
                      <Label>Featured</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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

          {/* Bulk Selection Toolbar */}
          <BulkSelectionToolbar
            selectedIds={selectedIds}
            totalCount={filteredPosts.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkDelete={handleBulkDelete}
            onBulkPublish={handleBulkPublish}
            onBulkUnpublish={handleBulkUnpublish}
            showPublish={true}
          />

          {/* Posts List */}
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
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-card border border-border rounded-lg p-4 flex items-center justify-between transition-all ${
                    selectedIds.includes(post.id) ? 'ring-1 ring-gold bg-gold/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={selectedIds.includes(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                    />
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{post.title}</h3>
                        {post.is_featured && (
                          <Star className="h-4 w-4 text-gold fill-gold" />
                        )}
                        {post.category && (
                          <Badge variant="outline" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">/{post.slug}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={post.is_published ? "default" : "secondary"}
                          className={post.is_published ? "bg-green-500/20 text-green-500" : ""}
                        >
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => togglePublished(post)}>
                      {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <AdminBlogCategories />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AdminBlogSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBlogPosts;
