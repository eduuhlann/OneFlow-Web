-- 1. TABELA DE PERFIS (Já existente)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GRUPOS DE DISCIPULADO
CREATE TABLE IF NOT EXISTS public.discipleship_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MEMBROS DOS GRUPOS
CREATE TABLE IF NOT EXISTS public.discipleship_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.discipleship_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 4. CONEXÕES UM-A-UM (Líder/Discípulo)
CREATE TABLE IF NOT EXISTS public.discipleship_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active', -- 'pending', 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leader_id, disciple_id)
);

-- 5. NOTAS E MENSAGENS
CREATE TABLE IF NOT EXISTS public.discipleship_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.discipleship_groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TAREFAS E DESAFIOS
CREATE TABLE IF NOT EXISTS public.discipleship_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'reading',
  target_id TEXT, -- JSON string ou ID relacionado
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CÓDIGOS DE CONVITE
CREATE TABLE IF NOT EXISTS public.discipleship_invites (
  leader_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_invites ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS BÁSICAS (Simplificadas para funcionar)
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: Líderes veem tudo, Membros veem nomes
DROP POLICY IF EXISTS "View groups" ON public.discipleship_groups;
CREATE POLICY "View groups" ON public.discipleship_groups FOR SELECT USING (true); -- Permitir ver nomes de grupos evita recursão e é seguro

DROP POLICY IF EXISTS "Leader manage groups" ON public.discipleship_groups;
CREATE POLICY "Leader manage groups" ON public.discipleship_groups FOR ALL USING (leader_id = auth.uid());

-- Group Members: Ver a si mesmo ou ser o líder do grupo
DROP POLICY IF EXISTS "View members" ON public.discipleship_group_members;
CREATE POLICY "View members" ON public.discipleship_group_members FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.discipleship_groups WHERE id = group_id AND leader_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage members" ON public.discipleship_group_members;
CREATE POLICY "Manage members" ON public.discipleship_group_members FOR ALL USING (
  group_id IN (SELECT g.id FROM public.discipleship_groups g WHERE g.leader_id = auth.uid()) OR user_id = auth.uid()
);

-- Connections
DROP POLICY IF EXISTS "View connections" ON public.discipleship_connections;
CREATE POLICY "View connections" ON public.discipleship_connections FOR SELECT USING (leader_id = auth.uid() OR disciple_id = auth.uid());

DROP POLICY IF EXISTS "Manage connections" ON public.discipleship_connections;
CREATE POLICY "Manage connections" ON public.discipleship_connections FOR ALL USING (leader_id = auth.uid() OR disciple_id = auth.uid());

-- Notes
DROP POLICY IF EXISTS "View notes" ON public.discipleship_notes;
CREATE POLICY "View notes" ON public.discipleship_notes FOR SELECT USING (
  author_id = auth.uid() OR leader_id = auth.uid() OR disciple_id = auth.uid() OR 
  group_id IN (SELECT group_id FROM public.discipleship_group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Insert notes" ON public.discipleship_notes;
CREATE POLICY "Insert notes" ON public.discipleship_notes FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Update own notes" ON public.discipleship_notes;
CREATE POLICY "Update own notes" ON public.discipleship_notes FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Delete own notes" ON public.discipleship_notes;
CREATE POLICY "Delete own notes" ON public.discipleship_notes FOR DELETE USING (author_id = auth.uid());

-- Tasks
DROP POLICY IF EXISTS "View tasks" ON public.discipleship_tasks;
CREATE POLICY "View tasks" ON public.discipleship_tasks FOR SELECT USING (leader_id = auth.uid() OR disciple_id = auth.uid());

DROP POLICY IF EXISTS "Manage tasks" ON public.discipleship_tasks;
CREATE POLICY "Manage tasks" ON public.discipleship_tasks FOR ALL USING (leader_id = auth.uid() OR disciple_id = auth.uid());

-- Invites
DROP POLICY IF EXISTS "Manage invites" ON public.discipleship_invites;
CREATE POLICY "Manage invites" ON public.discipleship_invites FOR ALL USING (leader_id = auth.uid());

DROP POLICY IF EXISTS "View invites" ON public.discipleship_invites;
CREATE POLICY "View invites" ON public.discipleship_invites FOR SELECT USING (true);

-- FUNÇÃO E GATILHO PARA NOVOS USUÁRIOS (Corrigido/Garantido)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
