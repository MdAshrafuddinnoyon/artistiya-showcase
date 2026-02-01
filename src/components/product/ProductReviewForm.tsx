import { useState } from "react";
import { Star, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProductReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

const ProductReviewForm = ({ productId, onSuccess }: ProductReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to write a review");
      return;
    }

    if (!orderNumber.trim()) {
      setError("Please enter your order number to verify purchase");
      return;
    }

    if (!reviewText.trim()) {
      setError("Please write your review");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // Verify the order exists and belongs to the user
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("order_number", orderNumber.trim())
        .eq("user_id", user.id)
        .single();

      if (orderError || !order) {
        setError("Order not found. Please check your order number.");
        setSubmitting(false);
        return;
      }

      // Check if the order contains this product
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id)
        .eq("product_id", productId)
        .single();

      if (!orderItems) {
        setError("This product was not found in your order.");
        setSubmitting(false);
        return;
      }

      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .single();

      if (existingReview) {
        setError("You have already reviewed this product.");
        setSubmitting(false);
        return;
      }

      // Submit review
      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          order_id: order.id,
          order_number: orderNumber.trim(),
          rating,
          review_text: reviewText.trim(),
          reviewer_name: reviewerName.trim() || null,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast.success("Review submitted! It will appear after approval.");
      setReviewText("");
      setOrderNumber("");
      setRating(5);
      onSuccess?.();
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please <a href="/auth" className="text-gold underline">login</a> to write a review.
          Only customers who have purchased this product can leave reviews.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 bg-muted/50 rounded-lg p-4">
      <h4 className="font-display text-lg">Write a Review</h4>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm">Order Number *</Label>
        <Input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="ART-XXXXXXXX-XXXX"
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter your order number to verify purchase
        </p>
      </div>

      <div>
        <Label className="text-sm">Your Name (Optional)</Label>
        <Input
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Your name"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label className="text-sm">Rating *</Label>
        <div className="flex gap-1 mt-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-gold text-gold"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm">Your Review *</Label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="mt-1.5"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        variant="gold"
        className="w-full"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Submitting...
          </span>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Review
          </>
        )}
      </Button>
    </div>
  );
};

export default ProductReviewForm;
