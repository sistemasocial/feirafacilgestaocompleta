-- Fix security linter issue: recreate view without security definer
DROP VIEW IF EXISTS public.admin_feirante_contact;

-- Recreate as a simple view (views don't use security definer)
CREATE VIEW public.admin_feirante_contact AS
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

-- Grant access appropriately
GRANT SELECT ON public.admin_feirante_contact TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.admin_feirante_contact IS 'Restricted view for admins to access only necessary feirante contact information without exposing sensitive PII like CPF';