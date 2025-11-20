-- Adicionar campo de prazo de pagamento em dias antes da feira
ALTER TABLE public.feiras 
ADD COLUMN prazo_pagamento_dias INTEGER DEFAULT 3;

-- Atualizar função de notificação para incluir notificação ao admin sobre nova inscrição
CREATE OR REPLACE FUNCTION public.notify_admin_new_inscricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      'Nova inscrição pendente',
      feirante_name || ' solicitou participar da feira "' || feira_name || '". Aguardando sua aprovação.',
      'inscricao_pendente',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para notificar admin
DROP TRIGGER IF EXISTS trigger_notify_admin_inscricao ON public.inscricoes_feiras;
CREATE TRIGGER trigger_notify_admin_inscricao
  AFTER INSERT ON public.inscricoes_feiras
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_inscricao();

-- Função para notificar feirantes sobre prazo de pagamento
CREATE OR REPLACE FUNCTION public.notify_feirantes_prazo_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  feirante_record RECORD;
  dias_semana_text text;
BEGIN
  -- Converter array de dias para texto
  dias_semana_text := array_to_string(NEW.dias_semana, ', ');
  
  -- Notificar todos os feirantes sobre a nova feira
  FOR feirante_record IN 
    SELECT f.user_id, p.full_name
    FROM public.feirantes f
    JOIN public.profiles p ON p.id = f.user_id
    WHERE f.bloqueado = false OR f.bloqueado IS NULL
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      feirante_record.user_id,
      'Nova feira disponível',
      'Feira "' || NEW.nome || '" (' || dias_semana_text || '). Prazo de pagamento: ' || NEW.prazo_pagamento_dias || ' dias antes da feira.',
      'nova_feira',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Atualizar trigger de nova feira
DROP TRIGGER IF EXISTS trigger_notify_feirantes_new_feira ON public.feiras;
CREATE TRIGGER trigger_notify_feirantes_new_feira
  AFTER INSERT ON public.feiras
  FOR EACH ROW
  EXECUTE FUNCTION notify_feirantes_prazo_pagamento();