-- Fix notification trigger to handle NULL values properly
CREATE OR REPLACE FUNCTION public.notify_admin_inscricao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  feirante_name text;
  feira_name text;
BEGIN
  -- Get first admin user
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;
  
  -- Get feirante name and feira name with NULL handling
  SELECT 
    COALESCE(p.full_name, 'Feirante'), 
    COALESCE(f.nome, 'uma feira')
  INTO feirante_name, feira_name
  FROM public.feirantes fe
  JOIN public.profiles p ON p.id = fe.user_id
  JOIN public.feiras f ON f.id = NEW.feira_id
  WHERE fe.id = NEW.feirante_id;
  
  -- Insert notification for admin with proper NULL handling
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      admin_user_id,
      'Nova inscrição recebida',
      COALESCE(feirante_name, 'Feirante') || ' se inscreveu na feira "' || COALESCE(feira_name, 'uma feira') || '".',
      'nova_inscricao',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;