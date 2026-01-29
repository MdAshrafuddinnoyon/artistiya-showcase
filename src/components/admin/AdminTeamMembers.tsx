import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

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
}

const AdminTeamMembers = () => {
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

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

      {editingMember && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMember.id ? "Edit" : "Add"} Team Member</CardTitle>
          </CardHeader>
          <CardContent>
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
                    placeholder="A brief description..."
                    rows={3}
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
                    rows={3}
                    className="font-bengali"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-4">
              <div>
                <Label>Photo URL</Label>
                <Input
                  value={editingMember.photo_url || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMember.is_active}
                  onCheckedChange={(checked) => setEditingMember({ ...editingMember, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => setEditingMember(null)}>
                  Cancel
                </Button>
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
              {member.photo_url && (
                <img
                  src={member.photo_url}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
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
