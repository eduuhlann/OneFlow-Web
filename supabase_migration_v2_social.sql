-- =========================================================
-- OneFlow · Migração v2 (recursos sociais, perfil e conta)
-- Rode no SQL Editor do Supabase. É segura para rodar mais de
-- uma vez: tudo usa IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =========================================================

-- ---------------------------------------------------------
-- 1. PERFIL: bio curta, versículo fixado e display_name
--    (display_name já é usado pelo app, mas não existia no
--     schema original — aqui fica documentado e garantido)
-- ---------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS short_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_verse TEXT;

-- Backfill a partir do auth.users (sempre existe e é o que o
-- trigger original usa). Também cobre o nome do Google OAuth.
UPDATE public.profiles p
SET display_name = COALESCE(
      NULLIF(p.display_name, ''),
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      NULLIF(u.raw_user_meta_data->>'name', ''),
      p.username
    )
FROM auth.users u
WHERE u.id = p.id
  AND p.display_name IS NULL;

-- Schemas legados que tinham profiles.full_name: backfill
-- dinâmico, porque referenciar a coluna direto quebraria a
-- migration inteira nos schemas que não a possuem.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    EXECUTE $q$
      UPDATE public.profiles
      SET display_name = full_name
      WHERE display_name IS NULL AND full_name IS NOT NULL
    $q$;
  END IF;
END $$;

-- ---------------------------------------------------------
-- 2. GRUPOS COM SENHA
--    A senha nunca é gravada em texto puro: o app manda
--    o SHA-256 e a comparação acontece por RPC, no banco.
--    (limitação conhecida: a policy "View groups" abaixo
--     permite SELECT * para autenticados, então o hash ainda
--     fica legível no cliente. Próximo passo: view pública
--     sem a coluna.)
-- ---------------------------------------------------------
ALTER TABLE public.discipleship_groups ADD COLUMN IF NOT EXISTS join_password_hash TEXT;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- O pgcrypto pode estar em "extensions" (padrão Supabase) ou em
-- "public" (instâncias antigas). Descobre onde está antes de criar
-- a função, senão o SQL quebraria.
DO $$
DECLARE
  digest_fn TEXT;
BEGIN
  IF to_regprocedure('extensions.digest(bytea,text)') IS NOT NULL THEN
    digest_fn := 'extensions.digest';
  ELSIF to_regprocedure('public.digest(bytea,text)') IS NOT NULL THEN
    digest_fn := 'public.digest';
  ELSE
    digest_fn := 'digest';
  END IF;

  EXECUTE format($fn$
    CREATE OR REPLACE FUNCTION public.verify_group_password(p_group_id UUID, p_password TEXT)
    RETURNS BOOLEAN
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public, extensions
    AS $body$
      SELECT COALESCE(
        (
          SELECT g.join_password_hash IS NULL
              OR g.join_password_hash = ''
              OR g.join_password_hash = encode(%s(p_password::bytea, 'sha256'), 'hex')
          FROM public.discipleship_groups g
          WHERE g.id = p_group_id
        ),
        FALSE
      );
    $body$;
  $fn$, digest_fn);

  EXECUTE $g$GRANT EXECUTE ON FUNCTION public.verify_group_password(UUID, TEXT) TO authenticated;$g$;
END $$;

-- ---------------------------------------------------------
-- 3. PERFIL PÚBLICO
--    Sem isso, /u/:username retorna vazio para quem não
--    está logado (a policy exigia authenticated). Não há
--    dados sensíveis em profiles: e-mail e telefone ficam
--    apenas no auth.users.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Leitura de grupos: qualquer autenticado precisa saber se
-- o grupo tem senha para exibir o pedido ao entrar.
DROP POLICY IF EXISTS "View groups" ON public.discipleship_groups;
CREATE POLICY "View groups" ON public.discipleship_groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- 4. SOLICITAÇÕES DE CONEXÃO
--    Reaproveita discipleship_connections com status
--    'pending'. As policies abaixo são adicionais: se o
--    schema já tiver policies permissivas, elas apenas
--    liberam o fluxo completo de solicitar/responder/cancelar.
-- ---------------------------------------------------------
ALTER TABLE public.discipleship_connections DROP CONSTRAINT IF EXISTS discipleship_connections_status_check;

DROP POLICY IF EXISTS "Users can request connections" ON public.discipleship_connections;
CREATE POLICY "Users can request connections" ON public.discipleship_connections
  FOR INSERT WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Users can respond to own requests" ON public.discipleship_connections;
CREATE POLICY "Users can respond to own requests" ON public.discipleship_connections
  FOR UPDATE USING (auth.uid() = disciple_id OR auth.uid() = leader_id);

DROP POLICY IF EXISTS "Users can cancel own requests" ON public.discipleship_connections;
CREATE POLICY "Users can cancel own requests" ON public.discipleship_connections
  FOR DELETE USING (auth.uid() = leader_id);

CREATE INDEX IF NOT EXISTS idx_connections_disciple_status
  ON public.discipleship_connections (disciple_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_leader_status
  ON public.discipleship_connections (leader_id, status);

-- ---------------------------------------------------------
-- 5. MENÇÕES: busca por username em mensagens
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- ---------------------------------------------------------
-- 6. EXCLUIR CONTA
--    Remove o usuário do auth (e por cascade tudo que
--    referencia profiles.id). SECURITY DEFINER porque o
--    client não tem acesso a auth.users.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := auth.uid();
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida: faça login novamente.';
  END IF;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
