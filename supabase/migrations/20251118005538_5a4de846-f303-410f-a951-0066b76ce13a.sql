-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Feirantes can update own pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Feirantes can insert pagamentos for their registrations" ON public.pagamentos;

-- Criar política simplificada para INSERT
CREATE POLICY "Feirantes insert own payments"
ON public.pagamentos
FOR INSERT
TO authenticated
WITH CHECK (
  feirante_id IN (
    SELECT id FROM public.feirantes WHERE user_id = auth.uid()
  )
);

-- Criar política simplificada para UPDATE que permite atualizar comprovante
CREATE POLICY "Feirantes update own payments"
ON public.pagamentos
FOR UPDATE
TO authenticated
USING (
  feirante_id IN (
    SELECT id FROM public.feirantes WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  feirante_id IN (
    SELECT id FROM public.feirantes WHERE user_id = auth.uid()
  )
);