import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomizationSettings {
  id: string;
  custom_order_enabled: boolean;
  header_button_enabled: boolean;
  default_advance_percent: number;
  min_advance_percent: number;
  max_advance_percent: number;
}

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
      setSettings(data);
    } catch (error) {
      console.error("Error fetching customization settings:", error);
      // Use defaults if no settings found
      setSettings({
        id: "",
        custom_order_enabled: true,
        header_button_enabled: true,
        default_advance_percent: 50,
        min_advance_percent: 20,
        max_advance_percent: 100,
      });
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
