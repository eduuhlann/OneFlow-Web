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
        <div className="flex-1 overflow-y-auto px-4 pb-24 custom-scrollbar">
            <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur-md pt-1 pb-4 -mx-4 px-4">
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white/25 transition-colors">
                    <AtSign size={16} className="text-white/30 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por @usuario"
                        className="flex-1 bg-transparent text-sm placeholder:text-white/25 focus:outline-none min-w-0"
                    />
                    {loading && <Loader2 size={15} className="text-white/40 animate-spin shrink-0" />}
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
                            <Search size={24} className="text-white/15" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Nenhum @{cleanQuery} encontrado</p>
                            <p className="text-[11px] text-white/20 leading-relaxed">Confira se o nome de usuário está escrito corretamente.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2 px-1 pt-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Sugestões</h4>
                        <span className="h-px flex-1 bg-white/5" />
                    </div>

                    {suggestLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 size={18} className="text-white/30 animate-spin" />
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
                            <User size={24} className="text-white/15" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Nenhuma sugestão ainda</p>
                            <p className="text-[11px] text-white/20 leading-relaxed">Entre em grupos ou busque alguém pelo @usuario para começar a seguir.</p>
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
            className="flex items-center gap-3.5 p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all"
        >
            <button onClick={() => onOpenProfile(person.id)} className="shrink-0" aria-label={`Ver perfil de ${person.username}`}>
                <span className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    ) : (
                        <User size={20} className="text-white/25" />
                    )}
                </span>
            </button>

            <button onClick={() => onOpenProfile(person.id)} className="flex-1 min-w-0 text-left">
                <p className="text-[15px] font-bold truncate">{person.display_name || person.username}</p>
                <p className="text-xs text-white/35 truncate">@{person.username}</p>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={() => onMessage(person.id)}
                    aria-label="Enviar mensagem"
                    title="Enviar mensagem"
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <MessageSquare size={15} />
                </button>
                <button
                    onClick={() => onToggleFollow(person)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 ${person.is_following
                        ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                        : 'bg-white text-black hover:scale-105'
                    }`}
                >
                    {person.is_following ? <><UserCheck size={12} /> Seguindo</> : <><UserPlus size={12} /> Seguir</>}
                </button>
            </div>
        </motion.div>
    );
}
