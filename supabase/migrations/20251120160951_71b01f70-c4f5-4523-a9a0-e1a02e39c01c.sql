-- Atualizar função de notificação para admins quando feirante quer participar
CREATE OR REPLACE FUNCTION public.notify_admin_new_inscricao()
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
  -- Get the admin who created the feira
  SELECT created_by INTO admin_user_id
  FROM public.feiras
  WHERE id = NEW.feira_id;
  
  -- Get feirante and feira names
  SELECT 
    COALESCE(p.full_name, 'Feirante'), 
    COALESCE(f.nome, 'uma feira')
  INTO feirante_name, feira_name
  FROM public.feirantes fe
  JOIN public.profiles p ON p.id = fe.user_id
  JOIN public.feiras f ON f.id = NEW.feira_id
  WHERE fe.id = NEW.feirante_id;
  
  -- Notify the admin who created the feira
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      admin_user_id,
      'Nova solicitação de participação',
      feirante_name || ' quer participar da feira "' || feira_name || '". Aguardando sua aprovação.',
      'inscricao_pendente',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;