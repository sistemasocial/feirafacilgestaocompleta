-- Fix Security Definer View issue
-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_feirante_contact;

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

-- Grant access to the view
GRANT SELECT ON public.admin_feirante_contact TO authenticated;

-- Add RLS to the view
ALTER VIEW public.admin_feirante_contact SET (security_invoker = true);