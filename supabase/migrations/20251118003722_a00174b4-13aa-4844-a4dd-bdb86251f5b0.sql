-- Add RLS policy to allow feirantes to insert their own pagamentos
CREATE POLICY "Feirantes can insert their own pagamentos" 
ON public.pagamentos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM feirantes
    WHERE feirantes.id = pagamentos.feirante_id 
    AND feirantes.user_id = auth.uid()
  )
);

-- Add RLS policy to allow feirantes to update their own pagamentos
CREATE POLICY "Feirantes can update their own pagamentos" 
ON public.pagamentos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM feirantes
    WHERE feirantes.id = pagamentos.feirante_id 
    AND feirantes.user_id = auth.uid()
  )
);