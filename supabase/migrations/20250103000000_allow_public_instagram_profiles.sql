-- Permitir que todos os usuários vejam todos os perfis do Instagram
-- (mantendo a restrição apenas para criação/edição/exclusão)

-- Remover a política atual restritiva para visualização
DROP POLICY IF EXISTS "Users can view their own Instagram profiles" ON instagram_profiles;

-- Criar nova política que permite visualização pública dos perfis
CREATE POLICY "Public access to view Instagram profiles"
  ON instagram_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Manter as outras políticas restritivas para modificação
-- (ou seja, apenas o dono pode editar/deletar seus próprios perfis)

-- Para os posts do Instagram, também permitir visualização pública
DROP POLICY IF EXISTS "Users can view their own Instagram posts" ON instagram_posts;

CREATE POLICY "Public access to view Instagram posts"
  ON instagram_posts FOR SELECT
  TO authenticated, anon
  USING (true); 