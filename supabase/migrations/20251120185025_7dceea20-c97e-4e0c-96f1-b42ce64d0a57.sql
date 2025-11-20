-- Criar função para criar pagamento quando inscrição for aprovada
CREATE OR REPLACE FUNCTION public.create_payment_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  feira_data RECORD;
  total_valor numeric;
BEGIN
  -- Apenas processar quando status mudar de pendente para aprovada
  IF OLD.status = 'pendente' AND NEW.status = 'aprovada' THEN
    -- Buscar informações da feira
    SELECT * INTO feira_data
    FROM public.feiras
    WHERE id = NEW.feira_id;
    
    -- Calcular valor total
    total_valor := COALESCE(feira_data.valor_participacao, 0) + 
                   COALESCE(feira_data.taxa_energia, 0) + 
                   COALESCE(feira_data.taxa_limpeza, 0) + 
                   COALESCE(feira_data.taxa_seguranca, 0);
    
    -- Criar registro de pagamento
    INSERT INTO public.pagamentos (
      feira_id,
      feirante_id,
      valor_total,
      taxa_participacao,
      taxa_energia,
      taxa_limpeza,
      taxa_seguranca,
      data_referencia,
      status
    ) VALUES (
      NEW.feira_id,
      NEW.feirante_id,
      total_valor,
      COALESCE(feira_data.valor_participacao, 0),
      COALESCE(feira_data.taxa_energia, 0),
      COALESCE(feira_data.taxa_limpeza, 0),
      COALESCE(feira_data.taxa_seguranca, 0),
      CURRENT_DATE,
      CASE WHEN total_valor > 0 THEN 'pendente'::payment_status ELSE 'pago'::payment_status END
    );
    
    -- Notificar feirante sobre aprovação
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      f.user_id,
      'Inscrição Aprovada! 🎉',
      'Sua participação na feira "' || feira_data.nome || '" foi aprovada! Complete o pagamento para confirmar sua vaga.',
      'inscricao_aprovada',
      NEW.id
    FROM public.feirantes f
    WHERE f.id = NEW.feirante_id;
  END IF;
  
  -- Notificar sobre rejeição
  IF OLD.status = 'pendente' AND NEW.status = 'rejeitada' THEN
    SELECT * INTO feira_data
    FROM public.feiras
    WHERE id = NEW.feira_id;
    
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      f.user_id,
      'Inscrição Não Aprovada',
      'Sua inscrição na feira "' || feira_data.nome || '" não foi aprovada pelo administrador.',
      'inscricao_rejeitada',
      NEW.id
    FROM public.feirantes f
    WHERE f.id = NEW.feirante_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_create_payment_on_approval ON public.inscricoes_feiras;
CREATE TRIGGER trigger_create_payment_on_approval
AFTER UPDATE ON public.inscricoes_feiras
FOR EACH ROW
EXECUTE FUNCTION public.create_payment_on_approval();