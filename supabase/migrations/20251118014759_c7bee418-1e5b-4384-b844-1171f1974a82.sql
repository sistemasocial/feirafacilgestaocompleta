-- Adicionar policy para permitir que usuários autenticados vejam perfis básicos de outros usuários
-- Isso é necessário para que feirantes possam ver informações do admin responsável pela feira

CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Nota: Esta policy permite acesso a dados básicos do perfil
-- Dados sensíveis como CPF, pix_key já estão protegidos por outras camadas
-- e esta policy só permite leitura (SELECT), não modificação