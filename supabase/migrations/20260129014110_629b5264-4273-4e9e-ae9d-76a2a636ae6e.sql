-- Create delivery_zones table for admin to set custom shipping rates
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  thana TEXT,
  shipping_cost NUMERIC NOT NULL DEFAULT 130,
  estimated_days TEXT DEFAULT '3-5 days',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(division, district, thana)
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read delivery zones (needed for shipping calculation)
CREATE POLICY "Anyone can view delivery zones"
ON public.delivery_zones
FOR SELECT
USING (true);

-- Only admins can modify delivery zones
CREATE POLICY "Admins can manage delivery zones"
ON public.delivery_zones
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default delivery zones for Dhaka division (lower rate)
INSERT INTO public.delivery_zones (division, district, shipping_cost, estimated_days) VALUES
('Dhaka', 'Dhaka', 60, '1-2 days'),
('Dhaka', 'Gazipur', 70, '1-2 days'),
('Dhaka', 'Narayanganj', 70, '1-2 days'),
('Dhaka', 'Munshiganj', 80, '2-3 days'),
('Dhaka', 'Manikganj', 80, '2-3 days'),
('Dhaka', 'Narsingdi', 80, '2-3 days'),
('Dhaka', 'Tangail', 100, '2-3 days');

-- Insert default for Chattogram
INSERT INTO public.delivery_zones (division, district, shipping_cost, estimated_days) VALUES
('Chattogram', 'Chattogram', 100, '2-3 days'),
('Chattogram', 'Comilla', 120, '3-4 days'),
('Chattogram', 'Cox''s Bazar', 150, '4-5 days');

-- Add index for faster lookups
CREATE INDEX idx_delivery_zones_lookup ON public.delivery_zones (division, district, thana);
CREATE INDEX idx_delivery_zones_active ON public.delivery_zones (is_active) WHERE is_active = true;