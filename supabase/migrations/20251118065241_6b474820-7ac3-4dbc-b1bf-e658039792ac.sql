-- Criar tabela para rastrear instalações do PWA
CREATE TABLE IF NOT EXISTS public.app_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

-- Habilitar RLS
ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;

-- Política para permitir qualquer um ver o total de instalações
CREATE POLICY "Anyone can view install count"
ON public.app_installs
FOR SELECT
USING (true);

-- Política para permitir inserir novas instalações
CREATE POLICY "Anyone can insert installs"
ON public.app_installs
FOR INSERT
WITH CHECK (true);

-- Criar índice para melhor performance
CREATE INDEX idx_app_installs_installed_at ON public.app_installs(installed_at DESC);