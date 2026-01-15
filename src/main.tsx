import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { WishlistProvider } from "./hooks/useWishlist.tsx";

createRoot(document.getElementById("root")!).render(
  <WishlistProvider>
    <App />
  </WishlistProvider>
);
