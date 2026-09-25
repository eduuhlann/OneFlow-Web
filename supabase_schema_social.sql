-- =====================================================
-- ONEFLOW · SOCIAL (Instagram + WhatsApp no Discipulado)
-- Rode no Supabase > SQL Editor
-- =====================================================

-- 1. SEGUINDORES (estilo Instagram)
CREATE TABLE IF NOT EXISTS public.discipleship_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id),
  UNIQUE (follower_id, following_id)
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.discipleship_follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.discipleship_follows (following_id);

-- Busca por @username sem diferenciar maiúsculas/minúsculas
CREATE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

-- 3. RLS
ALTER TABLE public.discipleship_follows ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver quem segue quem
DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.discipleship_follows;
CREATE POLICY "Follows are viewable by authenticated users" ON public.discipleship_follows
  FOR SELECT USING (auth.role() = 'authenticated');

-- Só você pode seguir alguém pelo seu próprio id
DROP POLICY IF EXISTS "Users can follow on their own behalf" ON public.discipleship_follows;
CREATE POLICY "Users can follow on their own behalf" ON public.discipleship_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Só você pode remover o próprio Following
DROP POLICY IF EXISTS "Users can unfollow on their own behalf" ON public.discipleship_follows;
CREATE POLICY "Users can unfollow on their own behalf" ON public.discipleship_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 4. CONTA FOLLOWERS / FOLLOWING NO PERFIL (opcional, use se quiser contadores em cache)
-- CREATE TABLE IF NOT EXISTS public.profile_counts (
--   user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
--   followers_count INTEGER DEFAULT 0,
--   following_count INTEGER DEFAULT 0
-- );

-- =====================================================
-- PRÉVIA ( rode para conferir )
-- =====================================================
-- SELECT * FROM public.discipleship_follows LIMIT 10;
