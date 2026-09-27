import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Send, Trash2 } from 'lucide-react';
import { aiPlansService, type AiPlan, type AiPlanDay, type PlanComment } from '../../services/features/aiPlansService';
import { cn } from './planUtils';

export const CommentsSection = ({ plan, day, userId, canInteract }: {
    plan: AiPlan;
    day: AiPlanDay;
    userId: string | null;
    canInteract: boolean;
}) => {
    const [comments, setComments] = useState<PlanComment[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [synthesizing, setSynthesizing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await aiPlansService.getComments(plan.id, day.day);
        setComments(data);
        setLoading(false);
    }, [plan.id, day.day]);

    useEffect(() => { load(); }, [load]);

    const handleSend = async () => {
        if (!text.trim() || !userId) return;
        setSending(true);
        setError(null);
        try {
            await aiPlansService.addComment(plan.id, day.day, userId, text.trim());
            setText('');
            await load();
        } catch (e: any) {
            setError('Não foi possível publicar seu comentário.');
        } finally {
            setSending(false);
        }
    };

    const handleSynthesize = async () => {
        if (!userId) return;
        setSynthesizing(true);
        setError(null);
        try {
            const summary = await aiPlansService.moderateDay(plan, day, comments);
            if (summary) {
                await aiPlansService.addComment(plan.id, day.day, userId, summary, true);
                await load();
            }
        } catch (e: any) {
            setError('A IA moderadora não respondeu agora.');
        } finally {
            setSynthesizing(false);
        }
    };

    const aiComments = comments.filter(c => c.is_ai);
    const humanComments = comments.filter(c => !c.is_ai);

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/">
                    Conversa do grupo · dia {day.day}
                </h3>
                {canInteract && humanComments.length >= 2 && (
                    <button
                        onClick={handleSynthesize}
                        disabled={synthesizing}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-[10px] font-bold uppercase tracking-[0.2em] text-white/ hover:text-white hover:border-white/40 transition-colors disabled:opacity-50"
                    >
                        <Bot size={14} />
                        {synthesizing ? 'Sintetizando...' : 'IA resume o grupo'}
                    </button>
                )}
            </div>

            {aiComments.length > 0 && (
                <div className="space-y-3 p-5 rounded-3xl border border-white/10 bg-white/5">
                    {aiComments.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <Bot size={16} className="text-white/ shrink-0 mt-1" />
                            <p className="text-sm leading-relaxed text-white/70 font-serif italic">{c.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-white/ font-serif italic">Carregando conversa...</p>
            ) : humanComments.length === 0 ? (
                <p className="text-sm text-white/ font-serif italic">
                    Ninguém comentou ainda. {canInteract ? 'Comece a conversa.' : 'Entre no plano para comentar.'}
                </p>
            ) : (
                <div className="space-y-4">
                    {humanComments.map(c => (
                        <div key={c.id} className="flex gap-3 group">
                            {c.profiles?.avatar_url ? (
                                <img src={c.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/ shrink-0">
                                    {(c.profiles?.username || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/">
                                    {c.profiles?.username || 'Membro'}
                                </span>
                                <p className="text-sm leading-relaxed text-white/75 font-serif">{c.content}</p>
                            </div>
                            {canInteract && userId === c.author_id && (
                                <button
                                    onClick={async () => {
                                        await aiPlansService.deleteComment(c.id);
                                        load();
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-white/ hover:text-white transition-opacity self-start"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-xs text-white/ font-serif italic">{error}</p>}

            {canInteract && (
                <div className="flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        placeholder="O que Deus falou com você hoje?"
                        className={cn(
                            'flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm font-serif',
                            'text-white placeholder:text-white/ focus:outline-none focus:border-white/30 transition-colors'
                        )}
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !text.trim()}
                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30 shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </section>
    );
};
