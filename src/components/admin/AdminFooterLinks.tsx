import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FooterLinkGroup {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FooterLink {
  id: string;
  group_id: string;
  name: string;
  href: string;
  display_order: number;
  is_active: boolean;
}

const AdminFooterLinks = () => {
  const [groups, setGroups] = useState<FooterLinkGroup[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("groups");
  
  // Group form
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FooterLinkGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ title: "", is_active: true });

  // Link form
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [linkForm, setLinkForm] = useState({ 
    name: "", 
    href: "", 
    group_id: "", 
    is_active: true 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, linksRes] = await Promise.all([
        supabase.from("footer_link_groups").select("*").order("display_order"),
        supabase.from("footer_links").select("*").order("display_order"),
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (linksRes.data) setLinks(linksRes.data);
    } catch (error) {
      console.error("Error fetching footer data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group handlers
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("footer_link_groups")
          .update({ title: groupForm.title, is_active: groupForm.is_active })
          .eq("id", editingGroup.id);
        if (error) throw error;
        toast.success("Group updated!");
      } else {
        const { error } = await supabase.from("footer_link_groups").insert({
          title: groupForm.title,
          is_active: groupForm.is_active,
          display_order: groups.length,
        });
        if (error) throw error;
        toast.success("Group created!");
      }
      setGroupDialogOpen(false);
      resetGroupForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save group");
    }
  };

  const handleGroupDelete = async (id: string) => {
    if (!confirm("Delete this group and all its links?")) return;
    try {
      await supabase.from("footer_links").delete().eq("group_id", id);
      await supabase.from("footer_link_groups").delete().eq("id", id);
      toast.success("Group deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupForm({ title: "", is_active: true });
  };

  // Link handlers
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        const { error } = await supabase
          .from("footer_links")
          .update({ 
            name: linkForm.name, 
            href: linkForm.href,
            group_id: linkForm.group_id,
            is_active: linkForm.is_active 
          })
          .eq("id", editingLink.id);
        if (error) throw error;
        toast.success("Link updated!");
      } else {
        const groupLinks = links.filter(l => l.group_id === linkForm.group_id);
        const { error } = await supabase.from("footer_links").insert({
          name: linkForm.name,
          href: linkForm.href,
          group_id: linkForm.group_id,
          is_active: linkForm.is_active,
          display_order: groupLinks.length,
        });
        if (error) throw error;
        toast.success("Link created!");
      }
      setLinkDialogOpen(false);
      resetLinkForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save link");
    }
  };

  const handleLinkDelete = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    try {
      await supabase.from("footer_links").delete().eq("id", id);
      toast.success("Link deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const resetLinkForm = () => {
    setEditingLink(null);
    setLinkForm({ name: "", href: "", group_id: groups[0]?.id || "", is_active: true });
  };

  const getGroupLinks = (groupId: string) => links.filter(l => l.group_id === groupId);

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Footer Links</h2>
          <p className="text-sm text-muted-foreground">Manage footer navigation</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Link Groups</TabsTrigger>
          <TabsTrigger value="links">All Links</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={resetGroupForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGroup ? "Edit Group" : "Add Group"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGroupSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="group_title">Group Title</Label>
                    <Input
                      id="group_title"
                      value={groupForm.title}
                      onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                      placeholder="e.g., Shop, Help, Company"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={groupForm.is_active}
                      onCheckedChange={(c) => setGroupForm({ ...groupForm, is_active: c })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="gold">
                      {editingGroup ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No link groups yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <h3 className="font-medium text-foreground">{group.title}</h3>
                      {!group.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingGroup(group);
                          setGroupForm({ title: group.title, is_active: group.is_active });
                          setGroupDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleGroupDelete(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 ml-8">
                    {getGroupLinks(group.id).map((link) => (
                      <div key={link.id} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-muted-foreground" />
                          <span className={!link.is_active ? "text-muted-foreground" : ""}>
                            {link.name}
                          </span>
                          <span className="text-xs text-muted-foreground">→ {link.href}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingLink(link);
                              setLinkForm({
                                name: link.name,
                                href: link.href,
                                group_id: link.group_id,
                                is_active: link.is_active,
                              });
                              setLinkDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleLinkDelete(link.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getGroupLinks(group.id).length === 0 && (
                      <p className="text-xs text-muted-foreground">No links in this group</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={resetLinkForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLink ? "Edit Link" : "Add Link"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLinkSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="link_name">Link Name</Label>
                    <Input
                      id="link_name"
                      value={linkForm.name}
                      onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                      placeholder="e.g., Track Order"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_href">URL</Label>
                    <Input
                      id="link_href"
                      value={linkForm.href}
                      onChange={(e) => setLinkForm({ ...linkForm, href: e.target.value })}
                      placeholder="/track or https://..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_group">Group</Label>
                    <Select
                      value={linkForm.group_id}
                      onValueChange={(v) => setLinkForm({ ...linkForm, group_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={linkForm.is_active}
                      onCheckedChange={(c) => setLinkForm({ ...linkForm, is_active: c })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="gold">
                      {editingLink ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No links yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => {
                const group = groups.find(g => g.id === link.group_id);
                return (
                  <div key={link.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{link.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">→ {link.href}</span>
                        {group && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">{group.title}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingLink(link);
                          setLinkForm({
                            name: link.name,
                            href: link.href,
                            group_id: link.group_id,
                            is_active: link.is_active,
                          });
                          setLinkDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleLinkDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFooterLinks;
