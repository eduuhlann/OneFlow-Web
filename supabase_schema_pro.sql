-- =====================================================
-- OneFlow Pro - ASSINATURAS
-- Execute no Supabase → SQL Editor.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'oneflow_pro',
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive' | 'canceled' | 'expired' | 'refunded'
  lastlink_subscription_id TEXT,
  lastlink_product_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, plan)
);

-- RLS: usuário só pode ler a própria assinatura
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- A escrita é feita pela Edge Function (service role), que ignora RLS.
DROP POLICY IF EXISTS "No insert policy for subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "No update policy for subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "No delete policy for subscriptions" ON public.subscriptions;