import { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  href: string;
  parent_id: string | null;
  menu_type: string;
  is_mega_menu: boolean;
  banner_title: string | null;
  banner_subtitle: string | null;
  banner_link: string | null;
  banner_image_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface MenuSubItem {
  id: string;
  menu_item_id: string;
  name: string;
  href: string;
  image_url: string | null;
  items: string[] | null;
  display_order: number;
  is_active: boolean;
}

interface FooterLinkGroup {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
  links?: FooterLink[];
}

interface FooterLink {
  id: string;
  group_id: string;
  name: string;
  href: string;
  display_order: number;
  is_active: boolean;
}

const AdminMenuManager = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [subItems, setSubItems] = useState<MenuSubItem[]>([]);
  const [footerGroups, setFooterGroups] = useState<FooterLinkGroup[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [menuRes, subRes, groupRes, linksRes] = await Promise.all([
        supabase.from("menu_items").select("*").order("display_order"),
        supabase.from("menu_sub_items").select("*").order("display_order"),
        supabase.from("footer_link_groups").select("*").order("display_order"),
        supabase.from("footer_links").select("*").order("display_order"),
      ]);

      if (menuRes.error) throw menuRes.error;
      if (subRes.error) throw subRes.error;
      if (groupRes.error) throw groupRes.error;
      if (linksRes.error) throw linksRes.error;

      setMenuItems(menuRes.data || []);
      setSubItems(subRes.data || []);
      setFooterGroups(groupRes.data || []);
      setFooterLinks(linksRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch menu data");
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async () => {
    try {
      const { error } = await supabase.from("menu_items").insert({
        name: "New Menu Item",
        href: "/",
        menu_type: "header",
        display_order: menuItems.length,
      });

      if (error) throw error;
      toast.success("Menu item added");
      fetchAllData();
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast.error("Failed to add menu item");
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm("Delete this menu item and all its sub-items?")) return;
    
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Menu item deleted");
      fetchAllData();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
    }
  };

  const addSubItem = async (menuItemId: string) => {
    try {
      const { error } = await supabase.from("menu_sub_items").insert({
        menu_item_id: menuItemId,
        name: "New Category",
        href: "/shop",
        display_order: subItems.filter(s => s.menu_item_id === menuItemId).length,
      });

      if (error) throw error;
      toast.success("Sub-item added");
      fetchAllData();
    } catch (error) {
      console.error("Error adding sub-item:", error);
      toast.error("Failed to add sub-item");
    }
  };

  const deleteSubItem = async (id: string) => {
    try {
      const { error } = await supabase.from("menu_sub_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Sub-item deleted");
      fetchAllData();
    } catch (error) {
      console.error("Error deleting sub-item:", error);
      toast.error("Failed to delete sub-item");
    }
  };

  const addFooterGroup = async () => {
    try {
      const { error } = await supabase.from("footer_link_groups").insert({
        title: "New Group",
        display_order: footerGroups.length,
      });

      if (error) throw error;
      toast.success("Footer group added");
      fetchAllData();
    } catch (error) {
      console.error("Error adding footer group:", error);
      toast.error("Failed to add footer group");
    }
  };

  const addFooterLink = async (groupId: string) => {
    try {
      const { error } = await supabase.from("footer_links").insert({
        group_id: groupId,
        name: "New Link",
        href: "/",
        display_order: footerLinks.filter(l => l.group_id === groupId).length,
      });

      if (error) throw error;
      toast.success("Footer link added");
      fetchAllData();
    } catch (error) {
      console.error("Error adding footer link:", error);
      toast.error("Failed to add footer link");
    }
  };

  const updateMenuItem = (id: string, field: keyof MenuItem, value: any) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateSubItem = (id: string, field: keyof MenuSubItem, value: any) => {
    setSubItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateFooterGroup = (id: string, field: keyof FooterLinkGroup, value: any) => {
    setFooterGroups(prev => prev.map(group => 
      group.id === id ? { ...group, [field]: value } : group
    ));
  };

  const updateFooterLink = (id: string, field: keyof FooterLink, value: any) => {
    setFooterLinks(prev => prev.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save menu items
      for (const item of menuItems) {
        await supabase.from("menu_items").update(item).eq("id", item.id);
      }
      
      // Save sub items
      for (const item of subItems) {
        await supabase.from("menu_sub_items").update(item).eq("id", item.id);
      }
      
      // Save footer groups
      for (const group of footerGroups) {
        await supabase.from("footer_link_groups").update(group).eq("id", group.id);
      }
      
      // Save footer links
      for (const link of footerLinks) {
        await supabase.from("footer_links").update(link).eq("id", link.id);
      }

      toast.success("All changes saved");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Menu Management</h2>
        <Button variant="gold" onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <Tabs defaultValue="header">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="header">Header Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer Links</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-6 mt-6">
          <Button variant="outline" onClick={addMenuItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>

          <div className="space-y-4">
            {menuItems.filter(m => m.menu_type === "header").map((item) => (
              <Collapsible 
                key={item.id} 
                open={expandedItems.includes(item.id)}
                onOpenChange={() => toggleExpand(item.id)}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <Input
                          value={item.name}
                          onChange={(e) => updateMenuItem(item.id, "name", e.target.value)}
                          className="w-40"
                        />
                        <Input
                          value={item.href}
                          onChange={(e) => updateMenuItem(item.id, "href", e.target.value)}
                          className="w-32"
                          placeholder="/path"
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(checked) => updateMenuItem(item.id, "is_active", checked)}
                          />
                          {item.is_active ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-4">
                          <Label className="text-sm">Mega Menu</Label>
                          <Switch
                            checked={item.is_mega_menu}
                            onCheckedChange={(checked) => updateMenuItem(item.id, "is_mega_menu", checked)}
                          />
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedItems.includes(item.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteMenuItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t border-border">
                      {item.is_mega_menu && (
                        <div className="space-y-4 mt-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Categories</Label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addSubItem(item.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Category
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subItems
                              .filter(s => s.menu_item_id === item.id)
                              .map((subItem) => (
                                <div key={subItem.id} className="p-4 bg-muted rounded-lg space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Input
                                      value={subItem.name}
                                      onChange={(e) => updateSubItem(subItem.id, "name", e.target.value)}
                                      className="w-full"
                                      placeholder="Category Name"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive ml-2"
                                      onClick={() => deleteSubItem(subItem.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={subItem.href}
                                    onChange={(e) => updateSubItem(subItem.id, "href", e.target.value)}
                                    placeholder="/category-link"
                                  />
                                  <Input
                                    value={subItem.items?.join(", ") || ""}
                                    onChange={(e) => updateSubItem(subItem.id, "items", e.target.value.split(", "))}
                                    placeholder="Sub-items (comma separated)"
                                  />
                                </div>
                              ))}
                          </div>

                          {/* Banner Settings */}
                          <div className="border-t border-border pt-4 mt-4">
                            <Label className="text-sm font-medium mb-4 block">Mega Menu Banner</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Banner Title</Label>
                                <Input
                                  value={item.banner_title || ""}
                                  onChange={(e) => updateMenuItem(item.id, "banner_title", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Banner Subtitle</Label>
                                <Input
                                  value={item.banner_subtitle || ""}
                                  onChange={(e) => updateMenuItem(item.id, "banner_subtitle", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Banner Link</Label>
                                <Input
                                  value={item.banner_link || ""}
                                  onChange={(e) => updateMenuItem(item.id, "banner_link", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Banner Image URL</Label>
                                <Input
                                  value={item.banner_image_url || ""}
                                  onChange={(e) => updateMenuItem(item.id, "banner_image_url", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6 mt-6">
          <Button variant="outline" onClick={addFooterGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link Group
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {footerGroups.map((group) => (
              <Card key={group.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={group.title}
                      onChange={(e) => updateFooterGroup(group.id, "title", e.target.value)}
                      className="font-medium"
                    />
                    <Switch
                      checked={group.is_active}
                      onCheckedChange={(checked) => updateFooterGroup(group.id, "is_active", checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {footerLinks
                    .filter(l => l.group_id === group.id)
                    .map((link) => (
                      <div key={link.id} className="flex items-center gap-2">
                        <Input
                          value={link.name}
                          onChange={(e) => updateFooterLink(link.id, "name", e.target.value)}
                          className="flex-1"
                          placeholder="Link Name"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => updateFooterLink(link.id, "href", e.target.value)}
                          className="flex-1"
                          placeholder="/path"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={async () => {
                            await supabase.from("footer_links").delete().eq("id", link.id);
                            fetchAllData();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => addFooterLink(group.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMenuManager;
