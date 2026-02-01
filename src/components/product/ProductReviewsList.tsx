import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  reviewer_name: string | null;
  created_at: string;
}

interface ProductReviewsListProps {
  productId: string;
}

const ProductReviewsList = ({ productId }: ProductReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();

    // Realtime subscription
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "product_reviews",
        filter: `product_id=eq.${productId}`,
      }, () => fetchReviews())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, review_text, reviewer_name, created_at")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-gold text-gold" : "text-muted"}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-3xl font-bold text-gold">{averageRating}</div>
        <div>
          {renderStars(Math.round(averageRating))}
          <p className="text-sm text-muted-foreground mt-1">
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-border pb-4 last:border-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {review.reviewer_name || "Anonymous"}
                </p>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-foreground pl-11">{review.review_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviewsList;
