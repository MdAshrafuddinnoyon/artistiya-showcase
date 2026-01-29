import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { divisions, getDistrictsByDivision, getThanasByDistrict } from "@/data/bangladeshLocations";

interface LocationResult {
  division: string;
  district: string;
  thana: string;
  confidence: "high" | "medium" | "low";
}

interface GeolocationState {
  loading: boolean;
  error: string | null;
  location: LocationResult | null;
}

// Bangladesh major cities/districts with approximate coordinates
const locationCoordinates: Record<string, { lat: number; lng: number; division: string; district: string }> = {
  // Dhaka Division
  "dhaka_central": { lat: 23.8103, lng: 90.4125, division: "Dhaka", district: "Dhaka" },
  "gazipur": { lat: 24.0023, lng: 90.4264, division: "Dhaka", district: "Gazipur" },
  "narayanganj": { lat: 23.6217, lng: 90.5000, division: "Dhaka", district: "Narayanganj" },
  "tangail": { lat: 24.2513, lng: 89.9163, division: "Dhaka", district: "Tangail" },
  "manikganj": { lat: 23.8636, lng: 90.0027, division: "Dhaka", district: "Manikganj" },
  "narsingdi": { lat: 23.9192, lng: 90.7171, division: "Dhaka", district: "Narsingdi" },
  "munshiganj": { lat: 23.5422, lng: 90.5305, division: "Dhaka", district: "Munshiganj" },
  
  // Chattogram Division
  "chittagong": { lat: 22.3569, lng: 91.7832, division: "Chattogram", district: "Chattogram" },
  "comilla": { lat: 23.4607, lng: 91.1809, division: "Chattogram", district: "Comilla" },
  "coxsbazar": { lat: 21.4272, lng: 92.0058, division: "Chattogram", district: "Cox's Bazar" },
  "feni": { lat: 23.0159, lng: 91.3976, division: "Chattogram", district: "Feni" },
  
  // Rajshahi Division
  "rajshahi": { lat: 24.3745, lng: 88.6042, division: "Rajshahi", district: "Rajshahi" },
  "bogura": { lat: 24.8465, lng: 89.3773, division: "Rajshahi", district: "Bogura" },
  "pabna": { lat: 24.0064, lng: 89.2372, division: "Rajshahi", district: "Pabna" },
  
  // Khulna Division
  "khulna": { lat: 22.8456, lng: 89.5403, division: "Khulna", district: "Khulna" },
  "jashore": { lat: 23.1665, lng: 89.2095, division: "Khulna", district: "Jashore" },
  "kushtia": { lat: 23.9013, lng: 89.1205, division: "Khulna", district: "Kushtia" },
  
  // Sylhet Division
  "sylhet": { lat: 24.8949, lng: 91.8687, division: "Sylhet", district: "Sylhet" },
  "habiganj": { lat: 24.3745, lng: 91.4155, division: "Sylhet", district: "Habiganj" },
  
  // Barishal Division
  "barishal": { lat: 22.7010, lng: 90.3535, division: "Barishal", district: "Barishal" },
  "patuakhali": { lat: 22.3596, lng: 90.3290, division: "Barishal", district: "Patuakhali" },
  
  // Rangpur Division
  "rangpur": { lat: 25.7439, lng: 89.2752, division: "Rangpur", district: "Rangpur" },
  "dinajpur": { lat: 25.6279, lng: 88.6332, division: "Rangpur", district: "Dinajpur" },
  
  // Mymensingh Division
  "mymensingh": { lat: 24.7471, lng: 90.4203, division: "Mymensingh", district: "Mymensingh" },
  "jamalpur": { lat: 24.9375, lng: 89.9372, division: "Mymensingh", district: "Jamalpur" },
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the nearest location based on coordinates
const findNearestLocation = (lat: number, lng: number): { location: { division: string; district: string }; distance: number } => {
  let nearestLocation = { division: "Dhaka", district: "Dhaka" };
  let minDistance = Infinity;
  
  for (const [, coords] of Object.entries(locationCoordinates)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = { division: coords.division, district: coords.district };
    }
  }
  
  return { location: nearestLocation, distance: minDistance };
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    location: null,
  });

  const detectLocation = useCallback(async (): Promise<LocationResult | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return null;
    }

    setState({ loading: true, error: null, location: null });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const { location, distance } = findNearestLocation(latitude, longitude);
          
          // Determine confidence based on distance
          let confidence: "high" | "medium" | "low" = "low";
          if (distance < 20) confidence = "high";
          else if (distance < 50) confidence = "medium";
          
          // Get a default thana for the district
          const thanas = getThanasByDistrict(location.district);
          const thana = thanas.length > 0 ? thanas[0] : "";
          
          const result: LocationResult = {
            division: location.division,
            district: location.district,
            thana,
            confidence,
          };
          
          setState({ loading: false, error: null, location: result });
          resolve(result);
        },
        (error) => {
          let errorMessage = "Unable to detect location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setState({ loading: false, error: errorMessage, location: null });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, []);

  return {
    ...state,
    detectLocation,
  };
};

// Hook to get shipping cost from database or use default
export const useShippingCost = () => {
  const getShippingCost = useCallback(async (
    division: string,
    district: string,
    thana?: string
  ): Promise<{ cost: number; estimatedDays: string }> => {
    // Default costs
    const defaultDhakaCost = 80;
    const defaultOutsideDhakaCost = 130;
    const isDhaka = division === "Dhaka";
    
    try {
      // First try to find exact thana match
      if (thana) {
        const { data: thanaZone } = await supabase
          .from("delivery_zones")
          .select("shipping_cost, estimated_days")
          .eq("division", division)
          .eq("district", district)
          .eq("thana", thana)
          .eq("is_active", true)
          .single();
        
        if (thanaZone) {
          return {
            cost: thanaZone.shipping_cost,
            estimatedDays: thanaZone.estimated_days || (isDhaka ? "1-2 days" : "3-5 days"),
          };
        }
      }
      
      // Then try district level
      const { data: districtZone } = await supabase
        .from("delivery_zones")
        .select("shipping_cost, estimated_days")
        .eq("division", division)
        .eq("district", district)
        .is("thana", null)
        .eq("is_active", true)
        .single();
      
      if (districtZone) {
        return {
          cost: districtZone.shipping_cost,
          estimatedDays: districtZone.estimated_days || (isDhaka ? "1-2 days" : "3-5 days"),
        };
      }
      
      // Fall back to defaults
      return {
        cost: isDhaka ? defaultDhakaCost : defaultOutsideDhakaCost,
        estimatedDays: isDhaka ? "1-2 days" : "3-5 days",
      };
    } catch (error) {
      console.error("Error fetching shipping cost:", error);
      return {
        cost: isDhaka ? defaultDhakaCost : defaultOutsideDhakaCost,
        estimatedDays: isDhaka ? "1-2 days" : "3-5 days",
      };
    }
  }, []);

  return { getShippingCost };
};
