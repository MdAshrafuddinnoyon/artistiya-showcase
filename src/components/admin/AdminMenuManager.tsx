import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Upload, Library, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";

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
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{ type: string; id: string; field: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadTarget, setCurrentUploadTarget] = useState<{ type: string; id: string; field: string } | null>(null);

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

  const handleImageUpload = async (file: File, type: string, id: string, field: string) => {
    setUploading(`${type}-${id}-${field}`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `menu-${type}-${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      if (type === "menu") {
        updateMenuItem(id, field as keyof MenuItem, publicUrl);
      } else if (type === "sub") {
        updateSubItem(id, field as keyof MenuSubItem, publicUrl);
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  const openMediaPicker = (type: string, id: string, field: string) => {
    setMediaPickerTarget({ type, id, field });
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaPickerTarget) {
      if (mediaPickerTarget.type === "menu") {
        updateMenuItem(mediaPickerTarget.id, mediaPickerTarget.field as keyof MenuItem, url);
      } else if (mediaPickerTarget.type === "sub") {
        updateSubItem(mediaPickerTarget.id, mediaPickerTarget.field as keyof MenuSubItem, url);
      }
    }
    setMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  const triggerFileUpload = (type: string, id: string, field: string) => {
    setCurrentUploadTarget({ type, id, field });
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadTarget) {
      handleImageUpload(file, currentUploadTarget.type, currentUploadTarget.id, currentUploadTarget.field);
    }
    e.target.value = "";
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
      for (const item of menuItems) {
        await supabase.from("menu_items").update(item).eq("id", item.id);
      }
      
      for (const item of subItems) {
        await supabase.from("menu_sub_items").update(item).eq("id", item.id);
      }
      
      for (const group of footerGroups) {
        await supabase.from("footer_link_groups").update(group).eq("id", group.id);
      }
      
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

  // Image Upload Zone Component
  const ImageUploadZone = ({ 
    type, 
    id, 
    field, 
    currentUrl, 
    label,
    aspectRatio = "video"
  }: { 
    type: string;
    id: string;
    field: string;
    currentUrl?: string | null;
    label: string;
    aspectRatio?: "video" | "square";
  }) => {
    const isUploading = uploading === `${type}-${id}-${field}`;
    const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";
    
    return (
      <div className="space-y-2">
        <Label className="text-xs">{label}</Label>
        {currentUrl ? (
          <div className="relative group">
            <div className={`${aspectClass} rounded-lg overflow-hidden border border-border bg-muted`}>
              <img 
                src={currentUrl} 
                alt={label} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
              <Button size="sm" variant="outline" onClick={() => triggerFileUpload(type, id, field)}>
                <Upload className="h-3 w-3 mr-1" /> Upload
              </Button>
              <Button size="sm" variant="outline" onClick={() => openMediaPicker(type, id, field)}>
                <Library className="h-3 w-3 mr-1" /> Library
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-destructive"
                onClick={() => {
                  if (type === "menu") updateMenuItem(id, field as keyof MenuItem, "");
                  else if (type === "sub") updateSubItem(id, field as keyof MenuSubItem, "");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className={`${aspectClass} rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center`}>
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => triggerFileUpload(type, id, field)}>
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openMediaPicker(type, id, field)}>
                    <Library className="h-3 w-3 mr-1" /> Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Image"
      />

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
                                  
                                  {/* Category Image */}
                                  <ImageUploadZone
                                    type="sub"
                                    id={subItem.id}
                                    field="image_url"
                                    currentUrl={subItem.image_url}
                                    label="Category Icon/Image"
                                    aspectRatio="square"
                                  />
                                </div>
                              ))}
                          </div>

                          {/* Banner Settings */}
                          <div className="border-t border-border pt-4 mt-4">
                            <Label className="text-sm font-medium mb-4 block">Mega Menu Banner</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-4">
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
                                    placeholder="/collections/new"
                                  />
                                </div>
                              </div>
                              <div>
                                <ImageUploadZone
                                  type="menu"
                                  id={item.id}
                                  field="banner_image_url"
                                  currentUrl={item.banner_image_url}
                                  label="Banner Image"
                                  aspectRatio="video"
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
