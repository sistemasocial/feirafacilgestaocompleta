-- Garantir que feirantes possam inserir e atualizar pagamentos
DROP POLICY IF EXISTS "Feirantes can insert their own pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Feirantes can update their own pagamentos" ON public.pagamentos;

-- Política para INSERT: permitir que feirantes criem pagamentos para suas próprias inscrições
CREATE POLICY "Feirantes can insert pagamentos for their registrations"
ON public.pagamentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.feirantes
    WHERE feirantes.id = pagamentos.feirante_id
    AND feirantes.user_id = auth.uid()
  )
);

-- Política para UPDATE: permitir que feirantes atualizem seus próprios pagamentos
CREATE POLICY "Feirantes can update own pagamentos"
ON public.pagamentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.feirantes
    WHERE feirantes.id = pagamentos.feirante_id
    AND feirantes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.feirantes
    WHERE feirantes.id = pagamentos.feirante_id
    AND feirantes.user_id = auth.uid()
  )
);