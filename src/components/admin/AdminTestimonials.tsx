import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Star, Eye, EyeOff, ShoppingBag, Globe, Facebook, Instagram, MessageCircle, RefreshCw, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  location: string | null;
  rating: number;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  customer_photo_url: string | null;
  source: string;
  platform: string;
  google_review_id: string | null;
  google_place_id: string | null;
  review_date: string | null;
  verified_purchase: boolean;
  product_id: string | null;
}

const platformIcons: Record<string, any> = {
  manual: MessageCircle,
  google: Globe,
  facebook: Facebook,
  instagram: Instagram,
};

const platformColors: Record<string, string> = {
  manual: "bg-muted text-muted-foreground",
  google: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  facebook: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  instagram: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleSettings, setGoogleSettings] = useState({
    google_place_id: "",
    google_api_key: "",
    auto_sync_google_reviews: false,
    hide_manual_reviews_when_api_active: false,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTestimonials();
    fetchGoogleSettings();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setTestimonials((data || []).map(t => ({
        ...t,
        platform: t.platform || t.source || 'manual',
        google_place_id: t.google_place_id || null,
        review_date: t.review_date || null,
      })));
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async (platform: string = "manual") => {
    try {
      const { error } = await supabase.from("testimonials").insert({
        name: "New Customer",
        text: "Add your review text here...",
        location: "Dhaka",
        rating: 5,
        display_order: testimonials.length,
        source: platform,
        platform: platform,
      });

      if (error) throw error;
      toast.success("Testimonial added");
      fetchTestimonials();
    } catch (error) {
      console.error("Error adding testimonial:", error);
      toast.error("Failed to add testimonial");
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;

    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const updateField = (id: string, field: keyof Testimonial, value: any) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const testimonial of testimonials) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            name: testimonial.name,
            text: testimonial.text,
            location: testimonial.location,
            rating: testimonial.rating,
            is_active: testimonial.is_active,
            display_order: testimonial.display_order,
            image_url: testimonial.image_url,
            customer_photo_url: testimonial.customer_photo_url,
            source: testimonial.platform,
            platform: testimonial.platform,
            verified_purchase: testimonial.verified_purchase,
            google_place_id: testimonial.google_place_id,
            review_date: testimonial.review_date,
          })
          .eq("id", testimonial.id);

        if (error) throw error;
      }
      toast.success("All testimonials saved");
    } catch (error) {
      console.error("Error saving testimonials:", error);
      toast.error("Failed to save testimonials");
    } finally {
      setSaving(false);
    }
  };

  const fetchGoogleSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_branding")
        .select("google_place_id, google_api_key, auto_sync_google_reviews, hide_manual_reviews_when_api_active")
        .single();

      if (!error && data) {
        setGoogleSettings({
          google_place_id: data.google_place_id || "",
          google_api_key: data.google_api_key || "",
          auto_sync_google_reviews: data.auto_sync_google_reviews || false,
          hide_manual_reviews_when_api_active: data.hide_manual_reviews_when_api_active || false,
        });
      }
    } catch (error) {
      console.error("Error fetching Google settings:", error);
    }
  };

  const saveGoogleSettings = async () => {
    try {
      const { error } = await supabase
        .from("site_branding")
        .update({
          google_place_id: googleSettings.google_place_id,
          google_api_key: googleSettings.google_api_key,
          auto_sync_google_reviews: googleSettings.auto_sync_google_reviews,
          hide_manual_reviews_when_api_active: googleSettings.hide_manual_reviews_when_api_active,
        })
        .neq("id", "");

      if (error) throw error;
      toast.success("Google settings saved!");
    } catch (error) {
      console.error("Error saving Google settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const syncGoogleReviews = async () => {
    if (!googleSettings.google_place_id || !googleSettings.google_api_key) {
      toast.error("Please enter both Place ID and API Key");
      return;
    }

    // Save settings first
    await saveGoogleSettings();
    
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-google-reviews");

      if (error) throw error;

      if (data?.success) {
        toast.success(`Synced ${data.synced_reviews} reviews from ${data.place_name}`);
        fetchTestimonials();
      } else {
        toast.error(data?.error || "Failed to sync reviews");
      }
    } catch (error) {
      console.error("Error syncing Google reviews:", error);
      toast.error("Failed to sync Google reviews");
    } finally {
      setSyncing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const Icon = platformIcons[platform] || MessageCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              Customer Testimonials
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage customer reviews from various platforms
            </p>
          </div>
          <Button variant="gold" onClick={saveAll} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        {/* Responsive Tab Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted inline-flex w-max sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="google" className="gap-1 text-xs sm:text-sm">
                <Globe className="h-3 w-3" /> Google
              </TabsTrigger>
              <TabsTrigger value="facebook" className="gap-1 text-xs sm:text-sm">
                <Facebook className="h-3 w-3" /> Facebook
              </TabsTrigger>
              <TabsTrigger value="instagram" className="gap-1 text-xs sm:text-sm">
                <Instagram className="h-3 w-3" /> Instagram
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1 text-xs sm:text-sm">
                <MessageCircle className="h-3 w-3" /> Manual
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full sm:w-auto">
            <Select onValueChange={(platform) => addTestimonial(platform)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Plus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Add Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Manual Entry
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> From Google
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" /> From Facebook
                  </div>
                </SelectItem>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> From Instagram
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Google Business Integration Card */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Google Business Integration
            </CardTitle>
            <CardDescription className="text-xs">
              Connect your Google Business account to sync reviews automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Google Place ID
                </Label>
                <Input
                  value={googleSettings.google_place_id}
                  onChange={(e) => setGoogleSettings({ ...googleSettings, google_place_id: e.target.value })}
                  placeholder="Enter your Google Place ID"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find at{" "}
                  <a 
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Place ID Finder
                  </a>
                </p>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Key className="h-3 w-3" /> Google Places API Key
                </Label>
                <Input
                  value={googleSettings.google_api_key}
                  onChange={(e) => setGoogleSettings({ ...googleSettings, google_api_key: e.target.value })}
                  placeholder="Enter your API Key"
                  type="password"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get from{" "}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>
            </div>

            {/* Toggle options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm">Auto-sync Reviews</Label>
                  <p className="text-xs text-muted-foreground">Automatically fetch new reviews</p>
                </div>
                <Switch
                  checked={googleSettings.auto_sync_google_reviews}
                  onCheckedChange={(checked) => setGoogleSettings({ ...googleSettings, auto_sync_google_reviews: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm">Hide Manual Reviews</Label>
                  <p className="text-xs text-muted-foreground">When Google API is active</p>
                </div>
                <Switch
                  checked={googleSettings.hide_manual_reviews_when_api_active}
                  onCheckedChange={(checked) => setGoogleSettings({ ...googleSettings, hide_manual_reviews_when_api_active: checked })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={syncGoogleReviews}
                disabled={syncing || !googleSettings.google_place_id || !googleSettings.google_api_key}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? "Syncing..." : "Sync Google Reviews"}
              </Button>
              <Button variant="gold" onClick={saveGoogleSettings}>
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {["all", "google", "facebook", "instagram", "manual"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {testimonials
              .filter((t) => tabValue === "all" || t.platform === tabValue)
              .map((testimonial, index) => (
                <Card key={testimonial.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-4 lg:hidden">
                      {/* Top Row: Photo + Actions */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <ImageUploadZone
                            value={testimonial.customer_photo_url}
                            onChange={(url) => updateField(testimonial.id, "customer_photo_url", url)}
                            onRemove={() => updateField(testimonial.id, "customer_photo_url", "")}
                            aspectRatio="square"
                            bucket="testimonials"
                            folder="customers"
                            showUrlInput={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input
                            value={testimonial.name}
                            onChange={(e) => updateField(testimonial.id, "name", e.target.value)}
                            className="font-medium"
                            placeholder="Customer name"
                          />
                          <Input
                            value={testimonial.location || ""}
                            onChange={(e) => updateField(testimonial.id, "location", e.target.value)}
                            className="mt-2 text-sm"
                            placeholder="Location"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={testimonial.is_active}
                              onCheckedChange={(checked) => updateField(testimonial.id, "is_active", checked)}
                            />
                            {testimonial.is_active ? (
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => deleteTestimonial(testimonial.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Rating & Platform Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Rating</Label>
                          <Select
                            value={String(testimonial.rating)}
                            onValueChange={(v) => updateField(testimonial.id, "rating", parseInt(v))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((r) => (
                                <SelectItem key={r} value={String(r)}>
                                  {"⭐".repeat(r)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Platform</Label>
                          <Select
                            value={testimonial.platform}
                            onValueChange={(v) => updateField(testimonial.id, "platform", v)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="google">Google</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <Label className="text-xs">Review</Label>
                        <Textarea
                          value={testimonial.text}
                          onChange={(e) => updateField(testimonial.id, "text", e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={testimonial.verified_purchase}
                            onCheckedChange={(checked) => updateField(testimonial.id, "verified_purchase", checked)}
                            className="scale-90"
                          />
                          <span className="text-xs text-muted-foreground">Verified</span>
                        </div>
                        {testimonial.verified_purchase && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <ShoppingBag className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        <Badge className={`gap-1 text-xs ${platformColors[testimonial.platform] || platformColors.manual}`}>
                          {getPlatformIcon(testimonial.platform)}
                          {testimonial.platform.charAt(0).toUpperCase() + testimonial.platform.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex gap-6">
                      {/* Photo Upload */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <ImageUploadZone
                          value={testimonial.customer_photo_url}
                          onChange={(url) => updateField(testimonial.id, "customer_photo_url", url)}
                          onRemove={() => updateField(testimonial.id, "customer_photo_url", "")}
                          aspectRatio="square"
                          bucket="testimonials"
                          folder="customers"
                          showUrlInput={false}
                        />
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs">Customer Name</Label>
                              <Input
                                value={testimonial.name}
                                onChange={(e) => updateField(testimonial.id, "name", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Location</Label>
                              <Input
                                value={testimonial.location || ""}
                                onChange={(e) => updateField(testimonial.id, "location", e.target.value)}
                                className="mt-1"
                                placeholder="e.g., Dhaka"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Rating</Label>
                              <Select
                                value={String(testimonial.rating)}
                                onValueChange={(v) => updateField(testimonial.id, "rating", parseInt(v))}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[5, 4, 3, 2, 1].map((r) => (
                                    <SelectItem key={r} value={String(r)}>
                                      {"⭐".repeat(r)} {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Platform</Label>
                              <Select
                                value={testimonial.platform}
                                onValueChange={(v) => updateField(testimonial.id, "platform", v)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual</SelectItem>
                                  <SelectItem value="google">Google</SelectItem>
                                  <SelectItem value="facebook">Facebook</SelectItem>
                                  <SelectItem value="instagram">Instagram</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={testimonial.is_active}
                                onCheckedChange={(checked) => updateField(testimonial.id, "is_active", checked)}
                              />
                              {testimonial.is_active ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteTestimonial(testimonial.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Review Text</Label>
                          <Textarea
                            value={testimonial.text}
                            onChange={(e) => updateField(testimonial.id, "text", e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={testimonial.verified_purchase}
                              onCheckedChange={(checked) => updateField(testimonial.id, "verified_purchase", checked)}
                            />
                            <span className="text-sm text-muted-foreground">Verified Purchase</span>
                          </div>

                          {testimonial.verified_purchase && (
                            <Badge variant="secondary" className="gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}

                          <Badge className={`gap-1 ml-auto ${platformColors[testimonial.platform] || platformColors.manual}`}>
                            {getPlatformIcon(testimonial.platform)}
                            {testimonial.platform.charAt(0).toUpperCase() + testimonial.platform.slice(1)}
                          </Badge>

                          <Badge variant="outline">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {testimonials.filter((t) => tabValue === "all" || t.platform === tabValue).length === 0 && (
              <Card className="p-8 sm:p-12 text-center">
                <Star className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  {tabValue === "all" ? "No testimonials yet" : `No ${tabValue} reviews yet`}
                </p>
                <Button variant="gold" onClick={() => addTestimonial(tabValue === "all" ? "manual" : tabValue)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {tabValue === "all" ? "First" : tabValue.charAt(0).toUpperCase() + tabValue.slice(1)} Testimonial
                </Button>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTestimonials;
