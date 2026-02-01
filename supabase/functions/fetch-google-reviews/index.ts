import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Google settings from site_branding
    const { data: branding, error: brandingError } = await supabase
      .from("site_branding")
      .select("google_place_id, google_api_key")
      .single();

    if (brandingError || !branding?.google_place_id || !branding?.google_api_key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Google Place ID or API Key not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const placeId = branding.google_place_id;
    const apiKey = branding.google_api_key;

    // Fetch place details from Google Places API
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`;
    
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json();

    if (googleData.status !== "OK") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Google API Error: ${googleData.status}`,
          details: googleData.error_message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const place = googleData.result;
    const reviews = place.reviews || [];

    // Store reviews in testimonials table
    const insertedReviews = [];
    for (const review of reviews) {
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from("testimonials")
        .select("id")
        .eq("google_review_id", review.time?.toString())
        .eq("google_place_id", placeId)
        .single();

      if (!existingReview) {
        const { data: newReview, error: insertError } = await supabase
          .from("testimonials")
          .insert({
            name: review.author_name,
            text: review.text,
            rating: review.rating,
            platform: "google",
            source: "google",
            google_review_id: review.time?.toString(),
            google_place_id: placeId,
            customer_photo_url: review.profile_photo_url,
            review_date: new Date(review.time * 1000).toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (!insertError && newReview) {
          insertedReviews.push(newReview);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        place_name: place.name,
        overall_rating: place.rating,
        total_reviews: place.user_ratings_total,
        synced_reviews: insertedReviews.length,
        reviews_found: reviews.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fetching Google reviews:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
