import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

interface Certification {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  file_url: string;
  file_type: string;
  display_order: number;
  is_active: boolean;
}

const AdminCertifications = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error("Error fetching certifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCertification = async () => {
    try {
      const { error } = await supabase.from("certifications").insert({
        title: "New Certification",
        file_url: "https://placehold.co/400x300/1a1a1a/d4af37?text=Upload+File",
        display_order: certifications.length,
      });

      if (error) throw error;
      toast.success("Certification added");
      fetchCertifications();
    } catch (error) {
      console.error("Error adding certification:", error);
      toast.error("Failed to add certification");
    }
  };

  const deleteCertification = async (id: string) => {
    if (!confirm("Delete this certification?")) return;

    try {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
      toast.success("Certification deleted");
      fetchCertifications();
    } catch (error) {
      console.error("Error deleting certification:", error);
      toast.error("Failed to delete certification");
    }
  };

  const updateField = (id: string, field: keyof Certification, value: any) => {
    setCertifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const cert of certifications) {
        const { error } = await supabase
          .from("certifications")
          .update({
            title: cert.title,
            title_bn: cert.title_bn,
            description: cert.description,
            description_bn: cert.description_bn,
            file_url: cert.file_url,
            file_type: cert.file_type,
            display_order: cert.display_order,
            is_active: cert.is_active,
          })
          .eq("id", cert.id);

        if (error) throw error;
      }
      toast.success("All certifications saved");
    } catch (error) {
      console.error("Error saving certifications:", error);
      toast.error("Failed to save certifications");
    } finally {
      setSaving(false);
    }
  };

  const isPdf = (url: string) => url?.toLowerCase().endsWith(".pdf");

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
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
            <FileText className="h-5 w-5 text-gold" />
            Certifications & Authorizations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload certificates, licenses, and authorization documents
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={addCertification} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {certifications.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No certifications yet</p>
          <Button variant="gold" onClick={addCertification}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Certification
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert, index) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="p-4">
                {isPdf(cert.file_url) ? (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-4">
                    <FileText className="h-16 w-16 text-gold mb-2" />
                    <span className="text-sm text-muted-foreground">PDF Document</span>
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-gold hover:underline flex items-center gap-1 text-sm"
                    >
                      View PDF <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <ImageUploadZone
                    value={cert.file_url}
                    onChange={(url) => updateField(cert.id, "file_url", url)}
                    onRemove={() => updateField(cert.id, "file_url", "")}
                    aspectRatio="video"
                    bucket="media"
                    folder="certifications"
                    showUrlInput={false}
                  />
                )}
              </div>

              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {cert.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cert.is_active}
                      onCheckedChange={(checked) => updateField(cert.id, "is_active", checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteCertification(cert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">File Type</Label>
                  <Select
                    value={cert.file_type}
                    onValueChange={(v) => updateField(cert.id, "file_type", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Title (English)</Label>
                    <Input
                      value={cert.title}
                      onChange={(e) => updateField(cert.id, "title", e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Title (বাংলা)</Label>
                    <Input
                      value={cert.title_bn || ""}
                      onChange={(e) => updateField(cert.id, "title_bn", e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Description (English)</Label>
                  <Textarea
                    value={cert.description || ""}
                    onChange={(e) => updateField(cert.id, "description", e.target.value)}
                    className="mt-1 text-sm"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCertifications;
