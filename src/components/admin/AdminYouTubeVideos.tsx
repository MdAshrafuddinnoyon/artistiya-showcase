import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Youtube } from "lucide-react";
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

interface YouTubeVideo {
  id: string;
  title: string;
  title_bn: string | null;
  video_id: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminYouTubeVideos = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    title_bn: "",
    video_id: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const videoId = extractVideoId(formData.video_id);
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      const videoData = {
        title: formData.title,
        title_bn: formData.title_bn || null,
        video_id: videoId,
        description: formData.description || null,
        thumbnail_url: thumbnail,
        is_active: formData.is_active,
        display_order: editingVideo?.display_order ?? videos.length,
      };

      if (editingVideo) {
        const { error } = await supabase
          .from("youtube_videos")
          .update(videoData)
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast.success("Video updated!");
      } else {
        const { error } = await supabase.from("youtube_videos").insert(videoData);

        if (error) throw error;
        toast.success("Video added!");
      }

      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      console.error("Error saving video:", error);
      toast.error(error.message || "Failed to save video");
    }
  };

  const handleEdit = (video: YouTubeVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      title_bn: video.title_bn || "",
      video_id: video.video_id,
      description: video.description || "",
      is_active: video.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Video deleted!");
      fetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const toggleActive = async (video: YouTubeVideo) => {
    try {
      const { error } = await supabase
        .from("youtube_videos")
        .update({ is_active: !video.is_active })
        .eq("id", video.id);

      if (error) throw error;
      toast.success(video.is_active ? "Video hidden" : "Video visible");
      fetchVideos();
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update video");
    }
  };

  const resetForm = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      title_bn: "",
      video_id: "",
      description: "",
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">YouTube Videos</h1>
          <p className="text-muted-foreground">
            Manage YouTube videos displayed on homepage
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Edit Video" : "Add YouTube Video"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title (English)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
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
                <Label htmlFor="video_id">YouTube URL or Video ID</Label>
                <Input
                  id="video_id"
                  value={formData.video_id}
                  onChange={(e) =>
                    setFormData({ ...formData, video_id: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=... or video ID"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Active (visible on homepage)</Label>
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
                  {editingVideo ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No videos added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {!video.is_active && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Badge variant="secondary">Hidden</Badge>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-foreground truncate">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(video)}
                  >
                    {video.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(video)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminYouTubeVideos;