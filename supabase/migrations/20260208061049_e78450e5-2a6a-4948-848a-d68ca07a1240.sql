-- Verify tables are in realtime publication (safe - ignores if already exists)
DO $$
BEGIN
  -- Try to add filter_settings to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.filter_settings;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
  
  -- Try to add shop_settings to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_settings;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
  
  -- Try to add product_colors to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_colors;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
  
  -- Try to add product_sizes to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_sizes;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
END $$;