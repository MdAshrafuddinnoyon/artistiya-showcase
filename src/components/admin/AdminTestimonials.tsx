import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Star, Eye, EyeOff, ShoppingBag, Globe, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  google: "bg-blue-500/20 text-blue-500",
  facebook: "bg-indigo-500/20 text-indigo-500",
  instagram: "bg-pink-500/20 text-pink-500",
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState("");

  useEffect(() => {
    fetchTestimonials();
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
        <Button variant="gold" onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="google" className="gap-1">
              <Globe className="h-3 w-3" /> Google
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-1">
              <Facebook className="h-3 w-3" /> Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-1">
              <Instagram className="h-3 w-3" /> Instagram
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select onValueChange={(platform) => addTestimonial(platform)}>
              <SelectTrigger className="w-[180px]">
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs">Google Place ID</Label>
                <Input
                  value={googlePlaceId}
                  onChange={(e) => setGooglePlaceId(e.target.value)}
                  placeholder="Enter your Google Place ID"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Place ID at{" "}
                  <a 
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Google Place ID Finder
                  </a>
                </p>
              </div>
              <div className="flex items-end">
                <Button variant="outline" disabled className="gap-2">
                  <Globe className="h-4 w-4" />
                  Sync Reviews (Coming Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {["all", "google", "facebook", "instagram", "manual"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {testimonials
              .filter((t) => tabValue === "all" || t.platform === tabValue)
              .map((testimonial, index) => (
                <Card key={testimonial.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
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
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <Card className="p-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
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
