import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    BookOpen,
    Check,
    Compass,
    Link2,
    MessageSquare,
    Pencil,
    User,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discipleshipService, type SocialProfile } from '../services/features/discipleshipService';
import { supabase } from '../services/supabase';
import PageTransition from '../components/PageTransition';
import { profileUrl as buildProfileUrl } from '../lib/site';

const PublicProfile: React.FC = () => {
    const { username = '' } = useParams<{ username: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const cleanUsername = username.replace(/^@/, '').trim();

    const load = useCallback(async () => {
        if (!cleanUsername) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        setLoading(true);
        setNotFound(false);
        try {
            const { data: rows, error } = await supabase
                .from('profiles')
                .select('id, username')
                .ilike('username', cleanUsername)
                .limit(1);
            if (error) throw error;

            const targetId = rows?.[0]?.id;
            if (!targetId) {
                setNotFound(true);
                setProfile(null);
                return;
            }

            const social = await discipleshipService.getSocialProfile(targetId, user?.id || targetId);
            if (social) {
                setProfile(social);
                setNotFound(false);
            } else {
                setNotFound(true);
            }
        } catch (err) {
            console.error('Erro ao carregar perfil público:', err);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [cleanUsername, user?.id]);

    useEffect(() => {
        if (authLoading) return;
        load();
    }, [authLoading, load]);

    const isSelf = !!user && !!profile && user.id === profile.id;

    // o avatar do dono costuma vir só do OAuth (Google) e não estar em profiles.avatar_url
    const meta = user?.user_metadata || {};
    const avatarSrc = profile?.avatar_url
        || (isSelf ? (meta.avatar_url || meta.picture || meta.avatar || meta.photoURL || '') : '');
    const bannerSrc = profile?.banner_url || '';

    const handleToggleFollow = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (!profile || busy) return;
        setBusy(true);
        const wasFollowing = profile.isFollowing;
        setProfile(prev => prev ? {
            ...prev,
            isFollowing: !wasFollowing,
            followers: Math.max(0, prev.followers + (wasFollowing ? -1 : 1)),
        } : prev);
        try {
            if (wasFollowing) {
                await discipleshipService.unfollowUser(user.id, profile.id);
            } else {
                await discipleshipService.followUser(user.id, profile.id);
            }
        } catch (err) {
            console.error('Erro ao atualizar following:', err);
            setProfile(prev => prev ? {
                ...prev,
                isFollowing: wasFollowing,
                followers: Math.max(0, prev.followers + (wasFollowing ? 1 : -1)),
            } : prev);
        } finally {
            setBusy(false);
        }
    };

    const handleChat = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (!profile) return;
        navigate(`/discipleship?chat=${profile.id}`);
    };

    const shareUrl = buildProfileUrl(profile?.username || cleanUsername);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copie o link do perfil:', shareUrl);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: profile?.display_name || profile?.username || 'OneFlow',
                    text: profile?.bio || 'Confira este perfil no OneFlow.',
                    url: shareUrl,
                });
                return;
            } catch {
                return;
            }
        }
        handleCopy();
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#080808] text-white">
                <header className="sticky top-0 z-30 border-b border-white/5 bg-[#080808]/85 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                        <button
                            onClick={() => navigate(user ? '/discipleship' : '/auth')}
                            className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/30 hover:text-white"
                        >
                            <ArrowLeft size={14} /> Voltar
                        </button>
                        <span className="text-sm font-bold tracking-[0.05em]">OneFlow</span>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-gray-200"
                        >
                            App
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
                    {loading ? (
                        <div className="flex min-h-[60vh] items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        </div>
                    ) : notFound || !profile ? (
                        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                            <User size={30} className="text-white/20" />
                            <h1 className="font-serif text-2xl tracking-tight">Perfil não encontrado</h1>
                            <p className="max-w-sm text-sm text-white/40">
                                O usuário <span className="text-white/70">@{cleanUsername}</span> não existe ou mudou de nome.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-2 rounded-xl bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-gray-200"
                            >
                                Ir para o App
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a]"
                        >
                            <div className="relative h-52 w-full overflow-hidden sm:h-72">
                                {bannerSrc ? (
                                    <img
                                        src={bannerSrc}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-white/12 via-white/5 to-transparent" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                            </div>

                            <div className="px-6 pb-8 sm:px-9">
                                <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-[5px] border-[#0a0a0a] bg-[#141414] sm:h-40 sm:w-40">
                                        {avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center">
                                                <User size={52} className="text-white/25" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pb-1">
                                        {isSelf ? (
                                            <>
                                                <button
                                                    onClick={() => navigate('/profile')}
                                                    className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-black transition-all hover:scale-[1.03] active:scale-95"
                                                >
                                                    <Pencil size={14} /> Meu Perfil
                                                </button>
                                                <button
                                                    onClick={() => navigate('/profile/edit')}
                                                    className="rounded-full border border-white/15 px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white/70 transition-all hover:border-white/40 hover:text-white"
                                                >
                                                    Editar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleToggleFollow}
                                                    disabled={busy}
                                                    className={`flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 ${
                                                        profile.isFollowing
                                                            ? 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                                                            : 'bg-white text-black hover:scale-[1.03] shadow-lg shadow-white/20'
                                                    }`}
                                                >
                                                    {profile.isFollowing ? <><UserCheck size={14} /> Seguindo</> : <><UserPlus size={14} /> Seguir</>}
                                                </button>
                                                <button
                                                    onClick={handleChat}
                                                    className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white/80 transition-all hover:border-white/40 hover:text-white"
                                                >
                                                    <MessageSquare size={15} /> Abrir Chat
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={handleShare}
                                            aria-label="Compartilhar perfil"
                                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white"
                                        >
                                            {copied ? <Check size={16} /> : <Link2 size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-2">
                                    <h1 className="text-3xl font-bold leading-none tracking-tight sm:text-4xl">
                                        {profile.display_name || profile.username || 'Usuário'}
                                    </h1>
                                    <p className="text-base text-white/40">@{profile.username || 'sem_username'}</p>
                                </div>

                                {profile.bio && (
                                    <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-white/60">{profile.bio}</p>
                                )}

                                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Stat icon={<Users size={15} />} value={profile.followers} label="Seguidores" />
                                    <Stat icon={<UserCheck size={15} />} value={profile.following} label="Seguindo" />
                                    <Stat icon={<BookOpen size={15} />} value={profile.chaptersRead} label="Capítulos" />
                                    <Stat icon={<Compass size={15} />} value={profile.groups} label="Grupos" />
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                                    {profile.isFollowedBy && !isSelf && (
                                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                            <Check size={11} /> Te segue de volta
                                        </span>
                                    )}
                                    {profile.mutuals > 0 && (
                                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                            <Users size={11} /> {profile.mutuals} {profile.mutuals === 1 ? 'pessoa em comum' : 'pessoas em comum'}
                                        </span>
                                    )}
                                    {profile.connections > 0 && (
                                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                            <UserCheck size={11} /> {profile.connections} {profile.connections === 1 ? 'conexão' : 'conexões'}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/5 pt-6">
                                    <p className="truncate text-xs text-white/25">{shareUrl}</p>
                                    <button
                                        onClick={handleCopy}
                                        className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/30 hover:text-white"
                                    >
                                        {copied ? <><Check size={13} /> Copiado</> : <><Link2 size={13} /> Copiar Link</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] py-5">
            <span className="flex items-center gap-1.5 text-white/70">{icon}<span className="text-xl font-bold">{value}</span></span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</span>
        </div>
    );
}

export default PublicProfile;
