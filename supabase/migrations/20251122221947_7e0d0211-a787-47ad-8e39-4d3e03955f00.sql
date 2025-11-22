-- Limpar tokens FCM duplicados, mantendo apenas o mais recente por usuário
DELETE FROM fcm_tokens
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, token) id
  FROM fcm_tokens
  ORDER BY user_id, token, created_at DESC
);

-- Remover constraint existente e criar novamente como índice
ALTER TABLE fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_key;
CREATE UNIQUE INDEX IF NOT EXISTS fcm_tokens_user_id_token_unique ON fcm_tokens(user_id, token);

-- Adicionar comentário explicativo
COMMENT ON INDEX fcm_tokens_user_id_token_unique IS 'Garante que cada combinação usuário+token seja única, evitando registros duplicados';
