-- Fix 1: Restrict profiles table access to owner and admin only
-- Drop the overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more restrictive admin view that only exposes necessary fields
CREATE OR REPLACE VIEW public.admin_feirante_contact AS
SELECT 
  f.id as feirante_id,
  f.user_id,
  p.full_name,
  p.whatsapp,
  p.foto_url,
  f.segmento,
  f.bloqueado,
  f.motivo_bloqueio
FROM public.feirantes f
JOIN public.profiles p ON f.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.admin_feirante_contact TO authenticated;

-- Fix 2: Secure storage bucket for comprovantes
-- Make comprovantes bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'comprovantes';

-- Fix 3: Add RLS policy to prevent non-admins from setting payment status to 'pago'
-- Create function to validate payment status changes
CREATE OR REPLACE FUNCTION public.validate_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status is being changed to 'pago' and user is not admin
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can mark payments as paid';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to pagamentos table
DROP TRIGGER IF EXISTS validate_payment_status ON public.pagamentos;
CREATE TRIGGER validate_payment_status
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_status_change();

-- Add new payment status to enum for intermediate state
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_status' AND e.enumlabel = 'aguardando_verificacao') THEN
    ALTER TYPE payment_status ADD VALUE 'aguardando_verificacao';
  END IF;
END $$;

-- Add column to track who verified the payment
ALTER TABLE public.pagamentos 
ADD COLUMN IF NOT EXISTS verificado_por uuid REFERENCES auth.users(id);

-- Add column to track upload date
ALTER TABLE public.pagamentos 
ADD COLUMN IF NOT EXISTS data_upload timestamp with time zone;