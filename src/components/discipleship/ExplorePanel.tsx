import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Search, User, UserPlus, UserCheck, MessageSquare, Loader2, AtSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { discipleshipService, SocialUser } from '../../services/features/discipleshipService';

interface Props {
    onOpenProfile: (userId: string) => void;
    onMessage: (userId: string) => void;
}

export function ExplorePanel({ onOpenProfile, onMessage }: Props) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SocialUser[]>([]);
    const [suggested, setSuggested] = useState<SocialUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        let active = true;
        discipleshipService.getSuggestedUsers(user.id)
            .then(list => { if (active) setSuggested(list); })
            .catch(err => console.error('Erro ao carregar sugestões:', err))
            .finally(() => { if (active) setSuggestLoading(false); });
        return () => { active = false; };
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const clean = query.replace(/^@+/, '').trim();
        if (clean.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const timer = setTimeout(async () => {
            const found = await discipleshipService.searchUsersByUsername(clean, user.id);
            setResults(found);
            setLoading(false);
        }, 280);
        return () => clearTimeout(timer);
    }, [query, user]);

    const handleToggleFollow = async (target: SocialUser) => {
        if (!user) return;
        const wasFollowing = target.is_following;
        const apply = (list: SocialUser[]) => list.map(p => p.id === target.id ? { ...p, is_following: !wasFollowing } : p);
        setResults(apply);
        setSuggested(apply);
        try {
            if (wasFollowing) {
                await discipleshipService.unfollowUser(user.id, target.id);
            } else {
                await discipleshipService.followUser(user.id, target.id);
            }
        } catch (err) {
            console.error('Erro ao seguir usuário:', err);
            const revert = (list: SocialUser[]) => list.map(p => p.id === target.id ? { ...p, is_following: wasFollowing } : p);
            setResults(revert);
            setSuggested(revert);
        }
    };

    const cleanQuery = query.replace(/^@+/, '').trim();
    const isSearching = cleanQuery.length >= 2;
    const emptyState = isSearching && !loading && results.length === 0;

    return (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div className="sticky top-0 z-10 bg-[var(--of-sidebar)]/95 backdrop-blur-md pt-3 pb-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-[var(--of-border)] bg-[var(--of-surface)] px-3.5 py-3 transition-colors duration-[var(--of-dur)] focus-within:border-[var(--of-border-hover)]">
                    <AtSign size={15} strokeWidth={1.75} className="shrink-0 text-[var(--of-muted)]" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por @usuario"
                        className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-[var(--of-muted)] focus:outline-none"
                    />
                    {loading && <Loader2 size={15} className="animate-spin shrink-0 text-[var(--of-muted)]" />}
                </div>
            </div>

            {isSearching ? (
                <div className="space-y-2 pt-1">
                    {results.map(peer => (
                        <PersonRow
                            key={peer.id}
                            person={peer}
                            onOpenProfile={onOpenProfile}
                            onMessage={onMessage}
                            onToggleFollow={handleToggleFollow}
                        />
                    ))}
                    {emptyState && (
                        <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
                            <Search size={24} className="text-white/" />
                            <p className="text-[11px] font-medium text-[var(--of-secondary)]">Nenhum @{cleanQuery} encontrado</p>
                            <p className="text-[11px] leading-relaxed text-[var(--of-muted)]">Confira se o nome de usuário está escrito corretamente.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2 px-1 pt-3">
                        <h4 className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--of-muted)]">Sugestões</h4>
                        <span className="h-px flex-1 bg-[var(--of-border)]" />
                    </div>

                    {suggestLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 size={15} className="animate-spin text-[var(--of-muted)]" />
                        </div>
                    ) : suggested.length > 0 ? (
                        suggested.map(peer => (
                            <PersonRow
                                key={peer.id}
                                person={peer}
                                onOpenProfile={onOpenProfile}
                                onMessage={onMessage}
                                onToggleFollow={handleToggleFollow}
                            />
                        ))
                    ) : (
                        <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
                            <User size={24} className="text-white/" />
                            <p className="text-[11px] font-medium text-[var(--of-secondary)]">Nenhuma sugestão ainda</p>
                            <p className="text-[11px] leading-relaxed text-[var(--of-muted)]">Entre em grupos ou busque alguém pelo @usuario para começar a seguir.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PersonRow({
    person,
    onOpenProfile,
    onMessage,
    onToggleFollow,
}: {
    person: SocialUser;
    onOpenProfile: (userId: string) => void;
    onMessage: (userId: string) => void;
    onToggleFollow: (person: SocialUser) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-surface-hover)]"
        >
            <button onClick={() => onOpenProfile(person.id)} className="shrink-0" aria-label={`Ver perfil de ${person.username}`}>
                <span className="size-9 rounded-full bg-[var(--of-surface)] border border-[var(--of-border)] overflow-hidden flex items-center justify-center">
                    {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    ) : (
                        <User size={20} className="text-white/" />
                    )}
                </span>
            </button>

            <button onClick={() => onOpenProfile(person.id)} className="flex-1 min-w-0 text-left">
                <p className="truncate text-[13px] tracking-tight text-white/90">{person.display_name || person.username}</p>
                <p className="truncate text-[12px] text-[var(--of-muted)]">@{person.username}</p>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={() => onMessage(person.id)}
                    aria-label="Enviar mensagem"
                    title="Enviar mensagem"
                    className="p-2 rounded-full border border-[var(--of-border)] bg-[var(--of-surface)] text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white active:scale-90"
                >
                    <MessageSquare size={15} />
                </button>
                <button
                    onClick={() => onToggleFollow(person)}
                    className={`px-4 py-2 rounded-full text-[9px] font-semibold uppercase tracking-[0.16em] transition-all duration-[var(--of-dur)] active:scale-95 flex items-center gap-1.5 ${person.is_following
                        ? 'border border-[var(--of-border)] bg-[var(--of-surface)] text-[var(--of-secondary)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white'
                        : 'bg-white text-black hover:bg-[var(--of-primary)]'
                    }`}
                >
                    {person.is_following ? <><UserCheck size={12} /> Seguindo</> : <><UserPlus size={12} /> Seguir</>}
                </button>
            </div>
        </motion.div>
    );
}
