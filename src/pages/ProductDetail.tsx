import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Heart, Share2, Truck, Clock, Palette, 
  ChevronLeft, ChevronRight, Star, Minus, Plus, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
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
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  category: {
    name: string;
    name_bn: string | null;
    slug: string;
  } | null;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
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
    
    if (!user) {
      toast.error("অনুগ্রহ করে প্রথমে লগইন করুন");
      return;
    }

    setAddingToCart(true);
    await addToCart(product.id, quantity);
    setAddingToCart(false);
  };

  const handleWishlist = async () => {
    if (!product || !user) {
      toast.error("অনুগ্রহ করে প্রথমে লগইন করুন");
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
        toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
      } else {
        await supabase
          .from("wishlist_items")
          .insert({ user_id: user.id, product_id: product.id });
        setWishlisted(true);
        toast.success("উইশলিস্টে যোগ করা হয়েছে");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  const isOutOfStock = product?.stock_quantity === 0;
  const canPreorder = isOutOfStock && product?.is_preorderable;
  const discount = product?.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
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
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24 text-center">
          <h1 className="font-display text-3xl text-foreground">পণ্য পাওয়া যায়নি</h1>
          <Link to="/shop">
            <Button variant="gold" className="mt-6">শপে ফিরে যান</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Use placeholder images if no images
  const productImages = product.images?.length > 0 
    ? product.images 
    : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-foreground">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link to={`/shop/${product.category.slug}`} className="hover:text-foreground">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div 
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-semibold rounded">
                      -{discount}%
                    </span>
                  )}
                  {canPreorder && (
                    <span className="px-3 py-1 bg-gold text-charcoal-deep text-sm font-semibold rounded">
                      প্রি-অর্ডার
                    </span>
                  )}
                  {product.allow_customization && (
                    <span className="px-3 py-1 bg-bronze text-white text-sm font-semibold rounded">
                      কাস্টমাইজেবল
                    </span>
                  )}
                </div>

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </motion.div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
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
            <div className="space-y-6">
              {/* Category */}
              {product.category && (
                <Link 
                  to={`/shop/${product.category.slug}`}
                  className="text-gold text-sm tracking-wider uppercase hover:underline"
                >
                  {product.category.name_bn || product.category.name}
                </Link>
              )}

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl text-foreground">
                {product.name_bn || product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gold">
                  ৳{product.price.toLocaleString()}
                </span>
                {product.compare_at_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    ৳{product.compare_at_price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  canPreorder ? (
                    <>
                      <Clock className="h-5 w-5 text-gold" />
                      <span className="text-gold font-medium">
                        প্রি-অর্ডার • আনুমানিক {product.production_time}
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive font-medium">স্টক শেষ</span>
                  )
                ) : (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-500 font-medium">
                      স্টকে আছে ({product.stock_quantity}টি)
                    </span>
                  </>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity Selector */}
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

                {/* Add to Cart Button */}
                <Button
                  variant="gold"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={addingToCart || (isOutOfStock && !canPreorder)}
                >
                  {addingToCart ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      যোগ হচ্ছে...
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {canPreorder ? "প্রি-অর্ডার করুন" : "কার্টে যোগ করুন"}
                    </>
                  )}
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleWishlist}
                >
                  <Heart className={`h-5 w-5 mr-2 ${wishlisted ? "fill-current text-red-500" : ""}`} />
                  {wishlisted ? "উইশলিস্টে আছে" : "উইশলিস্টে রাখুন"}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Customization Note */}
              {product.allow_customization && (
                <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <p className="font-medium text-gold">কাস্টমাইজেশন সুবিধা</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        এই পণ্যটি আপনার পছন্দমতো কাস্টমাইজ করা যাবে। অর্ডার করার সময় বিস্তারিত জানান।
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Truck className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <p className="font-medium">ডেলিভারি তথ্য</p>
                  <p className="text-sm text-muted-foreground">
                    ঢাকায় ৳৮০ • ঢাকার বাইরে ৳১৩০ • ৳৫,০০০+ অর্ডারে ফ্রি
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
                  গল্প
                </TabsTrigger>
                <TabsTrigger 
                  value="specs" 
                  className="font-display text-lg data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none"
                >
                  বিবরণ
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="font-display text-lg data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none"
                >
                  রিভিউ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="mt-8">
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {product.story || "প্রতিটি পণ্য হাতে তৈরি, প্রতিটি স্পর্শে শিল্পীর ভালোবাসা।"}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  {product.materials && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">উপকরণ</h4>
                      <p className="text-muted-foreground">{product.materials}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">মাপ</h4>
                      <p className="text-muted-foreground">{product.dimensions}</p>
                    </div>
                  )}
                  {product.care_instructions && (
                    <div className="sm:col-span-2">
                      <h4 className="font-medium text-foreground mb-2">যত্ন নির্দেশনা</h4>
                      <p className="text-muted-foreground">{product.care_instructions}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">এখনো কোনো রিভিউ নেই</p>
                  <Button variant="outline" className="mt-4">
                    প্রথম রিভিউ দিন
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
