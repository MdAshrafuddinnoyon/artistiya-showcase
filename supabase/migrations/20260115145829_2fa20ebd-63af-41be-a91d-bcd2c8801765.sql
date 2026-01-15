-- Create payment_transactions table for tracking all payment attempts
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  gateway_code TEXT NOT NULL, -- 'bkash', 'nagad', 'sslcommerz'
  transaction_id TEXT, -- Gateway's transaction/payment ID
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  gateway_response JSONB DEFAULT '{}',
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can manage payment transactions"
  ON public.payment_transactions
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_order ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_gateway ON public.payment_transactions(gateway_code);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();