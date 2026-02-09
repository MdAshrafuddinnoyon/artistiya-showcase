import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomizationSettings {
  id: string;
  custom_order_enabled: boolean;
  header_button_enabled: boolean;
  header_button_text: string;
  header_button_text_bn: string;
  header_button_link: string | null;
  default_advance_percent: number;
  min_advance_percent: number;
  max_advance_percent: number;
  // Form customization
  form_title: string;
  form_title_bn: string;
  form_subtitle: string;
  form_subtitle_bn: string;
  form_description_label: string;
  form_description_placeholder: string;
  require_image: boolean;
  show_budget_fields: boolean;
  success_message: string;
  success_message_bn: string;
}

const defaultSettings: CustomizationSettings = {
  id: "",
  custom_order_enabled: true,
  header_button_enabled: true,
  header_button_text: "Custom Design",
  header_button_text_bn: "কাস্টম ডিজাইন",
  header_button_link: null,
  default_advance_percent: 50,
  min_advance_percent: 20,
  max_advance_percent: 100,
  form_title: "Submit Your Design",
  form_title_bn: "আপনার ডিজাইন জমা দিন",
  form_subtitle: "Upload your design idea and we will make it for you",
  form_subtitle_bn: "আপনার ডিজাইন আইডিয়া আপলোড করুন, আমরা আপনার জন্য তৈরি করব",
  form_description_label: "Detailed Description",
  form_description_placeholder: "Describe your preferred colors, size, materials, and other details...",
  require_image: false,
  show_budget_fields: true,
  success_message: "Your custom order request has been submitted!",
  success_message_bn: "আপনার কাস্টম অর্ডার রিকোয়েস্ট জমা দেওয়া হয়েছে!",
};

export const useCustomizationSettings = () => {
  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("customization_settings")
        .select("*")
        .single();

      if (error) throw error;
      
      setSettings({
        id: data.id,
        custom_order_enabled: data.custom_order_enabled ?? true,
        header_button_enabled: data.header_button_enabled ?? true,
        header_button_text: data.header_button_text || "Custom Design",
        header_button_text_bn: data.header_button_text_bn || "কাস্টম ডিজাইন",
        header_button_link: data.header_button_link || null,
        default_advance_percent: data.default_advance_percent ?? 50,
        min_advance_percent: data.min_advance_percent ?? 20,
        max_advance_percent: data.max_advance_percent ?? 100,
        form_title: data.form_title || defaultSettings.form_title,
        form_title_bn: data.form_title_bn || defaultSettings.form_title_bn,
        form_subtitle: data.form_subtitle || defaultSettings.form_subtitle,
        form_subtitle_bn: data.form_subtitle_bn || defaultSettings.form_subtitle_bn,
        form_description_label: data.form_description_label || defaultSettings.form_description_label,
        form_description_placeholder: data.form_description_placeholder || defaultSettings.form_description_placeholder,
        require_image: data.require_image ?? false,
        show_budget_fields: data.show_budget_fields ?? true,
        success_message: data.success_message || defaultSettings.success_message,
        success_message_bn: data.success_message_bn || defaultSettings.success_message_bn,
      });
    } catch (error) {
      console.error("Error fetching customization settings:", error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CustomizationSettings>) => {
    if (!settings?.id) return { error: "No settings found" };

    try {
      const { error } = await supabase
        .from("customization_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error: any) {
      console.error("Error updating settings:", error);
      return { error: error.message };
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};
