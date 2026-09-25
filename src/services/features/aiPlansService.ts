import { supabase } from '../supabase';
import { callGroqChat } from '../ai/groqService';

export type PlanIntensity = 'rapido' | 'normal' | 'profundo' | 'estudo';
export type PlanStyle = 'direto' | 'profundo' | 'devocional' | 'academico' | 'jovem' | 'reflexivo' | 'pratico';
export type PlanMode = 'individual' | 'grupo';
export type PlanPrivacy = 'private' | 'link' | 'invite';
export type PlanFormat = 'leitura' | 'reflexao' | 'oracao' | 'perguntas' | 'aplicacao' | 'desafio' | 'memorizacao' | 'contexto';

export const INTENSITY_LABEL: Record<PlanIntensity, string> = {
    rapido: '5 min/dia',
    normal: '15 min/dia',
    profundo: '30-45 min/dia',
    estudo: '1h+ por dia',
};

export const STYLE_LABEL: Record<PlanStyle, string> = {
    direto: 'Direto',
    profundo: 'Profundo',
    devocional: 'Devocional',
    academico: 'Acadêmico',
    jovem: 'Jovem',
    reflexivo: 'Reflexivo',
    pratico: 'Prático',
};

export const FORMAT_LABEL: Record<PlanFormat, string> = {
    leitura: 'Leitura bíblica',
    reflexao: 'Reflexão',
    oracao: 'Oração',
    perguntas: 'Perguntas',
    aplicacao: 'Aplicação prática',
    desafio: 'Desafio diário',
    memorizacao: 'Memorização',
    contexto: 'Estudo de contexto',
};

export const OBJECTIVES = [
    'Ansiedade', 'Oração', 'Fé', 'Relacionamento', 'Propósito',
    'Disciplina', 'Perdão', 'Liderança', 'Conhecimento bíblico', 'Gratidão',
    'Restauração', 'Testemunho',
] as const;

export interface AiPlan {
    id: string;
    user_id: string;
    title: string;
    description: string;
    cover_url: string | null;
    objective: string | null;
    situation: string | null;
    duration_days: number;
    intensity: PlanIntensity;
    formats: PlanFormat[];
    style: PlanStyle;
    mode: PlanMode;
    privacy: PlanPrivacy;
    invite_code: string | null;
    branching_answers: Record<string, string> | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AiPlanDay {
    id: string;
    plan_id: string;
    day: number;
    title: string;
    reference: string;
    content: string;
    prayer: string;
    context: string;
    practice: string;
    challenge: string;
    memorization: string;
    questions: { question: string; options?: string[]; answer?: number }[];
    difficulty: number;
    is_bonus: boolean;
    version: number;
}

export interface PlanProgress {
    plan_id: string;
    user_id: string;
    day: number;
    completed: boolean;
    completed_at: string | null;
    personal_note: string;
    answers: Record<string, any>;
}

export interface PlanMember {
    id: string;
    plan_id: string;
    user_id: string;
    role: string;
    status: string;
    current_day: number;
    streak: number;
    best_streak: number;
    last_completed_day: number;
    profiles?: { username: string | null; avatar_url: string | null } | null;
}

export interface PlanComment {
    id: string;
    plan_id: string;
    day: number;
    author_id: string;
    content: string;
    is_ai: boolean;
    created_at: string;
    profiles?: { username: string | null; avatar_url: string | null } | null;
}

export interface PlanChallenge {
    id: string;
    plan_id: string;
    title: string;
    target_streak: number;
    current_streak: number;
    best_streak: number;
}

export interface PlanUnlock {
    id: string;
    plan_id: string;
    label: string;
    description: string;
    threshold_percent: number;
    unlocked_at: string;
}

const randomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const aiPlansService = {
    // ---------- CR ----------
    async createPlan(input: {
        userId: string;
        title: string;
        description: string;
        objective: string;
        situation: string;
        durationDays: number;
        intensity: PlanIntensity;
        formats: PlanFormat[];
        style: PlanStyle;
        mode: PlanMode;
        privacy: PlanPrivacy;
        branchingAnswers: Record<string, string>;
        days: Omit<AiPlanDay, 'id' | 'plan_id'>[];
    }): Promise<string> {
        const { data: plan, error } = await supabase
            .from('plans')
            .insert({
                user_id: input.userId,
                title: input.title,
                description: input.description,
                objective: input.objective,
                situation: input.situation,
                duration_days: input.durationDays,
                intensity: input.intensity,
                formats: input.formats,
                style: input.style,
                mode: input.mode,
                privacy: input.privacy,
                invite_code: randomCode(),
                branching_answers: input.branchingAnswers,
            })
            .select()
            .single();

        if (error || !plan) throw error || new Error('Não foi possível criar o plano.');

        if (input.days.length > 0) {
            const { error: daysError } = await supabase
                .from('plan_days')
                .insert(input.days.map(day => ({ ...day, plan_id: plan.id })));

            if (daysError) throw daysError;
        }

        if (input.mode === 'grupo') {
            await supabase.from('plan_group_members').insert({
                plan_id: plan.id,
                user_id: input.userId,
                role: 'owner',
                status: 'active',
            });
        }

        return plan.id;
    },

    async getMyPlans(userId: string): Promise<(AiPlan & { progress: number; memberCount: number })[]> {
        const [plansRes, progressRes, membersRes, myMemberships] = await Promise.all([
            supabase.from('plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('plan_progress').select('plan_id, completed').eq('user_id', userId).eq('completed', true),
            supabase.from('plan_group_members').select('plan_id'),
            supabase.from('plan_group_members').select('plan_id').eq('user_id', userId),
        ]);

        if (plansRes.error) return [];

        const joinedIds = (myMemberships.data || []).map(m => m.plan_id);
        const ownedIds = new Set((plansRes.data || []).map(p => p.id));
        const foreignIds = joinedIds.filter(pid => !ownedIds.has(pid));

        let joinedPlans: AiPlan[] = [];
        if (foreignIds.length > 0) {
            const { data } = await supabase.from('plans').select('*').in('id', foreignIds);
            joinedPlans = (data || []) as AiPlan[];
        }

        const doneByPlan = new Map<string, number>();
        (progressRes.data || []).forEach(p => doneByPlan.set(p.plan_id, (doneByPlan.get(p.plan_id) || 0) + 1));

        const memberCount = new Map<string, number>();
        (membersRes.data || []).forEach(m => memberCount.set(m.plan_id, (memberCount.get(m.plan_id) || 0) + 1));

        const withProgress = (plan: AiPlan) => ({
            ...plan,
            progress: Math.min(100, Math.round(((doneByPlan.get(plan.id) || 0) / Math.max(1, plan.duration_days)) * 100)),
            memberCount: memberCount.get(plan.id) || 0,
        });

        return [...(plansRes.data || []).map(withProgress), ...joinedPlans.map(withProgress)];
    },

    async getPlan(planId: string): Promise<AiPlan | null> {
        const { data, error } = await supabase.from('plans').select('*').eq('id', planId).maybeSingle();
        if (error) return null;
        return data as AiPlan | null;
    },

    async getDays(planId: string): Promise<AiPlanDay[]> {
        const { data, error } = await supabase
            .from('plan_days')
            .select('*')
            .eq('plan_id', planId)
            .order('day', { ascending: true });
        if (error) return [];
        return (data || []) as AiPlanDay[];
    },

    async getDay(planId: string, day: number): Promise<AiPlanDay | null> {
        const { data } = await supabase
            .from('plan_days')
            .select('*')
            .eq('plan_id', planId)
            .eq('day', day)
            .maybeSingle();
        return (data as AiPlanDay) || null;
    },

    async updateDay(planId: string, day: number, patch: Partial<AiPlanDay>): Promise<void> {
        const { error } = await supabase
            .from('plan_days')
            .update(patch)
            .eq('plan_id', planId)
            .eq('day', day);
        if (error) throw error;
    },

    async deleteDay(planId: string, day: number): Promise<void> {
        const { error } = await supabase.from('plan_days').delete().eq('plan_id', planId).eq('day', day);
        if (error) throw error;
    },

    async addDay(planId: string, day: Omit<AiPlanDay, 'id' | 'plan_id'>): Promise<void> {
        const { error } = await supabase.from('plan_days').insert({ ...day, plan_id: planId });
        if (error) throw error;
    },

    async updatePlan(planId: string, patch: Partial<AiPlan>): Promise<void> {
        const { error } = await supabase.from('plans').update(patch).eq('id', planId);
        if (error) throw error;
    },

    async deletePlan(planId: string): Promise<void> {
        const { error } = await supabase.from('plans').delete().eq('id', planId);
        if (error) throw error;
    },

    // ---------- Progresso ----------
    async getProgress(planId: string, userId: string): Promise<PlanProgress[]> {
        const { data } = await supabase
            .from('plan_progress')
            .select('*')
            .eq('plan_id', planId)
            .eq('user_id', userId);
        return (data || []) as PlanProgress[];
    },

    async setDayCompleted(planId: string, userId: string, day: number, completed: boolean, note = ''): Promise<void> {
        const { error } = await supabase.from('plan_progress').upsert({
            plan_id: planId,
            user_id: userId,
            day,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            personal_note: note,
        }, { onConflict: 'plan_id,user_id,day' });
        if (error) throw error;
    },

    async saveNote(planId: string, userId: string, day: number, note: string): Promise<void> {
        const { data: existing } = await supabase
            .from('plan_progress')
            .select('id, completed')
            .eq('plan_id', planId).eq('user_id', userId).eq('day', day).maybeSingle();

        if (existing) {
            await supabase.from('plan_progress').update({ personal_note: note }).eq('id', existing.id);
        } else {
            await supabase.from('plan_progress').insert({ plan_id: planId, user_id: userId, day, personal_note: note });
        }
    },

    async getCompletionRatio(planId: string, userId: string): Promise<{ done: number; total: number; percent: number }> {
        const [progress, plan] = await Promise.all([this.getProgress(planId, userId), this.getPlan(planId)]);
        const total = plan?.duration_days || 0;
        const done = progress.filter(p => p.completed).length;
        return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
    },

    // ---------- Grupo ----------
    async getMembers(planId: string): Promise<PlanMember[]> {
        const { data } = await supabase
            .from('plan_group_members')
            .select('*, profiles:user_id (username, avatar_url)')
            .eq('plan_id', planId)
            .order('joined_at', { ascending: true });
        return (data || []) as PlanMember[];
    },

    async isMember(userId: string, planId: string): Promise<boolean> {
        const { data } = await supabase
            .from('plan_group_members')
            .select('id')
            .eq('plan_id', planId)
            .eq('user_id', userId)
            .maybeSingle();
        return !!data;
    },

    async joinByCode(userId: string, code: string): Promise<string | null> {
        const clean = code.trim().toUpperCase();
        const { data: plan } = await supabase
            .from('plans')
            .select('id, privacy, mode')
            .eq('invite_code', clean)
            .maybeSingle();

        if (!plan) return null;
        if (plan.privacy === 'private') return null;

        const { error } = await supabase
            .from('plan_group_members')
            .upsert({ plan_id: plan.id, user_id: userId, role: 'member', status: 'active' }, { onConflict: 'plan_id,user_id' });

        if (error) throw error;
        return plan.id;
    },

    async joinById(userId: string, planId: string): Promise<void> {
        const { error } = await supabase
            .from('plan_group_members')
            .upsert({ plan_id: planId, user_id: userId, role: 'member', status: 'active' }, { onConflict: 'plan_id,user_id' });
        if (error) throw error;
    },

    async removeMember(planId: string, userId: string): Promise<void> {
        const { error } = await supabase.from('plan_group_members').delete().eq('plan_id', planId).eq('user_id', userId);
        if (error) throw error;
    },

    async updateMemberDay(planId: string, userId: string, day: number, streak: number, bestStreak: number): Promise<void> {
        await supabase.from('plan_group_members')
            .update({ current_day: day, streak, best_streak: bestStreak, last_completed_day: day })
            .eq('plan_id', planId).eq('user_id', userId);
    },

    // ---------- Comentários ----------
    async getComments(planId: string, day: number): Promise<PlanComment[]> {
        const { data } = await supabase
            .from('plan_comments')
            .select('*, profiles:author_id (username, avatar_url)')
            .eq('plan_id', planId)
            .eq('day', day)
            .order('created_at', { ascending: true });
        return (data || []) as PlanComment[];
    },

    async addComment(planId: string, day: number, authorId: string, content: string, isAi = false): Promise<void> {
        const { error } = await supabase.from('plan_comments').insert({
            plan_id: planId, day, author_id: authorId, content, is_ai: isAi,
        });
        if (error) throw error;
    },

    async deleteComment(commentId: string): Promise<void> {
        await supabase.from('plan_comments').delete().eq('id', commentId);
    },

    // ---------- Desafio coletivo ----------
    async getChallenges(planId: string): Promise<PlanChallenge[]> {
        const { data } = await supabase.from('plan_challenges').select('*').eq('plan_id', planId).order('created_at', { ascending: false });
        return (data || []) as PlanChallenge[];
    },

    async createChallenge(planId: string, userId: string, title: string, targetStreak: number): Promise<void> {
        await supabase.from('plan_challenges').insert({
            plan_id: planId, title, target_streak: targetStreak, created_by: userId,
        });
    },

    async updateChallengeProgress(challengeId: string, currentStreak: number): Promise<void> {
        await supabase.from('plan_challenges')
            .update({ current_streak: currentStreak, best_streak: Math.max(currentStreak, 0) })
            .eq('id', challengeId);
    },

    // ---------- Desbloqueios ----------
    async getUnlocks(planId: string): Promise<PlanUnlock[]> {
        const { data } = await supabase.from('plan_unlocks').select('*').eq('plan_id', planId);
        return (data || []) as PlanUnlock[];
    },

    async createUnlock(planId: string, label: string, description: string, thresholdPercent: number): Promise<void> {
        await supabase.from('plan_unlocks').insert({
            plan_id: planId, label, description, threshold_percent: thresholdPercent,
        });
    },

    // ---------- IA ----------
    async generatePlanContent(input: {
        title: string;
        situation: string;
        objective: string;
        durationDays: number;
        intensity: PlanIntensity;
        formats: PlanFormat[];
        style: PlanStyle;
        branchingAnswers: Record<string, string>;
    }): Promise<{ title: string; description: string; coverPrompt: string; days: Omit<AiPlanDay, 'id' | 'plan_id'>[] }> {
        const formatList = input.formats.map(f => FORMAT_LABEL[f]).join(', ') || 'leitura bíblica, reflexão e aplicação prática';
        const branchText = Object.keys(input.branchingAnswers).length > 0
            ? Object.entries(input.branchingAnswers).map(([k, v]) => `- ${k}: ${v}`).join('\n')
            : '- (sem ramificações)';

        const systemPrompt = `Você é o designer de planos de estudo do OneFlow (app cristão).
Crie um plano de leitura de EXATAMENTE ${input.durationDays} DIAS.

TÍTULO PEDIDO: "${input.title}"
OBJETIVO ESPIRITUAL: ${input.objective || 'não informado'}
SITUAÇÃO ESPECÍFICA: ${input.situation || 'não informada'}
TEMPO POR DIA: ${INTENSITY_LABEL[input.intensity]}
ESTILO DE ESCRITA: ${STYLE_LABEL[input.style]}
COMPONENTES OBRIGATÓRIOS: ${formatList}

RAMIFICAÇÕES DEFINIDAS PELO USUÁRIO (siga exatamente):
${branchText}

REGRAS:
- Cada dia deve ter referência bíblica real e coerente com a progressão do plano.
- difficulty: 1 (leve), 2 (médio), 3 (profundo), acompanhando o nível do dia.
- questions: 2 a 3 perguntas de aplicação, sem gabarito.
- memorization: um versículo curto para decorar OU "n/a" se o formato não incluir memorização.
- Não use emoji. Escreva em português do Brasil.
- Se a situação indicar um livro específico (ex: "estudar Romanos"), use a progressão desse livro.

RETORNE APENAS JSON VÁLIDO, sem texto antes ou depois:
{
  "title": "nome do plano, até 5 palavras",
  "description": "descrição de até 20 palavras",
  "coverPrompt": "frase curta descrevendo a capa visual do plano",
  "days": [
    {
      "day": 1,
      "title": "título do dia",
      "reference": "Livro Capítulo:Versículo",
      "content": "reflexão de 60 a 120 palavras",
      "prayer": "oração de 1 parágrafo",
      "context": "contexto histórico ou literário em 2-3 frases",
      "practice": "ação prática concreta começando com verbo no imperativo",
      "challenge": "desafio do dia",
      "memorization": "versículo para decorar ou n/a",
      "questions": [{ "question": "pergunta de aplicação" }],
      "difficulty": 1
    }
  ]
}`;

        const response = await callGroqChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Gere agora o plano de ${input.durationDays} dias.` },
            ],
            undefined,
            { json: true, temperature: 0.8, maxTokens: 32000 }
        );

        let parsed: any;
        try {
            parsed = JSON.parse(response);
        } catch {
            const match = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('A IA não retornou um plano legível.');
            parsed = JSON.parse(match[1] || match[0]);
        }

        if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
            throw new Error('A IA não retornou nenhum dia de estudo.');
        }

        return {
            title: parsed.title || input.title,
            description: parsed.description || '',
            coverPrompt: parsed.coverPrompt || '',
            days: parsed.days.map((day: any, index: number) => ({
                day: index + 1,
                title: day.title || `Dia ${index + 1}`,
                reference: day.reference || '',
                content: day.content || '',
                prayer: day.prayer || '',
                context: day.context || '',
                practice: day.practice || '',
                challenge: day.challenge || '',
                memorization: day.memorization || 'n/a',
                questions: Array.isArray(day.questions) ? day.questions : [],
                difficulty: Number(day.difficulty) || 1,
                is_bonus: false,
                version: 1,
            })),
        };
    },

    async regenerateDay(plan: AiPlan, day: AiPlanDay, reason: string): Promise<Partial<AiPlanDay>> {
        const systemPrompt = `Você é o designer de planos do OneFlow.
O usuário não gostou do estudo do dia ${day.day} do plano "${plan.title}" (${reason}).
Gere uma NOVA versão desse mesmo dia, mantendo o objetivo original do plano.

CONTEXTO DO PLANO:
- Objetivo: ${plan.objective || 'não informado'}
- Situação: ${plan.situation || 'não informada'}
- Estilo: ${STYLE_LABEL[plan.style] || plan.style}
- Tempo por dia: ${INTENSITY_LABEL[plan.intensity] || plan.intensity}
- Componentes: ${(plan.formats || []).map(f => FORMAT_LABEL[f] || f).join(', ')}
- Leitura original: ${day.reference}

RETORNE APENAS JSON VÁLIDO:
{
  "title": "", "reference": "", "content": "", "prayer": "", "context": "",
  "practice": "", "challenge": "", "memorization": "", "questions": [{ "question": "" }], "difficulty": 1
}`;

        const response = await callGroqChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Refaça o dia ${day.day}. Motivo: ${reason}` },
            ],
            undefined,
            { json: true, temperature: 0.9, maxTokens: 4096 }
        );

        let parsed: any;
        try {
            parsed = JSON.parse(response);
        } catch {
            const match = response.match(/```json\n([\s\S]*)\n```/) || response.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('A IA não retornou uma versão válida.');
            parsed = JSON.parse(match[1] || match[0]);
        }

        return {
            title: parsed.title ?? day.title,
            reference: parsed.reference ?? day.reference,
            content: parsed.content ?? day.content,
            prayer: parsed.prayayer ?? parsed.prayer ?? day.prayer,
            context: parsed.context ?? day.context,
            practice: parsed.practice ?? day.practice,
            challenge: parsed.challenge ?? day.challenge,
            memorization: parsed.memorization ?? day.memorization,
            questions: Array.isArray(parsed.questions) ? parsed.questions : day.questions,
            difficulty: Number(parsed.difficulty) || day.difficulty,
            version: (day.version || 1) + 1,
        };
    },

    async continuePlan(plan: AiPlan, userId: string): Promise<{ title: string; description: string; day: Omit<AiPlanDay, 'id' | 'plan_id'> }> {
        const [progress, notes] = await Promise.all([
            this.getProgress(plan.id, userId),
            supabase.from('plan_progress').select('day, personal_note').eq('plan_id', plan.id).eq('user_id', userId).not('personal_note', 'is', null),
        ]);

        const done = progress.filter(p => p.completed).map(p => p.day).sort((a, b) => a - b);
        const reflections = (notes.data || []).slice(-5).map(n => `Dia ${n.day}: ${n.personal_note}`).join('\n');

        const systemPrompt = `Você é o mentor do OneFlow.
O usuário terminou (ou parou em) o plano "${plan.title}" (objetivo: ${plan.objective || 'não informado'}).
Dias concluídos: ${done.length > 0 ? done.join(', ') : 'nenhum'}

Notas escritas pelo usuário:
${reflections || '(nenhuma nota)'}

Crie a PRÓXIMA etapa: um novo bloco de 7 dias que continua a jornada a partir do ponto em que ele parou,
aprofundando o que foi mais fraco e renovando o que já funcionou.

RETORNE APENAS JSON VÁLIDO:
{
  "title": "nome da próxima etapa, até 5 palavras",
  "description": "até 20 palavras",
  "day": {
    "day": 1, "title": "", "reference": "", "content": "", "prayer": "",
    "context": "", "practice": "", "challenge": "", "memorization": "",
    "questions": [{ "question": "" }], "difficulty": 1
  }
}`;

        const response = await callGroqChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Crie a próxima etapa do meu plano.' },
            ],
            undefined,
            { json: true, temperature: 0.8, maxTokens: 4096 }
        );

        let parsed: any;
        try {
            parsed = JSON.parse(response);
        } catch {
            const match = response.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('A IA não retornou uma continuação válida.');
            parsed = JSON.parse(match[0]);
        }

        return {
            title: parsed.title || `Continuação: ${plan.title}`,
            description: parsed.description || '',
            day: {
                day: 1,
                title: parsed.day?.title || 'Próximo estudo',
                reference: parsed.day?.reference || '',
                content: parsed.day?.content || '',
                prayer: parsed.day?.prayer || '',
                context: parsed.day?.context || '',
                practice: parsed.day?.practice || '',
                challenge: parsed.day?.challenge || '',
                memorization: parsed.day?.memorization || 'n/a',
                questions: Array.isArray(parsed.day?.questions) ? parsed.day.questions : [],
                difficulty: Number(parsed.day?.difficulty) || 2,
                is_bonus: false,
                version: 1,
            },
        };
    },

    async moderateDay(plan: AiPlan, day: AiPlanDay, comments: PlanComment[]): Promise<string> {
        const humanComments = comments.filter(c => !c.is_ai);
        if (humanComments.length === 0) return '';

        const systemPrompt = `Você é a IA moderadora de um grupo de estudo do OneFlow.
Plano: "${plan.title}" (objetivo: ${plan.objective || 'não informado'})
Leitura do dia ${day.day}: ${day.reference} - ${day.title}

Respostas do grupo:
${humanComments.map(c => `- ${c.profiles?.username || 'Alguém'}: ${c.content}`).join('\n')}

Escreva uma síntese de 2 a 4 frases destacando os temas mais citados.
Não responda cada pessoa individualmente, não julgue e não substitua a conversa do grupo.
Comece com "Hoje vocês destacaram". Sem emoji.`;

        return callGroqChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Faça a síntese das respostas de hoje.' },
            ],
            undefined,
            { temperature: 0.7, maxTokens: 400 }
        );
    },

    async adaptDifficulty(plan: AiPlan, userId: string): Promise<{ direction: 'up' | 'down' | 'keep'; reason: string }> {
        const { done, total } = await this.getCompletionRatio(plan.id, userId);
        if (total === 0) return { direction: 'keep', reason: 'Sem progresso suficiente ainda.' };

        const percent = done / total;
        if (percent >= 0.8) return { direction: 'up', reason: 'Você está voando — vale aprofundar.' };
        if (percent <= 0.2 && total > 3) return { direction: 'down', reason: 'Vamos simplificar um pouco.' };
        return { direction: 'keep', reason: 'Seu ritmo está saudável.' };
    },

    async getGroupCompletion(planId: string): Promise<{ percent: number; membersDone: number; totalMembers: number }> {
        const [members, progress] = await Promise.all([
            this.getMembers(planId),
            supabase.from('plan_progress').select('user_id, completed').eq('plan_id', planId).eq('completed', true),
        ]);

        const doneUsers = new Set((progress.data || []).map(p => p.user_id));
        return {
            percent: members.length ? Math.round((doneUsers.size / members.length) * 100) : 0,
            membersDone: doneUsers.size,
            totalMembers: members.length,
        };
    },
};
