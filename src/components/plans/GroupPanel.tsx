import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Gift, Link2, Target, TrendingUp, UserMinus } from 'lucide-react';
import {
    aiPlansService,
    type AiPlan,
    type PlanChallenge,
    type PlanMember,
    type PlanUnlock,
} from '../../services/features/aiPlansService';
import { cn } from './planUtils';

export const GroupPanel = ({ plan, userId, isOwner }: { plan: AiPlan; userId: string; isOwner: boolean }) => {
    const [members, setMembers] = useState<PlanMember[]>([]);
    const [challenges, setChallenges] = useState<PlanChallenge[]>([]);
    const [unlocks, setUnlocks] = useState<PlanUnlock[]>([]);
    const [groupStats, setGroupStats] = useState({ percent: 0, membersDone: 0, totalMembers: 0 });
    const [copied, setCopied] = useState<string | null>(null);
    const [newChallenge, setNewChallenge] = useState('');
    const [challengeDays, setChallengeDays] = useState('7');
    const [advice, setAdvice] = useState('');

    const load = useCallback(async () => {
        const [m, c, u, s] = await Promise.all([
            aiPlansService.getMembers(plan.id),
            aiPlansService.getChallenges(plan.id),
            aiPlansService.getUnlocks(plan.id),
            aiPlansService.getGroupCompletion(plan.id),
        ]);
        setMembers(m);
        setChallenges(c);
        setUnlocks(u);
        setGroupStats(s);
    }, [plan.id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        aiPlansService.adaptDifficulty(plan, userId)
            .then(result => setAdvice(`${result.reason} (sugestão: ${result.direction === 'up' ? 'aprofundar' : result.direction === 'down' ? 'simplificar' : 'manter'}).`))
            .catch(() => setAdvice(''));
    }, [plan, userId]);

    const copy = async (value: string, tag: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(tag);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            setCopied(null);
        }
    };

    const shareLink = `${window.location.origin}/plano/${plan.id}`;

    const handleCreateChallenge = async () => {
        if (!newChallenge.trim()) return;
        await aiPlansService.createChallenge(plan.id, userId, newChallenge.trim(), Math.max(1, parseInt(challengeDays) || 7));
        setNewChallenge('');
        load();
    };

    return (
        <div className="space-y-12">
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/">Compartilhar</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        onClick={() => copy(plan.invite_code || '', 'code')}
                        className="p-5 rounded-3xl border border-white/10 bg-white/5 text-left hover:border-white/30 transition-colors"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/ mb-2">Código de convite</p>
                        <p className="text-2xl font-serif tracking-[0.3em]">{plan.invite_code}</p>
                        <p className="text-[10px] text-white/ mt-2 flex items-center gap-1">
                            {copied === 'code' ? <Check size={12} /> : <Copy size={12} />}
                            {copied === 'code' ? 'Copiado' : 'Copiar código'}
                        </p>
                    </button>
                    <button
                        onClick={() => copy(shareLink, 'link')}
                        className="p-5 rounded-3xl border border-white/10 bg-white/5 text-left hover:border-white/30 transition-colors"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/ mb-2">Link do plano</p>
                        <p className="text-sm font-serif text-white/70 truncate">{shareLink}</p>
                        <p className="text-[10px] text-white/ mt-2 flex items-center gap-1">
                            {copied === 'link' ? <Check size={12} /> : <Link2 size={12} />}
                            {copied === 'link' ? 'Copiado' : 'Copiar link'}
                        </p>
                    </button>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/">Progresso do grupo</h3>
                    <span className="text-xs text-white/ font-serif">
                        {groupStats.membersDone}/{groupStats.totalMembers} iniciaram
                    </span>
                </div>

                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-700"
                        style={{ width: `${Math.max(groupStats.percent, 3)}%` }}
                    />
                </div>

                <div className="space-y-3">
                    {members.length === 0 ? (
                        <p className="text-sm text-white/ font-serif italic">Ninguém entrou ainda. Compartilhe o código.</p>
                    ) : members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/10">
                            {m.profiles?.avatar_url ? (
                                <img src={m.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/">
                                    {(m.profiles?.username || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-serif truncate">
                                    {m.profiles?.username || 'Membro'}
                                    {m.role === 'owner' && <span className="text-[10px] uppercase tracking-[0.2em] text-white/ ml-2">criador</span>}
                                </p>
                                <p className="text-[10px] text-white/ font-serif">
                                    Dia {m.current_day} · {m.streak > 0 ? `${m.streak} dias seguidos` : 'sem sequência'}
                                </p>
                            </div>
                            {isOwner && m.role !== 'owner' && (
                                <button
                                    onClick={async () => {
                                        await aiPlansService.removeMember(plan.id, m.user_id);
                                        load();
                                    }}
                                    className="text-white/ hover:text-white transition-colors"
                                >
                                    <UserMinus size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {advice && (
                <section className="flex items-start gap-3 p-5 rounded-3xl border border-white/10 bg-white/5">
                    <TrendingUp size={16} className="text-white/ shrink-0 mt-1" />
                    <p className="text-sm text-white/ font-serif italic">{advice}</p>
                </section>
            )}

            <section className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/">Desafio coletivo</h3>
                {challenges.length === 0 ? (
                    <p className="text-sm text-white/ font-serif italic">Nenhum desafio ainda.</p>
                ) : challenges.map(c => (
                    <div key={c.id} className="p-5 rounded-3xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-serif">{c.title}</p>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/">
                                {c.current_streak}/{c.target_streak}
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-700"
                                style={{ width: `${Math.min(100, (c.current_streak / Math.max(1, c.target_streak)) * 100)}%` }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    await aiPlansService.updateChallengeProgress(c.id, c.current_streak + 1);
                                    load();
                                }}
                                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/ hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Target size={12} /> Marcar hoje
                            </button>
                        </div>
                    </div>
                ))}

                <div className="space-y-3">
                    <input
                        value={newChallenge}
                        onChange={(e) => setNewChallenge(e.target.value)}
                        placeholder="Novo desafio: ex: 7 dias sem perder a leitura"
                        className={cn(
                            'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-serif',
                            'text-white placeholder:text-white/ focus:outline-none focus:border-white/30 transition-colors'
                        )}
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            value={challengeDays}
                            onChange={(e) => setChallengeDays(e.target.value)}
                            className="w-24 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-serif text-white focus:outline-none focus:border-white/30"
                        />
                        <button
                            onClick={handleCreateChallenge}
                            disabled={!newChallenge.trim()}
                            className="flex-1 py-3 bg-white text-black rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-30"
                        >
                            Criar desafio
                        </button>
                    </div>
                </div>
            </section>

            {unlocks.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/">Bônus liberados</h3>
                    {unlocks.map(u => (
                        <div key={u.id} className="flex items-start gap-3 p-5 rounded-3xl border border-white/10">
                            <Gift size={16} className="text-white/ shrink-0 mt-1" />
                            <div>
                                <p className="font-serif">{u.label}</p>
                                <p className="text-sm text-white/ font-serif italic">{u.description}</p>
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
};
