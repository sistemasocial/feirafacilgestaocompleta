-- Trigger para notificar admin quando feirante envia comprovante de pagamento
CREATE OR REPLACE FUNCTION public.notify_admin_payment_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
  feirante_name text;
  feira_name text;
BEGIN
  -- Apenas notificar quando status mudar para aguardando_verificacao
  IF NEW.status = 'aguardando_verificacao' AND (OLD.status IS NULL OR OLD.status != 'aguardando_verificacao') THEN
    -- Buscar o admin que criou a feira
    SELECT created_by INTO admin_user_id
    FROM public.feiras
    WHERE id = NEW.feira_id;
    
    -- Buscar nome do feirante e da feira
    SELECT 
      COALESCE(p.full_name, 'Feirante'),
      COALESCE(f.nome, 'uma feira')
    INTO feirante_name, feira_name
    FROM public.feirantes fe
    JOIN public.profiles p ON p.id = fe.user_id
    JOIN public.feiras f ON f.id = NEW.feira_id
    WHERE fe.id = NEW.feirante_id;
    
    -- Notificar o admin
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        admin_user_id,
        'Novo comprovante de pagamento',
        feirante_name || ' enviou comprovante de pagamento para a feira "' || feira_name || '". Verifique em Pagamentos.',
        'pagamento_enviado',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_notify_admin_payment_upload ON public.pagamentos;
CREATE TRIGGER trigger_notify_admin_payment_upload
  AFTER INSERT OR UPDATE ON public.pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_payment_upload();