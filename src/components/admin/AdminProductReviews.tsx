import { useState, useEffect } from "react";
import { Check, X, Trash2, Star, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_number: string;
  rating: number;
  review_text: string;
  reviewer_name: string | null;
  status: string;
  created_at: string;
  product?: {
    name: string;
    images: string[];
  };
}

const AdminProductReviews = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    fetchReviews();
    setupRealtimeSubscription();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from("product_reviews")
        .select(`
          *,
          product:products (name, images)
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("reviews-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_reviews" }, () => fetchReviews())
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const updateReviewStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Review ${status}!`);
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;

    try {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Review deleted!");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
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
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gold" />
            Product Reviews
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer reviews and ratings
          </p>
        </div>
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-muted">
          <TabsTrigger value="pending">
            Pending ({reviews.filter(r => r.status === "pending").length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Product Image */}
                      {review.product?.images?.[0] && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={review.product.images[0]}
                            alt={review.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-medium">{review.reviewer_name || "Anonymous"}</span>
                          {renderStars(review.rating)}
                          {getStatusBadge(review.status)}
                        </div>
                        
                        <p className="text-sm text-foreground mb-2">{review.review_text}</p>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Product: {review.product?.name}</span>
                          <span>•</span>
                          <span>Order: {review.order_number}</span>
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {review.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600"
                              onClick={() => updateReviewStatus(review.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive"
                              onClick={() => updateReviewStatus(review.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                No {filter !== "all" ? filter : ""} reviews found
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProductReviews;
