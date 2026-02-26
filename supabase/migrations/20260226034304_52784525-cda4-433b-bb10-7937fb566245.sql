-- Add sslcommerz, aamarpay, surjopay to payment_method enum
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'sslcommerz';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'aamarpay';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'surjopay';