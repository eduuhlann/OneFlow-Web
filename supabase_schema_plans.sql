-- =====================================================
-- ONEFLOW · PLANOS PERSONALIZADOS COM IA
-- Rode no Supabase > SQL Editor (depois de supabase_schema.sql)
-- =====================================================

-- 1. PLANO
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT,
  objective TEXT,
  situation TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  intensity TEXT DEFAULT 'normal',
  formats TEXT[] DEFAULT '{}',
  style TEXT DEFAULT 'devocional',
  mode TEXT DEFAULT 'individual',
  privacy TEXT DEFAULT 'private',
  invite_code TEXT UNIQUE,
  branching_answers JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DIAS DO PLANO
CREATE TABLE IF NOT EXISTS public.plan_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  title TEXT DEFAULT '',
  reference TEXT DEFAULT '',
  content TEXT DEFAULT '',
  prayer TEXT DEFAULT '',
  context TEXT DEFAULT '',
  practice TEXT DEFAULT '',
  challenge TEXT DEFAULT '',
  memorization TEXT DEFAULT '',
  questions JSONB DEFAULT '[]'::jsonb,
  difficulty INTEGER DEFAULT 1,
  is_bonus BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (plan_id, day)
);

-- 3. PROGRESSO DE CADA PESSOA
CREATE TABLE IF NOT EXISTS public.plan_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  personal_note TEXT DEFAULT '',
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (plan_id, user_id, day)
);

-- 4. MEMBROS DE PLANO EM GRUPO
CREATE TABLE IF NOT EXISTS public.plan_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  current_day INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_day INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (plan_id, user_id)
);

-- 5. COMENTÁRIOS POR DIA
CREATE TABLE IF NOT EXISTS public.plan_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DESAFIO COLETIVO
CREATE TABLE IF NOT EXISTS public.plan_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_streak INTEGER NOT NULL DEFAULT 7,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CONTEÚDO BÔNUS DESBLOQUEADO
CREATE TABLE IF NOT EXISTS public.plan_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  threshold_percent INTEGER DEFAULT 80,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS plans_user_idx ON public.plans (user_id);
CREATE INDEX IF NOT EXISTS plan_days_plan_idx ON public.plan_days (plan_id, day);
CREATE INDEX IF NOT EXISTS plan_progress_user_idx ON public.plan_progress (user_id, plan_id);
CREATE INDEX IF NOT EXISTS plan_group_members_user_idx ON public.plan_group_members (user_id);
CREATE INDEX IF NOT EXISTS plan_comments_plan_idx ON public.plan_comments (plan_id, day);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_unlocks ENABLE ROW LEVEL SECURITY;

-- VISIBILIDADE DO PLANO: dono, membro do grupo, ou link público
-- public.plan_is_visible(plan_id)
CREATE OR REPLACE FUNCTION public.plan_is_visible(target_plan_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = target_plan_id
      AND (
        p.user_id = auth.uid()
        OR p.privacy = 'link'
        OR EXISTS (
          SELECT 1 FROM public.plan_group_members m
          WHERE m.plan_id = p.id AND m.user_id = auth.uid()
        )
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.plan_is_owner(target_plan_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.plans p WHERE p.id = target_plan_id AND p.user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- plans
DROP POLICY IF EXISTS "Plans are viewable" ON public.plans;
CREATE POLICY "Plans are viewable" ON public.plans
  FOR SELECT USING (public.plan_is_visible(id));

DROP POLICY IF EXISTS "Users create own plans" ON public.plans;
CREATE POLICY "Users create own plans" ON public.plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners update plans" ON public.plans;
CREATE POLICY "Owners update plans" ON public.plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners delete plans" ON public.plans;
CREATE POLICY "Owners delete plans" ON public.plans
  FOR DELETE USING (auth.uid() = user_id);

-- plan_days
DROP POLICY IF EXISTS "Plan days are viewable" ON public.plan_days;
CREATE POLICY "Plan days are viewable" ON public.plan_days
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Owners create plan days" ON public.plan_days;
CREATE POLICY "Owners create plan days" ON public.plan_days
  FOR INSERT WITH CHECK (public.plan_is_owner(plan_id));

DROP POLICY IF EXISTS "Owners update plan days" ON public.plan_days;
CREATE POLICY "Owners update plan days" ON public.plan_days
  FOR UPDATE USING (public.plan_is_owner(plan_id));

DROP POLICY IF EXISTS "Owners delete plan days" ON public.plan_days;
CREATE POLICY "Owners delete plan days" ON public.plan_days
  FOR DELETE USING (public.plan_is_owner(plan_id));

-- plan_progress
DROP POLICY IF EXISTS "Progress is viewable" ON public.plan_progress;
CREATE POLICY "Progress is viewable" ON public.plan_progress
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Users manage own progress" ON public.plan_progress;
CREATE POLICY "Users manage own progress" ON public.plan_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- plan_group_members
DROP POLICY IF EXISTS "Members are viewable" ON public.plan_group_members;
CREATE POLICY "Members are viewable" ON public.plan_group_members
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Users join plans" ON public.plan_group_members;
CREATE POLICY "Users join plans" ON public.plan_group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      public.plan_is_owner(plan_id)
      OR EXISTS (
        SELECT 1 FROM public.plans p
        WHERE p.id = plan_id AND p.privacy IN ('link', 'invite')
      )
    )
  );

DROP POLICY IF EXISTS "Members update own row" ON public.plan_group_members;
CREATE POLICY "Members update own row" ON public.plan_group_members
  FOR UPDATE USING (auth.uid() = user_id OR public.plan_is_owner(plan_id))
  WITH CHECK (auth.uid() = user_id OR public.plan_is_owner(plan_id));

-- impede escalada de privilégio: só o dono do plano altera o campo role
CREATE OR REPLACE FUNCTION public.plan_member_role_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.plan_is_owner(OLD.plan_id) THEN
    RAISE EXCEPTION 'Apenas o criador do plano pode alterar papéis.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS plan_member_role_guard_trg ON public.plan_group_members;
CREATE TRIGGER plan_member_role_guard_trg
  BEFORE UPDATE ON public.plan_group_members
  FOR EACH ROW EXECUTE FUNCTION public.plan_member_role_guard();

-- plan_comments
DROP POLICY IF EXISTS "Comments are viewable" ON public.plan_comments;
CREATE POLICY "Comments are viewable" ON public.plan_comments
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Users comment" ON public.plan_comments;
CREATE POLICY "Users comment" ON public.plan_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors or owner delete comments" ON public.plan_comments;
CREATE POLICY "Authors or owner delete comments" ON public.plan_comments
  FOR DELETE USING (auth.uid() = author_id OR public.plan_is_owner(plan_id));

-- plan_challenges
DROP POLICY IF EXISTS "Challenges are viewable" ON public.plan_challenges;
CREATE POLICY "Challenges are viewable" ON public.plan_challenges
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Members manage challenges" ON public.plan_challenges;
CREATE POLICY "Members manage challenges" ON public.plan_challenges
  FOR ALL USING (public.plan_is_visible(plan_id)) WITH CHECK (public.plan_is_visible(plan_id));

-- plan_unlocks
DROP POLICY IF EXISTS "Unlocks are viewable" ON public.plan_unlocks;
CREATE POLICY "Unlocks are viewable" ON public.plan_unlocks
  FOR SELECT USING (public.plan_is_visible(plan_id));

DROP POLICY IF EXISTS "Owners manage unlocks" ON public.plan_unlocks;
CREATE POLICY "Owners manage unlocks" ON public.plan_unlocks
  FOR ALL USING (public.plan_is_owner(plan_id)) WITH CHECK (public.plan_is_owner(plan_id));

-- =====================================================
-- PRÉVIA
-- =====================================================
-- SELECT * FROM public.plans ORDER BY created_at DESC LIMIT 5;
