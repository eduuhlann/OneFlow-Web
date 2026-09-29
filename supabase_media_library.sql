-- =========================================================
-- OneFlow · Biblioteca de mídias (bucket "media")
--
-- Rode no SQL Editor do Supabase. É segura para rodar mais de
-- uma vez (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- POR QUE ISSO É NECESSÁRIO
-- Um bucket marcado como "público" permite abrir qualquer imagem
-- pela URL pública, mas o endpoint que LISTA os arquivos
-- (usado pela seção "Biblioteca") é protegido por RLS em
-- storage.objects. Sem a policy abaixo, a galeria fica vazia e o
-- Supabase devolve "new row violates row-level security policy".
-- =========================================================

-- ---------------------------------------------------------
-- 1. Garante que o bucket existe e é público
-- ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------------------------------------------------------
-- 2. Leitura: qualquer pessoa autenticada pode listar e baixar
--    as mídias da biblioteca.
--
--    A listagem fica restrita a quem está logado de propósito:
--    o bucket é público para as IMAGENS, mas o índice de arquivos
--    não precisa ficar aberto para visitantes. Se preferir
--    liberar também para visitantes, troque
--    "authenticated" por "public" no USING.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "media_select_authenticated" ON storage.objects;
CREATE POLICY "media_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'media');

-- ---------------------------------------------------------
-- 3. Opcional: permitir que o usuário envie novas mídias
--    direto pelo app, dentro da sua própria pasta.
--
--    Descomente o bloco abaixo se a Biblioteca também for
--    usada para upload.
-- ---------------------------------------------------------
-- DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
-- CREATE POLICY "media_insert_own"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'media'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ---------------------------------------------------------
-- 4. Opcional: permitir que o usuário remova as próprias mídias.
-- ---------------------------------------------------------
-- DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
-- CREATE POLICY "media_delete_own"
--   ON storage.objects
--   FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'media'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
