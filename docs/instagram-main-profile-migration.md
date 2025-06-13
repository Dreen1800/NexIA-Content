# Migração: Perfil Principal do Instagram

## Objetivo
Adicionar funcionalidade de "perfil principal" para perfis do Instagram, similar à funcionalidade existente para canais do YouTube.

## Migração SQL

Execute o seguinte SQL no Supabase Studio (Editor SQL):

```sql
-- Add is_main column to instagram_profiles table
ALTER TABLE instagram_profiles 
ADD COLUMN is_main BOOLEAN DEFAULT FALSE;

-- Add unique constraint to ensure only one main profile per user
CREATE UNIQUE INDEX idx_instagram_profiles_main_user 
ON instagram_profiles (user_id) 
WHERE is_main = TRUE;

-- Create a function to ensure only one main profile per user
CREATE OR REPLACE FUNCTION ensure_single_main_instagram_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this profile as main, unset all other main profiles for this user
  IF NEW.is_main = TRUE THEN
    UPDATE instagram_profiles 
    SET is_main = FALSE 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_main = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically enforce single main profile
CREATE TRIGGER trigger_ensure_single_main_instagram_profile
  BEFORE INSERT OR UPDATE ON instagram_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_main_instagram_profile();
```

## Funcionalidades Implementadas

1. **Coluna `is_main`**: Nova coluna booleana na tabela `instagram_profiles`
2. **Constraint único**: Garante que apenas um perfil por usuário pode ser principal
3. **Trigger automático**: Automaticamente remove `is_main` de outros perfis quando um novo é definido como principal
4. **Interface do usuário**: Botão de estrela (⭐) para marcar/desmarcar perfil principal
5. **Primeiro perfil**: Automaticamente define o primeiro perfil analisado como principal

## Como Usar

1. Execute a migração SQL acima no Supabase Studio
2. Restart da aplicação (opcional, mas recomendado)
3. Na página de Instagram Analytics, clique na estrela ao lado de qualquer perfil para defini-lo como principal
4. O perfil principal aparecerá com a estrela preenchida e destacada

## Funcionalidades no Código

- `setMainProfile(profileId)`: Define um perfil como principal
- `getMainProfile()`: Recupera o perfil principal do usuário
- Primeiro perfil é automaticamente definido como principal
- Interface visual com ícone de estrela similar ao YouTube 