import { Link } from "react-router-dom";
import { Search, Bell } from "lucide-react";

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

const MobileAppHeader = ({
  onSearchClick,
}: MobileAppHeaderProps) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white safe-area-top">
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Search Bar */}
        <button
          onClick={onSearchClick}
          className="flex-1 flex items-center gap-3 h-11 px-4 bg-gray-100 rounded-full text-gray-400"
        >
          <Search className="h-5 w-5" />
          <span className="text-sm">Search products</span>
        </button>

        {/* Notification Bell */}
        <button className="relative w-11 h-11 flex items-center justify-center rounded-full bg-gray-100">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default MobileAppHeader;
