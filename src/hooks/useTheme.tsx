import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
  accent: string;
  // Extended colors
  buttonHover: string;
  buttonActive: string;
  gradientStart: string;
  gradientEnd: string;
  shadowColor: string;
}

interface ThemeFonts {
  display: string;
  body: string;
  bengali: string;
}

interface ThemeLayout {
  containerWidth: string;
  borderRadius: string;
  headerHeight: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
  isLoading: boolean;
}

const defaultColors: ThemeColors = {
  primary: "#d4af37",
  primaryLight: "#e5c158",
  background: "#0a0a0a",
  foreground: "#f5f0e8",
  card: "#1a1a1a",
  muted: "#262626",
  border: "#333333",
  accent: "#c4a035",
  buttonHover: "#e5c158",
  buttonActive: "#b89830",
  gradientStart: "#e5c158",
  gradientEnd: "#8b7020",
  shadowColor: "rgba(212, 175, 55, 0.3)",
};

const defaultFonts: ThemeFonts = {
  display: "Playfair Display",
  body: "Inter",
  bengali: "Noto Serif Bengali",
};

const defaultLayout: ThemeLayout = {
  containerWidth: "1280px",
  borderRadius: "8px",
  headerHeight: "80px",
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  fonts: defaultFonts,
  layout: defaultLayout,
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

// Convert hex to HSL for CSS variables
const hexToHSL = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, "");
  
  // Parse hex
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Apply theme to CSS variables
const applyTheme = (colors: ThemeColors, fonts: ThemeFonts, layout: ThemeLayout) => {
  const root = document.documentElement;

  // Apply colors as HSL values
  root.style.setProperty("--gold", hexToHSL(colors.primary));
  root.style.setProperty("--gold-light", hexToHSL(colors.primaryLight));
  root.style.setProperty("--gold-dark", hexToHSL(colors.accent));
  root.style.setProperty("--primary", hexToHSL(colors.primary));
  root.style.setProperty("--accent", hexToHSL(colors.accent));
  root.style.setProperty("--background", hexToHSL(colors.background));
  root.style.setProperty("--foreground", hexToHSL(colors.foreground));
  root.style.setProperty("--card", hexToHSL(colors.card));
  root.style.setProperty("--muted", hexToHSL(colors.muted));
  root.style.setProperty("--border", hexToHSL(colors.border));
  
  // Apply extended theme tokens
  root.style.setProperty("--button-hover", colors.buttonHover);
  root.style.setProperty("--button-active", colors.buttonActive);
  
  // Apply gradient and shadow
  root.style.setProperty(
    "--gradient-gold",
    `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.primary} 50%, ${colors.gradientEnd} 100%)`
  );
  root.style.setProperty("--shadow-gold", `0 4px 30px -5px ${colors.shadowColor}`);
  
  // Apply fonts
  root.style.setProperty("--font-display", `'${fonts.display}', Georgia, serif`);
  root.style.setProperty("--font-body", `'${fonts.body}', system-ui, sans-serif`);
  root.style.setProperty("--font-bengali", `'${fonts.bengali}', serif`);
  
  // Apply layout
  root.style.setProperty("--container-width", layout.containerWidth);
  root.style.setProperty("--radius", layout.borderRadius);
  root.style.setProperty("--header-height", layout.headerHeight);
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [fonts, setFonts] = useState<ThemeFonts>(defaultFonts);
  const [layout, setLayout] = useState<ThemeLayout>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTheme = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      let newColors = { ...defaultColors };
      let newFonts = { ...defaultFonts };
      let newLayout = { ...defaultLayout };

      data?.forEach((setting) => {
        if (setting.setting_key === "colors" && setting.setting_value) {
          newColors = { ...defaultColors, ...(setting.setting_value as object) };
        } else if (setting.setting_key === "fonts" && setting.setting_value) {
          newFonts = { ...defaultFonts, ...(setting.setting_value as object) };
        } else if (setting.setting_key === "layout" && setting.setting_value) {
          newLayout = { ...defaultLayout, ...(setting.setting_value as object) };
        }
      });

      setColors(newColors);
      setFonts(newFonts);
      setLayout(newLayout);
      
      // Apply theme to CSS
      applyTheme(newColors, newFonts, newLayout);
    } catch (error) {
      console.error("Error fetching theme:", error);
      // Apply defaults
      applyTheme(defaultColors, defaultFonts, defaultLayout);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel("theme_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "theme_settings" },
        () => {
          fetchTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, fonts, layout, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
