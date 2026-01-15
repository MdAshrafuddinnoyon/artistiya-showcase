import { useState, useEffect } from "react";
import { Save, Mail, Eye, Palette, Variable, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_content: string;
  is_active: boolean;
}

const defaultTemplates: Record<string, { subject: string; html: string }> = {
  order_confirmation: {
    subject: "Order Confirmed - {{order_number}} | Artistiya",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 2px;">
        <span style="color: #d4af37;">ARTISTIYA</span>
      </h1>
      <p style="color: #888; margin-top: 5px; font-size: 12px; letter-spacing: 3px;">HANDCRAFTED ELEGANCE</p>
    </div>
    
    <!-- Success Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8952a 100%); padding: 15px 30px; border-radius: 50px;">
        <span style="color: #0a0a0a; font-weight: 600; font-size: 14px; letter-spacing: 1px;">✓ ORDER CONFIRMED</span>
      </div>
    </div>

    <!-- Greeting -->
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 400;">
        Thank you, <span style="color: #d4af37;">{{customer_name}}</span>!
      </h2>
      <p style="color: #aaa; line-height: 1.6; margin: 0;">
        Your order has been received and is being processed with care. Each piece is handcrafted especially for you.
      </p>
    </div>

    <!-- Order Info -->
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a2a; padding-bottom: 15px; margin-bottom: 15px;">
        <span style="color: #888; font-size: 14px;">Order Number</span>
        <span style="color: #d4af37; font-weight: 600; font-size: 16px;">{{order_number}}</span>
      </div>
      
      <div style="color: #ccc; font-size: 14px; line-height: 1.8;">
        {{order_details}}
      </div>
      
      <div style="border-top: 1px solid #2a2a2a; margin-top: 20px; padding-top: 20px; text-align: right;">
        <span style="font-size: 20px; color: #d4af37; font-weight: 600;">Total: ৳{{total}}</span>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{tracking_url}}" style="display: inline-block; background: transparent; border: 1px solid #d4af37; color: #d4af37; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-size: 14px; letter-spacing: 1px; transition: all 0.3s;">
        TRACK YOUR ORDER
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #2a2a2a;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
        Questions? Reply to this email or contact us at artistiya.store@gmail.com
      </p>
      <p style="color: #444; font-size: 11px; margin: 0;">
        © 2024 Artistiya. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
  },
  order_shipped: {
    subject: "Your Order is On The Way! - {{order_number}} | Artistiya",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 2px;">
        <span style="color: #d4af37;">ARTISTIYA</span>
      </h1>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 15px 30px; border-radius: 50px;">
        <span style="color: #fff; font-weight: 600; font-size: 14px; letter-spacing: 1px;">📦 SHIPPED!</span>
      </div>
    </div>

    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 400;">
        Great news, <span style="color: #d4af37;">{{customer_name}}</span>!
      </h2>
      <p style="color: #aaa; line-height: 1.6; margin: 0;">
        Your handcrafted items are on their way to you! Track your package using the button below.
      </p>
    </div>

    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <p style="color: #888; margin: 0 0 10px 0;">Order: <strong style="color: #d4af37;">{{order_number}}</strong></p>
      {{order_details}}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{tracking_url}}" style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: 600;">
        TRACK PACKAGE
      </a>
    </div>

    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #2a2a2a;">
      <p style="color: #666; font-size: 12px;">© 2024 Artistiya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  },
  order_delivered: {
    subject: "Your Order Has Been Delivered! - {{order_number}} | Artistiya",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 2px;">
        <span style="color: #d4af37;">ARTISTIYA</span>
      </h1>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8952a 100%); padding: 15px 30px; border-radius: 50px;">
        <span style="color: #0a0a0a; font-weight: 600; font-size: 14px; letter-spacing: 1px;">🎉 DELIVERED!</span>
      </div>
    </div>

    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 400;">
        Enjoy your new treasures, <span style="color: #d4af37;">{{customer_name}}</span>!
      </h2>
      <p style="color: #aaa; line-height: 1.6; margin: 0;">
        Your order has been delivered. We hope you love your handcrafted pieces! We'd love to hear what you think.
      </p>
    </div>

    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
      <p style="color: #888; margin: 0 0 10px 0;">Order: <strong style="color: #d4af37;">{{order_number}}</strong></p>
      {{order_details}}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{review_url}}" style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: 600;">
        ⭐ LEAVE A REVIEW
      </a>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #d4af37; margin: 0 0 10px 0; font-size: 14px;">SHARE THE LOVE</p>
      <p style="color: #888; font-size: 12px; margin: 0;">Use #Artistiya on Instagram for a chance to be featured!</p>
    </div>

    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #2a2a2a;">
      <p style="color: #666; font-size: 12px;">© 2024 Artistiya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  }
};

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("order_confirmation");
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const getTemplate = (key: string) => templates.find((t) => t.template_key === key);

  const updateTemplateField = (key: string, field: keyof EmailTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.template_key === key ? { ...t, [field]: value } : t))
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

  const resetToDefault = (key: string) => {
    const defaultTemplate = defaultTemplates[key];
    if (defaultTemplate) {
      updateTemplateField(key, "subject", defaultTemplate.subject);
      updateTemplateField(key, "html_content", defaultTemplate.html);
      toast.success("Template reset to default design");
    }
  };

  const getPreviewHtml = (key: string) => {
    const template = getTemplate(key);
    if (!template) return "";

    return template.html_content
      .replace(/\{\{customer_name\}\}/g, "Fatima Rahman")
      .replace(/\{\{order_number\}\}/g, "ART-20260114-1234")
      .replace(/\{\{total\}\}/g, "5,500")
      .replace(/\{\{order_details\}\}/g, `
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #fff;">1x Handcrafted Gold Necklace</p>
          <p style="margin: 0; color: #888; font-size: 12px;">৳2,500</p>
        </div>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #fff;">1x Hand-Painted Tote Bag</p>
          <p style="margin: 0; color: #888; font-size: 12px;">৳3,000</p>
        </div>
      `)
      .replace(/\{\{tracking_url\}\}/g, "#")
      .replace(/\{\{review_url\}\}/g, "#");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const templateLabels: Record<string, { label: string; icon: string }> = {
    order_confirmation: { label: "Order Confirmation", icon: "✓" },
    order_shipped: { label: "Order Shipped", icon: "📦" },
    order_delivered: { label: "Order Delivered", icon: "🎉" },
  };

  const variables = [
    { name: "{{customer_name}}", desc: "Customer's name" },
    { name: "{{order_number}}", desc: "Order ID" },
    { name: "{{total}}", desc: "Order total" },
    { name: "{{order_details}}", desc: "Items list" },
    { name: "{{tracking_url}}", desc: "Tracking link" },
    { name: "{{review_url}}", desc: "Review link" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6 text-gold" />
          Email Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize email notifications with a modern, branded design
        </p>
      </div>

      {/* Variables Card */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Variable className="h-4 w-4 text-gold" />
            Available Variables
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <Badge
                key={v.name}
                variant="secondary"
                className="cursor-pointer hover:bg-gold hover:text-black transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(v.name);
                  toast.success(`Copied ${v.name}`);
                }}
              >
                {v.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          {templates.map((template) => (
            <TabsTrigger key={template.template_key} value={template.template_key}>
              <span className="mr-2">{templateLabels[template.template_key]?.icon}</span>
              {templateLabels[template.template_key]?.label || template.template_key}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map((template) => (
          <TabsContent key={template.template_key} value={template.template_key} className="space-y-6 mt-6">
            {/* Status */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Mail className={`h-5 w-5 ${template.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-foreground font-medium">
                  {templateLabels[template.template_key]?.label}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Dialog open={previewOpen && activeTemplate === template.template_key} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto p-0">
                    <DialogHeader className="p-4 border-b">
                      <DialogTitle>Email Preview</DialogTitle>
                    </DialogHeader>
                    <div className="bg-neutral-900">
                      <iframe
                        srcDoc={getPreviewHtml(template.template_key)}
                        className="w-full h-[70vh] border-0"
                        title="Email Preview"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetToDefault(template.template_key)}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Reset Design
                </Button>
                
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => updateTemplateField(template.template_key, "is_active", checked)}
                />
              </div>
            </div>

            {/* Editor */}
            <Card>
              <CardContent className="p-6 space-y-4">
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
                    className="mt-1.5 font-mono text-xs"
                    rows={25}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="gold"
                    onClick={() => saveTemplate(template.template_key)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminEmailTemplates;
