-- Adicionar CASCADE delete para inscrições quando uma feira for excluída
ALTER TABLE public.inscricoes_feiras 
DROP CONSTRAINT IF EXISTS inscricoes_feiras_feira_id_fkey;

ALTER TABLE public.inscricoes_feiras
ADD CONSTRAINT inscricoes_feiras_feira_id_fkey
FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;

-- Adicionar CASCADE delete para pagamentos quando uma feira for excluída
ALTER TABLE public.pagamentos
DROP CONSTRAINT IF EXISTS pagamentos_feira_id_fkey;

ALTER TABLE public.pagamentos
ADD CONSTRAINT pagamentos_feira_id_fkey
FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;

-- Adicionar CASCADE delete para avaliações quando uma feira for excluída
ALTER TABLE public.avaliacoes
DROP CONSTRAINT IF EXISTS avaliacoes_feira_id_fkey;

ALTER TABLE public.avaliacoes
ADD CONSTRAINT avaliacoes_feira_id_fkey
FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;

-- Adicionar CASCADE delete para vendas quando uma feira for excluída
ALTER TABLE public.vendas
DROP CONSTRAINT IF EXISTS vendas_feira_id_fkey;

ALTER TABLE public.vendas
ADD CONSTRAINT vendas_feira_id_fkey
FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;