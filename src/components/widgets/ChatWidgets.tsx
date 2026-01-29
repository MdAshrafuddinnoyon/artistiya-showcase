import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// WhatsApp icon component
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Messenger icon component
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

interface ChatWidgetsProps {
  whatsappNumber?: string;
  facebookPageId?: string;
}

const ChatWidgets = ({ 
  whatsappNumber = "8801XXXXXXXXX", // Replace with actual number
  facebookPageId = "" 
}: ChatWidgetsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openWhatsApp = () => {
    const message = encodeURIComponent("হ্যালো! আমি artistiya.store থেকে পণ্য সম্পর্কে জানতে চাই।");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const openMessenger = () => {
    if (facebookPageId) {
      window.open(`https://m.me/${facebookPageId}`, "_blank");
    }
  };

  return (
    <div className="fixed bottom-32 md:bottom-6 right-4 md:right-6 z-30">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
          >
            {/* WhatsApp Button */}
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={openWhatsApp}
              className="flex items-center gap-3 px-4 py-3 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl transition-shadow group"
            >
              <WhatsAppIcon />
              <span className="font-medium whitespace-nowrap">WhatsApp</span>
            </motion.button>

            {/* Messenger Button */}
            {facebookPageId && (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={openMessenger}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#00B2FF] to-[#006AFF] text-white rounded-full shadow-lg hover:shadow-xl transition-shadow group"
              >
                <MessengerIcon />
                <span className="font-medium whitespace-nowrap">Messenger</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen ? "bg-charcoal text-white" : "bg-gold text-charcoal-deep"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Subtle glow effect when closed - no blinking */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-gold/20 scale-110" />
      )}
    </div>
  );
};

export default ChatWidgets;
