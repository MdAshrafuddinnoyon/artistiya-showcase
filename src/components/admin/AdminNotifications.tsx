import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Bell, Send, Globe, User, Eye, RefreshCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  title_bn: string | null;
  message: string;
  message_bn: string | null;
  type: string;
  is_read: boolean;
  is_global: boolean;
  link_url: string | null;
  image_url: string | null;
  user_id: string | null;
  created_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    title_bn: "",
    message: "",
    message_bn: "",
    type: "info",
    is_global: true,
    link_url: "",
    image_url: "",
  });

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription with notification sound
    const channel = supabase
      .channel('admin_notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          playNotificationSound();
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
            toast.info("New order received!", { duration: 5000 });
          }
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      // Audio not supported or blocked by browser
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const notificationData = {
        title: formData.title,
        title_bn: formData.title_bn || null,
        message: formData.message,
        message_bn: formData.message_bn || null,
        type: formData.type,
        is_global: formData.is_global,
        link_url: formData.link_url || null,
        image_url: formData.image_url || null,
        user_id: formData.is_global ? null : null, // For global, no user_id
      };

      if (editingNotification) {
        const { error } = await supabase
          .from("notifications")
          .update(notificationData)
          .eq("id", editingNotification.id);

        if (error) throw error;
        toast.success("Notification updated!");
      } else {
        const { error } = await supabase.from("notifications").insert(notificationData);

        if (error) throw error;
        toast.success("Notification sent!");
      }

      setDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error: any) {
      console.error("Error saving notification:", error);
      toast.error(error.message || "Failed to save notification");
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      title_bn: notification.title_bn || "",
      message: notification.message,
      message_bn: notification.message_bn || "",
      type: notification.type,
      is_global: notification.is_global,
      link_url: notification.link_url || "",
      image_url: notification.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      toast.success("Notification deleted!");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const resetForm = () => {
    setEditingNotification(null);
    setFormData({
      title: "",
      title_bn: "",
      message: "",
      message_bn: "",
      type: "info",
      is_global: true,
      link_url: "",
      image_url: "",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/20 text-green-500";
      case "warning": return "bg-yellow-500/20 text-yellow-500";
      case "error": return "bg-red-500/20 text-red-500";
      case "promo": return "bg-gold/20 text-gold";
      case "order": return "bg-blue-500/20 text-blue-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Send notifications to users — real-time alerts with sound</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? "Edit Notification" : "Send New Notification"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title (English)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="New offer available!"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title_bn">Title (Bengali)</Label>
                  <Input
                    id="title_bn"
                    value={formData.title_bn}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    placeholder="নতুন অফার!"
                    className="font-bengali"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message (English)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Check out our latest products..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message_bn">Message (Bengali)</Label>
                <Textarea
                  id="message_bn"
                  value={formData.message_bn}
                  onChange={(e) => setFormData({ ...formData, message_bn: e.target.value })}
                  placeholder="আমাদের নতুন পণ্য দেখুন..."
                  rows={3}
                  className="font-bengali"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="promo">Promo</SelectItem>
                      <SelectItem value="order">Order Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_global}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_global: checked })}
                    />
                    <Label>Send to All Users</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="link_url">Link URL (Optional)</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="/shop or https://..."
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  <Send className="h-4 w-4 mr-2" />
                  {editingNotification ? "Update" : "Send"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications sent yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{notification.title}</h3>
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                    {notification.is_global ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        All Users
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        Specific User
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    {notification.link_url && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Has link
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notification)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(notification.id)}
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

export default AdminNotifications;
