import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Heart, Share2, Truck, Clock, Palette, 
  ChevronLeft, ChevronRight, Star, Minus, Plus, Check, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductReviewForm from "@/components/product/ProductReviewForm";
import ProductReviewsList from "@/components/product/ProductReviewsList";
import WhatsAppOrderButton from "@/components/common/WhatsAppOrderButton";
import MobileProductDetail from "@/components/mobile/MobileProductDetail";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppBottomNav from "@/components/mobile/MobileAppBottomNav";
import ProductCustomOrderModal from "@/components/modals/ProductCustomOrderModal";
import ProductDiscountBadge from "@/components/product/ProductDiscountBadge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  story: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  images: string[];
  is_preorderable: boolean;
  production_time: string | null;
  allow_customization: boolean;
  customization_only: boolean;
  advance_payment_percent: number | null;
  customization_instructions: string | null;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  category_id: string | null;
  category: {
    name: string;
    name_bn: string | null;
    slug: string;
  } | null;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            name_bn,
            slug,
            description,
            story,
            price,
            compare_at_price,
            stock_quantity,
            images,
            is_preorderable,
            production_time,
            allow_customization,
            customization_only,
            advance_payment_percent,
            customization_instructions,
            materials,
            dimensions,
            care_instructions,
            category_id,
            category:categories (
              name,
              name_bn,
              slug
            )
          `)
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        setProduct(data as unknown as Product);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Guest can add to cart - we'll handle it with local storage if not logged in
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
    } catch (error) {
      console.error("Add to cart error:", error);
    }
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      navigate("/checkout");
    } catch (error) {
      console.error("Buy now error:", error);
    }
    setAddingToCart(false);
  };

  const handleWishlist = async () => {
    if (!product || !user) {
      toast.error("Please login first");
      return;
    }

    try {
      if (wishlisted) {
        await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await supabase
          .from("wishlist_items")
          .insert({ user_id: user.id, product_id: product.id });
        setWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  const isOutOfStock = product?.stock_quantity === 0;
  const canPreorder = isOutOfStock && product?.is_preorderable;
  const isCustomizationOnly = product?.customization_only === true;
  const discount = product?.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const displayName = product?.name;
  const categoryName = product?.category?.name;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <Header />}
        <main className={isMobile ? "pt-16 pb-24" : "pt-32 pb-24"}>
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        {!isMobile && <Footer />}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <Header />}
        <main className={isMobile ? "pt-16 pb-24 text-center" : "pt-32 pb-24 text-center"}>
          <h1 className="font-display text-3xl text-foreground">Product not found</h1>
          <Link to="/shop">
            <Button variant="gold" className="mt-6">Back to Shop</Button>
          </Link>
        </main>
        {!isMobile && <Footer />}
        {isMobile && <MobileAppBottomNav />}
      </div>
    );
  }

  const productImages = product.images?.length > 0 
    ? product.images 
    : ["/placeholder.svg"];

  // Render mobile-specific layout
  if (isMobile) {
    return (
      <>
        <MobileProductDetail product={product} />
        <MobileAppBottomNav />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          {/* Breadcrumb - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-foreground">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link to={`/shop/${product.category.slug}`} className="hover:text-foreground">
                  {categoryName}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{displayName}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-12">
            {/* Image Gallery */}
            <div className="space-y-3 md:space-y-4">
              <motion.div 
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={productImages[selectedImage]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-1.5 md:gap-2">
                  {discount > 0 && (
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold rounded">
                      -{discount}%
                    </span>
                  )}
                  {canPreorder && (
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-gold text-charcoal-deep text-xs md:text-sm font-semibold rounded">
                      Pre-Order
                    </span>
                  )}
                    {product.allow_customization && (
                      <span className="px-2 py-0.5 md:px-3 md:py-1 bg-bronze text-white text-xs md:text-sm font-semibold rounded">
                        Customizable
                      </span>
                    )}
                  </div>

                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-background/80 rounded-full hover:bg-background"
                    >
                      <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-background/80 rounded-full hover:bg-background"
                    >
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </>
                )}
              </motion.div>

              {productImages.length > 1 && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        selectedImage === index ? "border-gold" : "border-transparent"
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-6">
              {product.category && (
                <Link 
                  to={`/shop/${product.category.slug}`}
                  className="text-gold text-xs md:text-sm tracking-wider uppercase hover:underline"
                >
                  {categoryName}
                </Link>
              )}

              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                {displayName}
              </h1>

              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl font-bold text-gold">
                  ৳{product.price.toLocaleString()}
                </span>
                {product.compare_at_price && (
                  <span className="text-lg md:text-xl text-muted-foreground line-through">
                    ৳{product.compare_at_price.toLocaleString()}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  canPreorder ? (
                    <>
                      <Clock className="h-5 w-5 text-gold" />
                      <span className="text-gold font-medium">
                        Pre-Order • Estimated {product.production_time}
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive font-medium">Out of Stock</span>
                  )
                ) : (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-500 font-medium">
                      In Stock ({product.stock_quantity})
                    </span>
                  </>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isCustomizationOnly ? (
                  /* Custom Order Request Button for customization-only products */
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => setCustomOrderOpen(true)}
                    className="w-full"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Request Custom Order
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Add to Cart Button */}
                    <Button
                      variant="gold-outline"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={addingToCart || (isOutOfStock && !canPreorder)}
                    >
                      {addingToCart ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>

                    {/* Buy Now Button */}
                    <Button
                      variant="gold"
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={addingToCart || (isOutOfStock && !canPreorder)}
                    >
                      {canPreorder ? "Pre-Order Now" : "Buy Now"}
                    </Button>
                  </div>
                )}

                {/* WhatsApp Order Button */}
                <WhatsAppOrderButton
                  productName={displayName || ""}
                  productPrice={product.price}
                  quantity={quantity}
                  variant="outline"
                  className="w-full"
                />
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleWishlist}
                >
                  <Heart className={`h-5 w-5 mr-2 ${wishlisted ? "fill-current text-red-500" : ""}`} />
                  {wishlisted ? "In Wishlist" : "Add to Wishlist"}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {product.allow_customization && (
                <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <p className="font-medium text-gold">Customizable</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This product can be customized according to your preferences. Share details when ordering.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Truck className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <p className="font-medium">Shipping Info</p>
                  <p className="text-sm text-muted-foreground">
                    Dhaka ৳80 • Outside Dhaka ৳130 • Free on ৳5,000+
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-16">
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="story" 
                  className="font-display text-lg data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none"
                >
                  Story
                </TabsTrigger>
                <TabsTrigger 
                  value="specs" 
                  className="font-display text-lg data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="font-display text-lg data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="mt-8">
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {product.story || "Each product is handcrafted with love and care by our artisans."}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  {product.materials && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Materials</h4>
                      <p className="text-muted-foreground">{product.materials}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Dimensions</h4>
                      <p className="text-muted-foreground">{product.dimensions}</p>
                    </div>
                  )}
                  {product.care_instructions && (
                    <div className="sm:col-span-2">
                      <h4 className="font-medium text-foreground mb-2">Care Instructions</h4>
                      <p className="text-muted-foreground">{product.care_instructions}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-display text-xl mb-4">Customer Reviews</h3>
                    <ProductReviewsList productId={product.id} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-4">Write a Review</h3>
                    <ProductReviewForm productId={product.id} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          <RelatedProducts 
            currentProductId={product.id} 
            categoryId={product.category_id}
          />
        </div>
      </main>
      <Footer />
      
      {/* Custom Order Modal */}
      {product && (
        <ProductCustomOrderModal
          open={customOrderOpen}
          onOpenChange={setCustomOrderOpen}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            advance_payment_percent: product.advance_payment_percent || undefined,
            customization_instructions: product.customization_instructions || undefined,
          }}
        />
      )}
    </div>
  );
};

export default ProductDetail;
