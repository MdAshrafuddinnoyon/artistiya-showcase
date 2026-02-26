
-- SMS Settings table for future SMS gateway integration
CREATE TABLE IF NOT EXISTS public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  provider VARCHAR(50) DEFAULT 'twilio',
  api_key TEXT NULL,
  api_secret TEXT NULL,
  sender_id VARCHAR(50) NULL,
  config JSONB DEFAULT '{}',
  send_order_confirmation BOOLEAN DEFAULT true,
  send_shipping_update BOOLEAN DEFAULT true,
  send_delivery_notification BOOLEAN DEFAULT true,
  send_otp BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS log table
CREATE TABLE IF NOT EXISTS public.sms_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  provider VARCHAR(50) DEFAULT 'twilio',
  status VARCHAR(20) DEFAULT 'sent',
  message_type VARCHAR(50) DEFAULT 'notification',
  error TEXT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage SMS settings" ON public.sms_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can view SMS logs" ON public.sms_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add index for SMS log queries
CREATE INDEX idx_sms_log_recipient ON public.sms_log(recipient);
CREATE INDEX idx_sms_log_sent_at ON public.sms_log(sent_at);
