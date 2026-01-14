import { useState, useEffect } from "react";
import { Save, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_content: string;
  is_active: boolean;
}

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("order_confirmation");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplate = (key: string) => {
    return templates.find((t) => t.template_key === key);
  };

  const updateTemplateField = (key: string, field: string, value: any) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.template_key === key ? { ...t, [field]: value } : t
      )
    );
  };

  const saveTemplate = async (key: string) => {
    setSaving(true);
    try {
      const template = getTemplate(key);
      if (!template) return;

      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: template.subject,
          html_content: template.html_content,
          is_active: template.is_active,
        })
        .eq("template_key", key);

      if (error) throw error;
      toast.success("Template saved successfully");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = (key: string) => {
    const template = getTemplate(key);
    if (!template) return "";
    
    return template.html_content
      .replace(/\{\{customer_name\}\}/g, "John Doe")
      .replace(/\{\{order_number\}\}/g, "ART-20260114-1234")
      .replace(/\{\{total\}\}/g, "5,500")
      .replace(/\{\{order_details\}\}/g, `
        <p><strong>Items:</strong></p>
        <p>1x Handcrafted Necklace - ৳2,500</p>
        <p>1x Painted Tote Bag - ৳3,000</p>
      `)
      .replace(/\{\{tracking_url\}\}/g, "#")
      .replace(/\{\{review_url\}\}/g, "#");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const templateLabels: Record<string, string> = {
    order_confirmation: "Order Confirmation",
    order_shipped: "Order Shipped",
    order_delivered: "Order Delivered",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize email notifications sent to customers
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-2">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {["{{customer_name}}", "{{order_number}}", "{{total}}", "{{order_details}}", "{{tracking_url}}", "{{review_url}}"].map((variable) => (
            <code
              key={variable}
              className="px-2 py-1 bg-muted rounded text-sm text-gold"
            >
              {variable}
            </code>
          ))}
        </div>
      </div>

      <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          {templates.map((template) => (
            <TabsTrigger key={template.template_key} value={template.template_key}>
              {templateLabels[template.template_key] || template.template_key}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map((template) => (
          <TabsContent key={template.template_key} value={template.template_key} className="space-y-6 mt-6">
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Mail className={`h-5 w-5 ${template.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-foreground font-medium">
                  {templateLabels[template.template_key]}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setPreviewHtml(getPreviewHtml(template.template_key))}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Email Preview</DialogTitle>
                    </DialogHeader>
                    <div 
                      className="border rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </DialogContent>
                </Dialog>
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => updateTemplateField(template.template_key, "is_active", checked)}
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={template.subject}
                  onChange={(e) => updateTemplateField(template.template_key, "subject", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>HTML Content</Label>
                <Textarea
                  value={template.html_content}
                  onChange={(e) => updateTemplateField(template.template_key, "html_content", e.target.value)}
                  className="mt-1.5 font-mono text-sm"
                  rows={20}
                />
              </div>

              <Button
                variant="gold"
                onClick={() => saveTemplate(template.template_key)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminEmailTemplates;
