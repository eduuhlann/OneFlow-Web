import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, Check, Flame, LogIn, MessageSquare, Pencil, RefreshCw, Share2, Users, X,
} from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/Loading';
import { aiPlansService, STYLE_LABEL, type AiPlan, type AiPlanDay, type PlanProgress } from '../services/features/aiPlansService';
import { DayContent } from '../components/plans/DayContent';
import { DayEditor } from '../components/plans/DayEditor';
import { CommentsSection } from '../components/plans/CommentsSection';
import { GroupPanel } from '../components/plans/GroupPanel';
import { cn } from '../components/plans/planUtils';

type Tab = 'estudo' | 'conversa' | 'grupo';

const calcStreak = (progress: PlanProgress[], from: number): number => {
    const done = new Set(progress.filter(p => p.completed).map(p => p.day));
    let streak = 0;
    for (let d = from; d >= 1; d--) {
        if (done.has(d)) streak++;
        else break;
    }
    return streak;
};

export default function PlanView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [plan, setPlan] = useState<AiPlan | null>(null);
    const [days, setDays] = useState<AiPlanDay[]>([]);
    const [progress, setProgress] = useState<PlanProgress[]>([]);
    const [currentDay, setCurrentDay] = useState(1);
    const [tab, setTab] = useState<Tab>('estudo');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    const [note, setNote] = useState('');
    const [isMember, setIsMember] = useState(false);
    const [showRegen, setShowRegen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [regenReason, setRegenReason] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [continuing, setContinuing] = useState(false);

    const isOwner = !!plan && !!user && plan.user_id === user.id;
    const canReadFull = isOwner || isMember;

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        const found = await aiPlansService.getPlan(id);
        if (!found) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        setPlan(found);
        const planDays = await aiPlansService.getDays(id);
        setDays(planDays);
        const prog = user ? await aiPlansService.getProgress(id, user.id) : [];
        setProgress(prog);
        setIsMember(user ? (found.user_id === user.id || await aiPlansService.isMember(user.id, id)) : false);
        if (planDays.length > 0) {
            const doneSet = new Set(prog.filter(p => p.completed).map(p => p.day));
            let target = 1;
            while (doneSet.has(target) && target < planDays.length) target++;
            setCurrentDay(target);
        }
        setLoading(false);
    }, [id, user]);

    useEffect(() => { load(); }, [load]);

    const day = useMemo(() => days.find(d => d.day === currentDay) || null, [days, currentDay]);
    const isDone = useMemo(() => progress.some(p => p.day === currentDay && p.completed), [progress, currentDay]);
    const streak = useMemo(() => calcStreak(progress, currentDay), [progress, currentDay]);
    const doneCount = useMemo(() => progress.filter(p => p.completed).length, [progress]);

    useEffect(() => {
        const current = progress.find(p => p.day === currentDay);
        setNote(current?.personal_note || '');
    }, [currentDay, progress]);

    const handleJoin = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        setJoining(true);
        await aiPlansService.joinById(user.id, id!);
        await load();
        setJoining(false);
    };

    const handleJoinByCode = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        setJoining(true);
        const planId = await aiPlansService.joinByCode(user.id, joinCode);
        setJoining(false);
        if (planId) {
            navigate(`/plano/${planId}`);
        } else {
            setError('Código inválido ou plano fechado para novos membros.');
        }
    };

    const handleToggleComplete = async () => {
        if (!user || !plan) return;
        await aiPlansService.setDayCompleted(plan.id, user.id, currentDay, !isDone, note);
        const fresh = await aiPlansService.getProgress(plan.id, user.id);
        setProgress(fresh);

        if (!isDone) {
            const newStreak = calcStreak(fresh, currentDay);
            await aiPlansService.updateMemberDay(plan.id, user.id, currentDay, newStreak, newStreak);

            const total = plan.duration_days || days.length;
            const percent = Math.round((fresh.filter(p => p.completed).length / Math.max(1, total)) * 100);
            if (percent >= 80) {
                const unlocks = await aiPlansService.getUnlocks(plan.id);
                if (unlocks.length === 0) {
                    await aiPlansService.createUnlock(
                        plan.id,
                        'Conteúdo bônus liberado',
                        'Você passou de 80% do plano. A IA pode gerar a próxima etapa com o que você aprendeu.',
                        80
                    );
                }
            }
            if (currentDay < days.length) setCurrentDay(currentDay + 1);
        }
    };

    const handleSaveNote = async () => {
        if (!user || !plan) return;
        const current = progress.find(p => p.day === currentDay);
        if ((current?.personal_note || '') === note) return;
        await aiPlansService.saveNote(plan.id, user.id, currentDay, note);
        setProgress(await aiPlansService.getProgress(plan.id, user.id));
    };

    const handleSaveEdit = async (patch: Partial<AiPlanDay>) => {
        if (!plan || !day) return;
        setSaving(true);
        await aiPlansService.updateDay(plan.id, day.day, patch);
        setDays(await aiPlansService.getDays(plan.id));
        setSaving(false);
        setEditing(false);
    };

    const handleRegenerate = async () => {
        if (!plan || !day) return;
        setRegenerating(true);
        try {
            const patch = await aiPlansService.regenerateDay(plan, day, regenReason || 'quero algo diferente');
            await aiPlansService.updateDay(plan.id, day.day, patch);
            setDays(await aiPlansService.getDays(plan.id));
            setShowRegen(false);
            setRegenReason('');
        } catch (e: any) {
            setError('A IA não conseguiu refazer este dia agora.');
        } finally {
            setRegenerating(false);
        }
    };

    const handleContinue = async () => {
        if (!plan || !user) return;
        setContinuing(true);
        try {
            const next = await aiPlansService.continuePlan(plan, user.id);
            const newId = await aiPlansService.createPlan({
                userId: user.id,
                title: next.title,
                description: next.description,
                objective: plan.objective || '',
                situation: plan.situation || '',
                durationDays: 7,
                intensity: plan.intensity,
                formats: plan.formats || [],
                style: plan.style,
                mode: 'individual',
                privacy: 'private',
                branchingAnswers: plan.branching_answers || {},
                days: [next.day],
            });
            navigate(`/plano/${newId}`);
        } catch {
            setError('A IA não conseguiu continuar seu plano agora.');
        } finally {
            setContinuing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loading fullScreen={false} />
            </div>
        );
    }

    if (notFound || !plan) {
        return (
            <div className="min-h-screen bg-black text-white font-serif flex flex-col items-center justify-center px-6 gap-6 text-center">
                <BookOpen size={40} className="text-white/30" />
                <h1 className="text-2xl font-bold">Plano não encontrado</h1>
                <p className="text-white/40 italic">Ele pode ter sido removido ou o link está incorreto.</p>
                <button onClick={() => navigate('/plans')} className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase">
                    Voltar
                </button>
            </div>
        );
    }

    const publicPreview = !canReadFull;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-serif relative">
            <ParticleBackground />

            <header className="fixed top-0 left-0 right-0 p-5 md:p-8 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate('/plans')}
                    className="pointer-events-auto flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-[10px] tracking-[0.3em] uppercase hidden sm:inline">Voltar</span>
                </button>
                <div className="flex items-center gap-4">
                    {canReadFull && (
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/plano/${plan.id}`;
                                navigator.clipboard?.writeText(url);
                            }}
                            className="pointer-events-auto text-white/40 hover:text-white transition-colors"
                            title="Copiar link do plano"
                        >
                            <Share2 size={18} />
                        </button>
                    )}
                </div>
            </header>

            <main className="relative z-10 px-5 md:px-8 pt-24 pb-32 max-w-3xl mx-auto">
                <div className="mb-10 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                        {plan.duration_days} dias · {STYLE_LABEL[plan.style] || plan.style}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{plan.title}</h1>
                    {plan.description && (
                        <p className="text-white/50 italic text-lg leading-relaxed">{plan.description}</p>
                    )}
                </div>

                {publicPreview ? (
                    <div className="space-y-10">
                        <div className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Prévia do plano</p>
                            <p className="text-sm text-white/60 font-serif leading-relaxed">
                                Este é um plano compartilhado. Entre para acompanhar seu progresso, comentar com o grupo
                                e receber as próximas etapas.
                            </p>
                        </div>

                        {day && (
                            <div className="opacity-60 pointer-events-none select-none">
                                <DayContent day={day} />
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <LogIn size={16} /> {joining ? 'Entrando...' : 'Entrar no plano'}
                            </button>

                            <div className="flex gap-2">
                                <input
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="CÓDIGO"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center text-sm tracking-[0.3em] font-serif text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={handleJoinByCode}
                                    disabled={joining || !joinCode.trim()}
                                    className="px-6 border border-white/15 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
                                >
                                    Entrar com código
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-xs text-white/40 italic">{error}</p>}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                            {days.map(d => {
                                const done = progress.some(p => p.day === d.day && p.completed);
                                const active = d.day === currentDay;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setCurrentDay(d.day)}
                                        className={cn(
                                            'shrink-0 w-11 h-11 rounded-2xl border text-xs font-serif transition-all',
                                            active ? 'bg-white text-black border-white' : done ? 'border-white/40 text-white' : 'border-white/10 text-white/40'
                                        )}
                                    >
                                        {done && !active ? <Check size={14} className="mx-auto" /> : d.day}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-5 mb-10 text-[10px] uppercase tracking-[0.2em] text-white/40">
                            <span className="flex items-center gap-2"><Check size={12} /> {doneCount}/{plan.duration_days} concluídos</span>
                            {streak > 0 && <span className="flex items-center gap-2"><Flame size={12} /> {streak} {streak === 1 ? 'dia' : 'dias'} seguidos</span>}
                        </div>

                        <div className="flex items-center gap-2 mb-10 border-b border-white/10 pb-4">
                            {([
                                { id: 'estudo', label: 'Estudo', icon: BookOpen },
                                { id: 'conversa', label: 'Conversa', icon: MessageSquare },
                                { id: 'grupo', label: 'Grupo', icon: Users },
                            ] as { id: Tab; label: string; icon: any }[]).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors',
                                        tab === t.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                                    )}
                                >
                                    <t.icon size={13} /> {t.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {tab === 'estudo' && (
                                <motion.div key="estudo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                                    {day ? (
                                        editing ? (
                                            <DayEditor day={day} onSave={handleSaveEdit} onCancel={() => setEditing(false)} saving={saving} />
                                        ) : (
                                            <>
                                                <DayContent day={day} />

                                                {isOwner && (
                                                    <div className="flex flex-wrap gap-3">
                                                        <button
                                                            onClick={() => setEditing(true)}
                                                            className="px-5 py-3 border border-white/15 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center gap-2"
                                                        >
                                                            <Pencil size={13} /> Editar dia
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowRegen(!showRegen); setRegenReason(''); }}
                                                            className="px-5 py-3 border border-white/15 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center gap-2"
                                                        >
                                                            <RefreshCw size={13} /> Refazer este dia
                                                        </button>
                                                    </div>
                                                )}

                                                {isOwner && showRegen && (
                                                    <div className="space-y-3 p-6 rounded-3xl border border-white/10">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Por que refazer?</p>
                                                        <input
                                                            value={regenReason}
                                                            onChange={(e) => setRegenReason(e.target.value)}
                                                            placeholder="Ex: muito longo, quero algo mais prático"
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-serif text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                                                        />
                                                        <button
                                                            onClick={handleRegenerate}
                                                            disabled={regenerating}
                                                            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                                                            {regenerating ? 'Refazendo...' : 'Gerar nova versão'}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Sua reflexão</p>
                                                    <textarea
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        onBlur={handleSaveNote}
                                                        rows={3}
                                                        placeholder="O que Deus falou com você hoje?"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-serif text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={handleToggleComplete}
                                                        className={cn(
                                                            'flex-1 py-5 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase transition-colors',
                                                            isDone ? 'border border-white/20 text-white/60 hover:bg-white/5' : 'bg-white text-black hover:bg-gray-200'
                                                        )}
                                                    >
                                                        {isDone ? 'Desmarcar dia' : 'Concluir dia'}
                                                    </button>
                                                    {currentDay > 1 && (
                                                        <button
                                                            onClick={() => setCurrentDay(currentDay - 1)}
                                                            className="px-8 py-5 border border-white/15 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                                        >
                                                            Anterior
                                                        </button>
                                                    )}
                                                    {currentDay < days.length && (
                                                        <button
                                                            onClick={() => setCurrentDay(currentDay + 1)}
                                                            className="px-8 py-5 border border-white/15 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                                        >
                                                            Próximo
                                                        </button>
                                                    )}
                                                </div>

                                                {doneCount >= plan.duration_days && (
                                                    <div className="space-y-4 p-6 rounded-3xl border border-white/20 bg-white/5">
                                                        <BookOpen size={20} className="text-white/60" />
                                                        <p className="font-serif text-lg">Você terminou. E agora?</p>
                                                        <p className="text-sm text-white/50 font-serif italic">
                                                            A IA pode criar a próxima etapa olhando o que você concluiu e o que escreveu nas reflexões.
                                                        </p>
                                                        <button
                                                            onClick={handleContinue}
                                                            disabled={continuing}
                                                            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                        >
                                                            {continuing ? 'Preparando...' : 'Continuar meu plano'}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    ) : (
                                        <p className="text-white/30 italic">Este plano ainda não tem dias gerados.</p>
                                    )}
                                </motion.div>
                            )}

                            {tab === 'conversa' && (
                                <motion.div key="conversa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    {day && <CommentsSection plan={plan} day={day} userId={user?.id || null} canInteract={!!user} />}
                                </motion.div>
                            )}

                            {tab === 'grupo' && (
                                <motion.div key="grupo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    {user && <GroupPanel plan={plan} userId={user.id} isOwner={isOwner} />}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <button
                                onClick={() => setError(null)}
                                className="mt-8 flex items-center gap-2 text-xs text-white/40 italic hover:text-white transition-colors"
                            >
                                <X size={12} /> {error}
                            </button>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
