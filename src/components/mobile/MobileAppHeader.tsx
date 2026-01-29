import { Bell } from "lucide-react";
import InlineSearch from "@/components/search/InlineSearch";

interface MobileAppHeaderProps {
  onSearchClick: () => void;
  onCartClick: () => void;
  onMenuClick: () => void;
  branding: {
    logo_url: string | null;
    logo_text: string;
    logo_text_secondary: string;
  };
  showBack?: boolean;
  title?: string;
}

const MobileAppHeader = ({}: MobileAppHeaderProps) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Inline Ajax Search */}
        <InlineSearch 
          placeholder="Search products..." 
          className="flex-1"
        />

        {/* Notification Bell */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-muted flex-shrink-0">
          <Bell className="h-5 w-5 text-foreground/80" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default MobileAppHeader;
