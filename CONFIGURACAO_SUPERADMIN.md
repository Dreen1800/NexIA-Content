# Configuração de Superadmin

## Como configurar usuários superadmin

Para ocultar os botões "Analisar Novo Canal" e "Adicionar (instagram)" para usuários comuns, a aplicação verifica se o usuário logado é um superadmin.

### Método 1: Lista de emails (atual)

Edite o arquivo `src/hooks/useSupabaseAdmin.ts` e adicione os emails dos superadmins na lista:

```typescript
const superAdminEmails = [
  'admin@nexia.com',
  'superadmin@nexia.com',
  'seu-email@dominio.com', // Adicione aqui
  // Adicione mais emails conforme necessário
];
```

### Método 2: Tabela no banco de dados (recomendado para produção)

Para um controle mais dinâmico, você pode criar uma tabela no Supabase:

1. No SQL Editor do Supabase, execute:

```sql
-- Criar tabela de administradores
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários podem verificar se são admins"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

-- Política para apenas superadmins criarem novos admins
CREATE POLICY "Apenas admins podem criar novos admins"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

2. Adicione o primeiro superadmin manualmente:

```sql
-- Substitua 'USER_ID_DO_PRIMEIRO_ADMIN' pelo ID real do usuário
INSERT INTO admin_users (user_id, role) 
VALUES ('USER_ID_DO_PRIMEIRO_ADMIN', 'superadmin');
```

3. Descomente e ajuste o código no `useSupabaseAdmin.ts`:

```typescript
// Verificação no banco de dados
const { data, error } = await supabase
  .from('admin_users')
  .select('id')
  .eq('user_id', user.id)
  .single();

const isAdmin = !error && data;
```

### Como encontrar o User ID

Para encontrar o ID do usuário no Supabase:

1. Vá para Authentication > Users no painel do Supabase
2. Encontre o usuário desejado
3. Clique no usuário para ver os detalhes
4. Copie o UUID que aparece no campo "UID"

### Verificação

Após configurar, os botões só aparecerão para:
- **Dashboard**: Botão "Analisar Novo Canal"
- **Instagram Analytics**: Botões "Adicionar" e "Adicionar Perfil do Instagram"

Usuários não-superadmin verão mensagens informativas ao invés dos botões. 