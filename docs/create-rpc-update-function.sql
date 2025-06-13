-- Criar função RPC para contornar o trigger
CREATE OR REPLACE FUNCTION update_instagram_main_profile(
    profile_id UUID, 
    user_id_param UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o perfil pertence ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM instagram_profiles 
        WHERE id = profile_id AND user_id = user_id_param
    ) THEN
        RAISE EXCEPTION 'Profile not found or access denied';
    END IF;
    
    -- Primeiro, remover is_main de outros perfis
    UPDATE instagram_profiles 
    SET is_main = FALSE 
    WHERE user_id = user_id_param AND is_main = TRUE;
    
    -- Depois, definir este perfil como principal
    UPDATE instagram_profiles 
    SET is_main = TRUE 
    WHERE id = profile_id AND user_id = user_id_param;
    
    -- Verificar se funcionou
    IF EXISTS (
        SELECT 1 FROM instagram_profiles 
        WHERE id = profile_id AND user_id = user_id_param AND is_main = TRUE
    ) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION update_instagram_main_profile(UUID, UUID) TO authenticated; 