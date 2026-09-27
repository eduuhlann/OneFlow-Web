import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { isSelfView } from '../lib/social';
import { discipleshipService, type SocialProfile } from '../services/features/discipleshipService';
import { supabase } from '../services/supabase';
import { profileUrl as buildProfileUrl } from '../lib/site';
import { useCopyLink } from '../components/profile/useCopyLink';
import { ProfileNav } from '../components/profile/ProfileNav';
import { ProfileBanner } from '../components/profile/ProfileBanner';
import { StatCard, STAT_ICONS } from '../components/profile/ProfileStats';
import { ProfileLinkBar } from '../components/profile/ProfileLinkBar';
import { ProfileButton } from '../components/profile/ProfileButton';

const PublicProfile: React.FC = () => {
    const { username = '' } = useParams<{ username: string }>();
    const { user, loading: authLoading } = useAuth();
    const { profile: myProfile, loading: profileLoading } = useProfile();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [noUsername, setNoUsername] = useState(false);
    const [requestState, setRequestState] = useState<'none' | 'sent' | 'received'>('none');
    const [busy, setBusy] = useState(false);

    const cleanUsername = username.replace(/^@/, '').trim();
    const targetUsername = cleanUsername || (myProfile?.username || '').trim();

    const load = useCallback(async () => {
        if (!targetUsername) {
            setNotFound(true);
            setNoUsername(true);
            setLoading(false);
            return;
        }
        setLoading(true);
        setNotFound(false);
        setNoUsername(false);
        try {
            const { data: rows, error } = await supabase
                .from('profiles')
                .select('id, username')
                .ilike('username', targetUsername)
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
    }, [targetUsername, user?.id]);

    useEffect(() => {
        if (authLoading || profileLoading) return;
        load();
    }, [authLoading, profileLoading, load]);

    useEffect(() => {
        if (!user || !profile || isSelfView(user.id, profile.id)) {
            setRequestState('none');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const sent = await discipleshipService.getSentConnectionRequests(user.id);
                if (cancelled) return;
                if (sent.includes(profile.id)) { setRequestState('sent'); return; }
                const received = await discipleshipService.getConnectionRequests(user.id);
                if (cancelled) return;
                setRequestState(received.some((r) => r.from_id === profile.id) ? 'received' : 'none');
            } catch { if (!cancelled) setRequestState('none'); }
        })();
        return () => { cancelled = true; };
    }, [user?.id, profile?.id]);

    const isSelf = !!user && !!profile && user.id === profile.id;

    const meta = user?.user_metadata || {};
    const avatarSrc = profile?.avatar_url || (isSelf ? (meta.avatar_url || meta.picture || meta.avatar || meta.photoURL || '') : '');
    const bannerSrc = profile?.banner_url || null;
    const shareUrl = buildProfileUrl(profile?.username || cleanUsername);

    const handleToggleFollow = async () => {
        if (!user || !profile) return;
        setBusy(true);
        const wasFollowing = profile.isFollowing;
        setProfile((prev) => prev ? { ...prev, isFollowing: !wasFollowing, followers: Math.max(0, prev.followers + (wasFollowing ? -1 : 1)) } : prev);
        try {
            if (wasFollowing) await discipleshipService.unfollowUser(user.id, profile.id);
            else await discipleshipService.followUser(user.id, profile.id);
        } catch {
            setProfile((prev) => prev ? { ...prev, isFollowing: wasFollowing, followers: Math.max(0, prev.followers + (wasFollowing ? 1 : -1)) } : prev);
        } finally { setBusy(false); }
    };

    const handleConnect = async () => {
        if (!user || !profile) return;
        setBusy(true);
        try {
            if (requestState === 'sent') { await discipleshipService.cancelConnectionRequest(user.id, profile.id); setRequestState('none'); }
            else { await discipleshipService.requestConnection(user.id, profile.id); setRequestState('sent'); }
        } catch { setRequestState('none'); }
        finally { setBusy(false); }
    };

    const handleChat = () => { if (!user || !profile) return; navigate(`/discipleship?chat=${profile.id}`); };

    const handleBack = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate(user ? '/dashboard' : '/auth');
    };

    const { copied, copy } = useCopyLink();

    const stats = [
        { icon: STAT_ICONS.followers, value: profile?.followers ?? 0, label: 'Seguidores' },
        { icon: STAT_ICONS.following, value: profile?.following ?? 0, label: 'Seguindo' },
        { icon: STAT_ICONS.chapters, value: profile?.chaptersRead ?? 0, label: 'Capítulos' },
        { icon: STAT_ICONS.groups, value: profile?.groups ?? 0, label: 'Grupos' },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white">
            <ProfileNav onBack={handleBack} onApp={() => navigate('/dashboard')} />

            <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#0a0a0a] p-6">
                        {/* Skeleton: banner */}
                        <div className="mb-6 h-48 rounded-t-[2rem] bg-white/[0.04] sm:h-60 md:h-72 lg:h-80" />
                        <div className="flex flex-col items-center gap-6 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between lg:-mt-12">
                            <div className="h-24 w-24 rounded-full border-4 border-[#0a0a0a] bg-white/[0.04] sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
                            <div className="flex w-full flex-wrap items-center justify-end gap-3">
                                <div className="h-[52px] w-[112px] rounded-full bg-white/[0.04]" />
                                <div className="h-[52px] w-[112px] rounded-full bg-white/[0.04]" />
                                <div className="h-[52px] w-[52px] rounded-full bg-white/[0.04]" />
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="h-9 w-44 rounded bg-white/[0.04]" />
                            <div className="h-5 w-32 rounded bg-white/[0.04]" />
                            <div className="h-4 w-64 rounded bg-white/[0.04]" />
                        </div>
                    </div>
                ) : notFound || !profile ? (
                    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
                        <span className="font-serif text-3xl tracking-tight text-white/">OneFlow</span>
                        {noUsername ? (
                            <>
                                <h1 className="font-serif text-2xl font-bold tracking-tight">Você ainda não tem um link público</h1>
                                <p className="max-w-sm text-[15px] text-white/">
                                    Defina um nome de usuário para ter um endereço público em <span className="text-white/">/u/seu_usuario</span>.
                                </p>
                                <button
                                    onClick={() => navigate('/profile/edit')}
                                    className="mt-2 rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/90 active:scale-[0.98]"
                                >
                                    Criar meu link
                                </button>
                            </>
                        ) : (
                            <>
                                <h1 className="font-serif text-2xl font-bold tracking-tight">Perfil não encontrado</h1>
                                <p className="max-w-sm text-[15px] text-white/">
                                    O usuário <span className="text-white/">@{cleanUsername}</span> não existe ou mudou de nome.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="mt-2 rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/90 active:scale-[0.98]"
                                >
                                    Ir para o App
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#0a0a0a] shadow-[0_12px_40px_-12px_rgba(255,255,255,0.06)]"
                    >
                        <ProfileBanner bannerSrc={bannerSrc} featuredVerse={profile.featured_verse} avatarSrc={avatarSrc} displayName={profile.display_name} />

                        <div className="px-6 pt-20 pb-8 sm:px-9 sm:pt-24 lg:pt-28">
                            {/* Informações + ações */}
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                                <div className="min-w-0 flex-1 space-y-3">
                                    <h1 className="truncate font-serif text-[28px] font-bold leading-none tracking-tight text-white sm:text-3xl lg:text-[34px]">
                                        {profile.display_name || profile.username || 'Usuário'}
                                    </h1>
                                    <p className="text-[15px] font-sans font-medium text-white/">@{profile.username || 'sem_username'}</p>
                                    {(profile.short_bio || profile.bio) && (
                                        <p className="mt-1 line-clamp-3 font-serif text-[15px] leading-snug text-white/">
                                            {profile.short_bio || profile.bio}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                    {isSelf ? (
                                        <>
                                            <ProfileButton variant="primary" onClick={() => navigate('/profile')}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Meu Perfil
                                            </ProfileButton>
                                            <ProfileButton variant="secondary" onClick={() => navigate('/profile/edit')}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Editar
                                            </ProfileButton>
                                        </>
                                    ) : (
                                        <>
                                            <ProfileButton
                                                variant={profile.isFollowing ? 'secondary' : 'primary'}
                                                disabled={busy}
                                                onClick={handleToggleFollow}
                                            >
                                                {profile.isFollowing ? 'Seguindo' : 'Seguir'}
                                            </ProfileButton>
                                            <ProfileButton
                                                variant="secondary"
                                                disabled={busy || requestState === 'received'}
                                                onClick={handleConnect}
                                            >
                                                {requestState === 'sent' ? 'Pedido enviado' : requestState === 'received' ? 'Pedido recebido' : 'Conectar'}
                                            </ProfileButton>
                                            <ProfileButton variant="ghost" onClick={handleChat}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                Chat
                                            </ProfileButton>
                                        </>
                                    )}
                                    <button
                                        onClick={() => copy(shareUrl)}
                                        aria-label={copied ? 'Link copiado' : 'Copiar link do perfil'}
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white/ transition-colors duration-150 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b]"
                                    >
                                        {copied
                                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {stats.map((s) => (
                                    <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} />
                                ))}
                            </div>

                            {/* Link público */}
                            <div className="mt-7 border-t border-white/[0.06] pt-6">
                                <ProfileLinkBar url={shareUrl} copied={copied} onCopy={() => copy(shareUrl)} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default PublicProfile;
