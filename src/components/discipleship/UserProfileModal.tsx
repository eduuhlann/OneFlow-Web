import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Users, BookOpen, MessageSquare, UserCheck, UserPlus, Check, Hourglass, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { discipleshipService, SocialProfile } from '../../services/features/discipleshipService';

interface Props {
    userId: string | null;
    onClose: () => void;
    onMessage: (userId: string) => void;
}

export function UserProfileModal({ userId, onClose, onMessage }: Props) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<SocialProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [requestState, setRequestState] = useState<'none' | 'sent' | 'received'>('none');

    useEffect(() => {
        if (!userId || !user || userId === user.id) { setRequestState('none'); return; }
        let active = true;
        (async () => {
            try {
                const sent = await discipleshipService.getSentConnectionRequests(user.id);
                if (!active) return;
                if (sent.includes(userId)) { setRequestState('sent'); return; }
                const received = await discipleshipService.getConnectionRequests(user.id);
                if (!active) return;
                setRequestState(received.some((r) => r.from_id === userId) ? 'received' : 'none');
            } catch {
                if (active) setRequestState('none');
            }
        })();
        return () => { active = false; };
    }, [userId, user?.id]);

    useEffect(() => {
        if (!userId || !user) return;
        let active = true;
        setLoading(true);
        setData(null);
        discipleshipService.getSocialProfile(userId, user.id)
            .then(res => { if (active) setData(res); })
            .catch(err => console.error('Erro ao carregar perfil social:', err))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [userId, user]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (userId) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [userId, onClose]);

    const isSelf = userId === user?.id;

    const handleToggleFollow = async () => {
        if (!user || !data || busy) return;
        setBusy(true);
        const wasFollowing = data.isFollowing;
        setData(prev => prev ? { ...prev, isFollowing: !wasFollowing, followers: prev.followers + (wasFollowing ? -1 : 1) } : prev);
        try {
            if (wasFollowing) {
                await discipleshipService.unfollowUser(user.id, data.id);
            } else {
                await discipleshipService.followUser(user.id, data.id);
            }
        } catch (err) {
            console.error('Erro ao atualizar following:', err);
            setData(prev => prev ? { ...prev, isFollowing: wasFollowing, followers: prev.followers + (wasFollowing ? 1 : -1) } : prev);
        } finally {
            setBusy(false);
        }
    };

    const handleConnect = async () => {
        if (!user || !data || busy || requestState === 'received') return;
        setBusy(true);
        try {
            if (requestState === 'sent') {
                await discipleshipService.cancelConnectionRequest(user.id, data.id);
                setRequestState('none');
            } else {
                await discipleshipService.requestConnection(user.id, data.id);
                setRequestState('sent');
            }
        } catch (err) {
            console.error('Erro ao enviar solicitação de conexão:', err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AnimatePresence>
            {userId && (
                <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="relative w-full sm:max-w-lg bg-[#0a0a0a] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/70"
                    >
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white/ hover:text-white hover:bg-black/70 transition-all active:scale-90"
                        >
                            <X size={16} />
                        </button>

                        {loading ? (
                            <div className="h-72 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                            </div>
                        ) : !data ? (
                            <div className="h-72 flex flex-col items-center justify-center gap-3 px-8 text-center">
                                <User size={28} className="text-white/" />
                                <p className="text-[10px] font-bold tracking-widest uppercase text-white/">Perfil não encontrado</p>
                            </div>
                        ) : (
                            <>
                                <div className="relative h-40 overflow-hidden">
                                    {data.banner_url ? (
                                        <img src={data.banner_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-white/12 via-white/5 to-transparent" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                </div>

                                <div className="px-8 pb-8">
                                    <div className="-mt-16 flex items-end justify-between gap-4">
                                        <div className="relative h-32 w-32 rounded-full border-[5px] border-[#0a0a0a] bg-[#141414] overflow-hidden flex items-center justify-center shrink-0">
                                            {data.avatar_url ? (
                                                <img src={data.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                                            ) : (
                                                <User size={44} className="text-white/" />
                                            )}
                                        </div>

                                        {!isSelf && (
                                            <div className="flex items-center gap-2 pb-2">
                                                <button
                                                    onClick={handleToggleFollow}
                                                    disabled={busy}
                                                    className={`px-7 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${data.isFollowing
                                                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                                        : 'bg-white text-black hover:scale-105 shadow-lg shadow-white/20'
                                                    }`}
                                                >
                                                    {data.isFollowing ? <><UserCheck size={14} /> Seguindo</> : <><UserPlus size={14} /> Seguir</>}
                                                </button>
                                                <button
                                                    onClick={handleConnect}
                                                    disabled={busy || requestState === 'received'}
                                                    title={requestState === 'sent' ? 'Cancelar solicitação' : 'Solicitar conexão'}
                                                    className={`px-4 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 border disabled:opacity-60 ${
                                                        requestState === 'sent'
                                                            ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
                                                            : requestState === 'received'
                                                                ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
                                                                : 'border-white/15 text-white/80 hover:border-white/40 hover:text-white'
                                                    }`}
                                                >
                                                    {requestState === 'sent' ? (
                                                        <><Hourglass size={14} /> Pedido</>
                                                    ) : requestState === 'received' ? (
                                                        <><UserCheck size={14} /> Recebido</>
                                                    ) : (
                                                        <><UserPlus size={14} /> Conectar</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => onMessage(data.id)}
                                                    className="p-3.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
                                                    aria-label="Enviar mensagem"
                                                    title="Enviar mensagem"
                                                >
                                                    <MessageSquare size={17} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 space-y-1.5">
                                        <h3 className="text-3xl font-bold tracking-tight leading-none">
                                            {data.display_name || data.username || 'Usuário'}
                                        </h3>
                                        <p className="text-base text-white/">@{data.username || 'sem_username'}</p>
                                    </div>

                                    {data.short_bio && (
                                        <p className="mt-4 font-serif text-base italic leading-snug text-white/75">
                                            {data.short_bio}
                                        </p>
                                    )}

                                    {data.featured_verse && (
                                        <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3.5 font-serif text-[13px] leading-relaxed text-amber-50/80">
                                            {data.featured_verse}
                                        </p>
                                    )}

                                    {data.bio && (
                                        <p className="mt-5 text-sm leading-relaxed text-white/">{data.bio}</p>
                                    )}

                                    <div className="mt-6 grid grid-cols-3 gap-3">
                                        <Stat icon={<Users size={14} />} value={data.followers} label="Seguidores" />
                                        <Stat icon={<UserCheck size={14} />} value={data.following} label="Seguindo" />
                                        <Stat icon={<BookOpen size={14} />} value={data.chaptersRead} label="Capítulos" />
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/">
                                        {data.isFollowedBy && !isSelf && (
                                            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                                                <Check size={11} /> Te segue de volta
                                            </span>
                                        )}
                                        {data.mutuals > 0 && (
                                            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                                                <Users size={11} /> {data.mutuals} {data.mutuals === 1 ? 'pessoa que você segue' : 'pessoas que você segue'} em comum
                                            </span>
                                        )}
                                        {data.groups > 0 && (
                                            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                                                <Users size={11} /> {data.groups} {data.groups === 1 ? 'grupo' : 'grupos'}
                                            </span>
                                        )}
                                        {isSelf && (
                                            <button
                                                onClick={() => { onClose(); navigate('/profile'); }}
                                                className="px-3 py-1.5 rounded-full bg-white text-black hover:scale-105 transition-all"
                                            >
                                                Abrir meu perfil
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="flex items-center gap-1.5 text-white/70">{icon}<span className="text-lg font-bold">{value}</span></span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/">{label}</span>
        </div>
    );
}
