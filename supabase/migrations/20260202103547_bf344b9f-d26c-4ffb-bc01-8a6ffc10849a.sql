-- Add payment mode and QR code fields to payment_providers
ALTER TABLE public.payment_providers 
ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'manual' CHECK (payment_mode IN ('manual', 'api')),
ADD COLUMN IF NOT EXISTS qr_code_image TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS instructions_bn TEXT;

-- Update email_settings with more fields for Resend integration
ALTER TABLE public.email_settings
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS send_order_confirmation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS send_shipping_update BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS send_delivery_notification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS order_confirmation_template_id TEXT,
ADD COLUMN IF NOT EXISTS shipping_template_id TEXT;

COMMENT ON COLUMN public.payment_providers.payment_mode IS 'manual = QR code/account number, api = automated gateway';
COMMENT ON COLUMN public.payment_providers.qr_code_image IS 'QR code image URL for manual payments';