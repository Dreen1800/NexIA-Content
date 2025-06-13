-- Script para permitir acesso publico aos perfis do Instagram E canais do YouTube
-- Execute este script no painel do Supabase SQL Editor

-- PARTE 1: INSTAGRAM PROFILES E POSTS

-- Remover a politica atual restritiva para visualizacao de perfis
DROP POLICY IF EXISTS "Users can view their own Instagram profiles" ON instagram_profiles;

-- Criar nova politica que permite visualizacao publica dos perfis
CREATE POLICY "Public access to view Instagram profiles"
  ON instagram_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Remover a politica atual restritiva para visualizacao de posts
DROP POLICY IF EXISTS "Users can view their own Instagram posts" ON instagram_posts;

-- Criar nova politica que permite visualizacao publica dos posts
CREATE POLICY "Public access to view Instagram posts"
  ON instagram_posts FOR SELECT
  TO authenticated, anon
  USING (true);

-- PARTE 2: CHANNELS E CHANNEL_ANALYSES

-- Remover politicas restritivas dos canais
DROP POLICY IF EXISTS "Users can manage their own channels" ON channels;

-- Criar novas politicas para canais - visualizacao publica, modificacao restrita
CREATE POLICY "Public access to view channels"
  ON channels FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON channels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Remover politicas restritivas das analises de canais
DROP POLICY IF EXISTS "Users can manage their own analyses" ON channel_analyses;

-- Criar novas politicas para analises - visualizacao publica, modificacao restrita
CREATE POLICY "Public access to view channel analyses"
  ON channel_analyses FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own channel analyses"
  ON channel_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel analyses"
  ON channel_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel analyses"
  ON channel_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- VERIFICACAO FINAL

-- Verificar se as politicas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('instagram_profiles', 'instagram_posts', 'channels', 'channel_analyses')
ORDER BY tablename, policyname; 