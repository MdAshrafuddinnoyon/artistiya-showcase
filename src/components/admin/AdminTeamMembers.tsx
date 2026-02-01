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
import { Plus, Trash2, GripVertical, Save, Upload, Image, X, Eye, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  name_bn: string | null;
  role: string;
  role_bn: string | null;
  bio: string | null;
  bio_bn: string | null;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
}

const AdminTeamMembers = () => {
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (member: Partial<TeamMember>) => {
      if (member.id) {
        const { error } = await supabase
          .from("team_members")
          .update(member)
          .eq("id", member.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = member;
        const { error } = await supabase
          .from("team_members")
          .insert([insertData as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members-admin"] });
      setEditingMember(null);
      toast.success("Team member saved!");
    },
    onError: () => {
      toast.error("Failed to save team member");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members-admin"] });
      toast.success("Team member deleted!");
    },
  });

  const handleAdd = () => {
    setEditingMember({
      id: "",
      name: "",
      name_bn: "",
      role: "",
      role_bn: "",
      bio: "",
      bio_bn: "",
      photo_url: "",
      display_order: members.length,
      is_active: true,
      email: "",
      phone: "",
      facebook_url: "",
      linkedin_url: "",
      twitter_url: "",
    });
  };

  const handleSave = () => {
    if (!editingMember?.name || !editingMember?.role) {
      toast.error("Name and role are required");
      return;
    }
    const { id, ...data } = editingMember;
    saveMutation.mutate(id ? editingMember : data);
  };

  const handleImageUpload = async (file: File) => {
    if (!editingMember) return;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `team-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      setEditingMember({ ...editingMember, photo_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (editingMember) {
      setEditingMember({ ...editingMember, photo_url: "" });
    }
  };

  const handleMediaSelect = (url: string) => {
    if (editingMember) {
      setEditingMember({ ...editingMember, photo_url: url });
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
          <h2 className="text-2xl font-display">Team Members</h2>
          <p className="text-muted-foreground">Manage team members for the About page</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Member
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
        title="Select Team Member Photo"
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

      {editingMember && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMember.id ? "Edit" : "Add"} Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <Label>Profile Photo</Label>
                <div className="relative">
                  {editingMember.photo_url ? (
                    <div className="relative group">
                      <img
                        src={editingMember.photo_url}
                        alt="Profile"
                        className="w-full aspect-square object-cover rounded-lg border border-border"
                      />
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setPreviewImage(editingMember.photo_url)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setMediaPickerOpen(true)}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
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
                          <p className="text-sm text-muted-foreground">Click to add photo</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Library
                  </Button>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Switch
                    checked={editingMember.is_active}
                    onCheckedChange={(checked) => setEditingMember({ ...editingMember, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="bn">বাংলা</TabsTrigger>
                    <TabsTrigger value="contact">Contact & Social</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name (English)</Label>
                        <Input
                          value={editingMember.name}
                          onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Role (English)</Label>
                        <Input
                          value={editingMember.role}
                          onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                          placeholder="Founder & CEO"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Bio (English)</Label>
                      <Textarea
                        value={editingMember.bio || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                        placeholder="A brief description about this team member..."
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="bn" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>নাম (বাংলা)</Label>
                        <Input
                          value={editingMember.name_bn || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, name_bn: e.target.value })}
                          placeholder="জন ডো"
                          className="font-bengali"
                        />
                      </div>
                      <div>
                        <Label>পদবি (বাংলা)</Label>
                        <Input
                          value={editingMember.role_bn || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, role_bn: e.target.value })}
                          placeholder="প্রতিষ্ঠাতা ও সিইও"
                          className="font-bengali"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>বায়ো (বাংলা)</Label>
                      <Textarea
                        value={editingMember.bio_bn || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, bio_bn: e.target.value })}
                        placeholder="সংক্ষিপ্ত বিবরণ..."
                        rows={4}
                        className="font-bengali"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editingMember.email || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={editingMember.phone || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                          placeholder="+880 1XXX-XXXXXX"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Facebook URL</Label>
                        <Input
                          value={editingMember.facebook_url || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, facebook_url: e.target.value })}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div>
                        <Label>LinkedIn URL</Label>
                        <Input
                          value={editingMember.linkedin_url || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <Label>Twitter URL</Label>
                        <Input
                          value={editingMember.twitter_url || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, twitter_url: e.target.value })}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                    <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Member"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className={!member.is_active ? "opacity-50" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gold/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/30">
                  <span className="text-xl font-display text-gold">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gold">{member.role}</p>
                {member.email && (
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingMember(member)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No team members yet. Click "Add Member" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeamMembers;
