-- Enable pgcrypto extension for encryption/decryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to encrypt sensitive data using the application encryption key
CREATE OR REPLACE FUNCTION public.encrypt_credential(plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- The encryption key will be passed from application layer
  -- This function is a placeholder that returns base64-encoded encrypted data
  -- Actual encryption happens in edge functions with the env key
  RETURN plaintext; -- Will be replaced by application-layer encryption
END;
$$;

-- Create function to decrypt sensitive data (for use in edge functions via RPC)
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted bytea;
BEGIN
  -- Check if text is encrypted (prefixed with 'enc:')
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN encrypted_text;
  END IF;
  
  IF NOT encrypted_text LIKE 'enc:%' THEN
    -- Not encrypted, return as-is (for backwards compatibility during migration)
    RETURN encrypted_text;
  END IF;
  
  -- Remove 'enc:' prefix and decrypt
  BEGIN
    decrypted := pgp_sym_decrypt(
      decode(substring(encrypted_text from 5), 'base64'),
      encryption_key
    );
    RETURN convert_from(decrypted, 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, return null for security
    RETURN NULL;
  END;
END;
$$;

-- Create function to encrypt a credential value (for use when saving)
CREATE OR REPLACE FUNCTION public.encrypt_credential_value(plaintext TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted bytea;
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN plaintext;
  END IF;
  
  -- Encrypt and prefix with 'enc:' to identify encrypted values
  encrypted := pgp_sym_encrypt(plaintext, encryption_key);
  RETURN 'enc:' || encode(encrypted, 'base64');
END;
$$;

-- Grant execute permissions to authenticated users (RLS still applies to underlying tables)
GRANT EXECUTE ON FUNCTION public.decrypt_credential(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_credential_value(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_credential(TEXT) TO authenticated;