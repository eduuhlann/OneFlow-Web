import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, ChevronRight, Plus, Trash2, Users, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { aiPlansService, type AiPlan } from '../services/features/aiPlansService';
import PageTransition from '../components/PageTransition';
import './library-pages.css';

const Plans: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
    const [aiPlans, setAiPlans] = useState<(AiPlan & { progress: number; memberCount: number })[]>([]);
    const [aiLoading, setAiLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [joiningCode, setJoiningCode] = useState(false);

    const refreshAiPlans = async () => {
        if (!user) {
            setAiPlans([]);
            setAiLoading(false);
            return;
        }
        setAiLoading(true);
        const plans = await aiPlansService.getMyPlans(user.id);
        setAiPlans(plans);
        setAiLoading(false);
    };

    useEffect(() => {
        refreshAiPlans();
    }, [user]);

    const flash = (text: string, tone: 'error' | 'success' = 'success') => {
        setNotice({ text, tone });
        setTimeout(() => setNotice(null), 3200);
    };

    const handleJoinCode = async () => {
        if (!user || !inviteCode.trim()) return;
        setJoiningCode(true);
        const planId = await aiPlansService.joinByCode(user.id, inviteCode);
        setJoiningCode(false);
        if (planId) {
            setInviteCode('');
            navigate(`/plano/${planId}`);
        } else {
            flash('Código inválido ou plano fechado para novos membros.', 'error');
        }
    };

    const handleDeleteAiPlan = async (planId: string) => {
        await aiPlansService.deletePlan(planId);
        await refreshAiPlans();
        setShowConfirmDelete(null);
    };

    return (
        <PageTransition>
            <div className="plans-page min-h-screen bg-[var(--of-bg)] text-white">
                <div className="plans-library mx-auto flex w-full max-w-[1600px] flex-col px-6 pb-32 pt-6 md:px-16 md:pt-10">
                    {/* Header */}
                    <header className="flex items-start justify-between gap-6 pb-5 pt-4 md:pt-6">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => navigate('/dashboard')}
                                title="Voltar"
                                aria-label="Voltar"
                                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--of-border)] bg-[var(--of-surface)] text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white sm:size-14"
                            >
                                <ArrowLeft size={19} strokeWidth={1.75} />
                            </button>

                            <div>
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--of-muted)]">
                                    jornadas
                                </span>
                                <h1 className="mt-2 font-serif text-4xl font-normal leading-none tracking-tight sm:text-6xl">
                                    Meus planos
                                </h1>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/plans/ai-generator')}
                            className="plans-new-button group flex h-12 shrink-0 items-center gap-2 rounded-full border border-transparent bg-white px-7 text-[13px] font-semibold uppercase tracking-[0.16em] text-black transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-primary)] active:scale-95 sm:h-14 sm:px-8"
                        >
                            <Plus size={17} strokeWidth={2} />
                            Novo plano
                        </button>
                    </header>

                    {/* Aviso */}
                    <AnimatePresence>
                        {notice && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className={`mb-10 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-[14px] transition-colors duration-[var(--of-dur)] ${notice.tone === 'error'
                                    ? 'border-[var(--of-border-hover)] text-white'
                                    : 'border-[var(--of-border)] text-[var(--of-secondary)]'
                                    }`}
                            >
                                <span>{notice.text}</span>
                                <button
                                    onClick={() => setNotice(null)}
                                    aria-label="Fechar aviso"
                                    className="shrink-0 text-[var(--of-muted)] transition-colors duration-[var(--of-dur)] hover:text-white"
                                >
                                    <X size={14} strokeWidth={1.75} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="library-intro plans-intro">
                        <p className="library-eyebrow">UM DIA DE CADA VEZ</p>
                        <h2>Crie raízes na <em>Palavra.</em></h2>
                        <p>Um plano para seu momento. Uma caminhada no seu ritmo.</p>
                    </div>
                    <div className="plans-actions-grid">
                        <section className="plans-create rounded-2xl border border-[var(--of-border)] bg-[var(--of-surface)] p-8 md:p-10">
                            <h2 className="font-serif text-2xl font-normal tracking-tight md:text-[28px]">Sua próxima jornada começa aqui</h2>
                            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--of-secondary)]">
                                Uma trilha de estudo criada a partir do seu momento de vida e das suas
                                necessidades espirituais.
                            </p>
                            <button
                                onClick={() => navigate('/plans/ai-generator')}
                                className="plans-create-button mt-6 h-[54px] shrink-0 rounded-full border border-transparent px-8 text-[13px] font-medium tracking-tight transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-primary)] active:scale-[0.98]"
                            >
                                Criar meu plano
                            </button>
                        </section>

                        <section className="plans-invite-card rounded-2xl border border-[var(--of-border)] bg-[var(--of-surface)] p-8 md:p-9">
                            <h2 className="font-serif text-2xl font-normal tracking-tight">Entrar com código</h2>
                            <p className="plans-invite-description">Recebeu um convite? Entre no plano e compartilhe a jornada.</p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-3">
                                <input
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => { if (e.key === 'Enter') handleJoinCode(); }}
                                    placeholder="Digite o código de convite"
                                    maxLength={8}
                                    aria-label="Código de convite"
                                    className="min-w-0 flex-1 rounded-xl border border-[var(--of-border)] bg-[var(--of-surface)] px-5 py-4 font-sans text-[13px] tracking-[0.12em] text-white uppercase placeholder:text-[var(--of-muted)] focus:border-[var(--of-border-hover)] focus:outline-none transition-colors duration-[var(--of-dur)]"
                                />
                                <button
                                    onClick={handleJoinCode}
                                    disabled={joiningCode || !inviteCode.trim()}
                                    className="inline-flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--of-border)] px-6 text-[13px] font-medium tracking-tight text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
                                >
                                    <LogIn size={16} strokeWidth={1.75} />
                                    {joiningCode ? 'Entrando...' : 'Entrar'}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Planos */}
                    <section className="plans-section">
                        <h2 className="library-section-title flex items-center gap-5">
                            Seus planos
                            <span className="h-px flex-1 bg-[var(--of-border)]" />
                        </h2>

                        {aiLoading ? (
                            <div className="py-24 text-center text-[15px] text-[var(--of-muted)]">
                                Carregando seus planos...
                            </div>
                        ) : aiPlans.length === 0 ? (
                            <div className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16">
                                <div className="flex items-center gap-5">
                                    <BookOpen size={40} strokeWidth={1} className="shrink-0 text-[var(--of-muted)]" />
                                    <p className="max-w-sm text-[15px] leading-relaxed text-[var(--of-secondary)]">
                                        Você ainda não tem planos. Comece pela trilha criada para o seu momento.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/plans/ai-generator')}
                                    className="h-[54px] shrink-0 self-start rounded-full border border-[var(--of-border-hover)] px-8 text-[13px] font-medium tracking-tight transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-white/40 hover:bg-[var(--of-surface-hover)] sm:self-auto"
                                >
                                    Criar meu primeiro plano
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6 divide-y divide-[var(--of-border)] border-y border-[var(--of-border)]">
                                {aiPlans.map(plan => (
                                    <motion.div
                                        key={plan.id}
                                        layout
                                        onClick={() => navigate(`/plano/${plan.id}`)}
                                        className="plans-item group flex cursor-pointer items-center gap-6 px-3 py-8 transition-colors duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-surface-hover)] md:py-9"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="truncate font-serif text-xl tracking-tight md:text-2xl">
                                                    {plan.title}
                                                </h3>
                                                {plan.mode === 'grupo' && (
                                                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--of-muted)]">
                                                        <Users size={12} strokeWidth={1.75} />
                                                        {plan.memberCount}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center gap-4">
                                                <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--of-border)]">
                                                    <span
                                                        className="block h-full rounded-full bg-white transition-all duration-500"
                                                        style={{ width: `${Math.min(100, Math.max(0, plan.progress))}%` }}
                                                    />
                                                </span>
                                                <span className="shrink-0 text-[11px] tabular-nums text-[var(--of-muted)]">
                                                    {plan.progress}%
                                                </span>
                                            </div>

                                            <p className="mt-3.5 truncate text-[12px] text-[var(--of-muted)]">
                                                {plan.duration_days} dias
                                                {plan.objective ? ` · ${plan.objective}` : ''}
                                                {plan.privacy === 'link' ? ' · link público' : ''}
                                            </p>
                                        </div>

                                        {plan.user_id === user?.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowConfirmDelete(plan.id);
                                                }}
                                                title="Excluir plano"
                                                aria-label={`Excluir plano ${plan.title}`}
                                                className="shrink-0 rounded-full p-3 text-[var(--of-muted)] opacity-0 transition-all duration-[var(--of-dur)] hover:bg-[var(--of-surface)] hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} strokeWidth={1.75} />
                                            </button>
                                        )}

                                        <ChevronRight
                                            size={18}
                                            strokeWidth={1.75}
                                            className="shrink-0 text-[var(--of-muted)] transition-all duration-[var(--of-dur)] group-hover:translate-x-0.5 group-hover:text-white"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Confirmação de exclusão */}
                <AnimatePresence>
                    {showConfirmDelete && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                onClick={() => setShowConfirmDelete(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.97, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.97, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--of-border)] bg-[var(--of-surface)] p-8 text-center"
                            >
                                <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-[var(--of-border)] bg-[var(--of-surface-hover)]">
                                    <Trash2 size={18} strokeWidth={1.5} className="text-[var(--of-secondary)]" />
                                </span>
                                <h3 className="text-lg font-medium tracking-tight">Remover plano?</h3>
                                <p className="mt-2 text-[13px] leading-relaxed text-[var(--of-secondary)]">
                                    Isso apaga todo o seu progresso neste plano. Esta ação não pode ser desfeita.
                                </p>
                                <div className="mt-7 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowConfirmDelete(null)}
                                        className="h-11 rounded-full border border-[var(--of-border)] text-[12px] font-medium tracking-tight text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAiPlan(showConfirmDelete)}
                                        className="h-11 rounded-full bg-white text-[12px] font-medium tracking-tight text-black transition-all duration-[var(--of-dur)] hover:bg-[var(--of-primary)] active:scale-[0.98]"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default Plans;