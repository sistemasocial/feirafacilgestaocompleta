-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false);

-- Create RLS policies for payment proofs bucket
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add admin-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS feiras_por_semana INTEGER,
ADD COLUMN IF NOT EXISTS media_feirantes_por_feira INTEGER;

-- Update pagamentos table to track payment proof upload by feirantes
ALTER TABLE public.pagamentos
ADD COLUMN IF NOT EXISTS comprovante_feirante_url TEXT;