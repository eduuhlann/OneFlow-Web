import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ArrowLeft, 
    User, 
    Users, 
    Plus, 
    Search,
    Send, 
    BookOpen, 
    Clock, 
    CheckCircle2, 
    MessageSquare,
    ChevronRight,
    TrendingUp,
    Target,
    X,
    MoreVertical,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { discipleshipService, DiscipleshipTask, DiscipleshipNote } from '../services/features/discipleshipService';
import { statsService, BibleStats } from '../services/features/statsService';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../services/supabase';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Discipleship: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'chat'>('list');
    
    // UI States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    
    // Data States
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
    const [notes, setNotes] = useState<DiscipleshipNote[]>([]);
    const [tasks, setTasks] = useState<DiscipleshipTask[]>([]);
    const [stats, setStats] = useState<BibleStats | null>(null);
    const [noteInput, setNoteInput] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConnections();
    }, [user]);

    useEffect(() => {
        if (selectedConnection) {
            loadChatData();
            const channel = subscribeToMessages();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConnection]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes]);

    const loadConnections = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [disciples, leaderData] = await Promise.all([
                discipleshipService.getDisciples(user.id),
                discipleshipService.getLeader(user.id)
            ]);
            
            // Normalize connections for the list
            const all = [
                ...(leaderData ? [{ ...leaderData, type: 'leader', profile: leaderData.profiles }] : []),
                ...disciples.map(d => ({ ...d, type: 'disciple', profile: d.profiles }))
            ];
            setConnections(all);
        } catch (error) {
            console.error('Error loading connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChatData = async () => {
        if (!user || !selectedConnection) return;
        try {
            const discipleId = selectedConnection.type === 'leader' ? user.id : selectedConnection.disciple_id;
            const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : user.id;
            
            const [noteList, taskList, bibleStats] = await Promise.all([
                discipleshipService.getNotes(leaderId, discipleId),
                discipleshipService.getTasks(discipleId, false),
                statsService.getUserStats(discipleId)
            ]);
            
            setNotes(noteList);
            setTasks(taskList);
            setStats(bibleStats);
        } catch (error) {
            console.error('Error loading chat data:', error);
        }
    };

    const subscribeToMessages = () => {
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : user!.id;
        const discipleId = selectedConnection.type === 'leader' ? user!.id : selectedConnection.disciple_id;

        return supabase
            .channel(`discipleship-chat-${selectedConnection.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'discipleship_notes',
                    filter: `leader_id=eq.${leaderId}`
                },
                (payload) => {
                    // Only add if it's for this specific connection
                    if (payload.new.disciple_id === discipleId) {
                        setNotes(prev => [...prev, payload.new as DiscipleshipNote]);
                    }
                }
            )
            .subscribe();
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length >= 3) {
            const results = await discipleshipService.searchUsers(q);
            setSearchResults(results.filter(r => r.id !== user?.id));
        } else {
            setSearchResults([]);
        }
    };

    const handleInvite = async (targetUser: any) => {
        if (!user) return;
        try {
            await discipleshipService.sendDirectInvite(user.id, targetUser.id);
            setInviteSuccess(targetUser.username);
            setTimeout(() => {
                setInviteSuccess(null);
                setIsSearchOpen(false);
                loadConnections();
            }, 2000);
        } catch (error) {
            alert('Erro ao enviar convite.');
        }
    };

    const handleSendMessage = async () => {
        if (!user || !noteInput.trim() || !selectedConnection) return;
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : user.id;
        const discipleId = selectedConnection.type === 'leader' ? user.id : selectedConnection.disciple_id;

        try {
            await discipleshipService.addNote(leaderId, discipleId, user.id, noteInput);
            setNoteInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSelectConnection = (conn: any) => {
        setSelectedConnection(conn);
        setView('chat');
        if (user) {
            const leaderId = conn.type === 'leader' ? conn.leader_id : user.id;
            const discipleId = conn.type === 'leader' ? user.id : conn.disciple_id;
            discipleshipService.markNotesAsRead(leaderId, discipleId, user.id);
        }
    };

    return (
        <PageTransition>
            <div className="h-screen bg-[#0d0d0d] text-white flex flex-col font-sans overflow-hidden">
                {/* Search Modal */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight">Novo Discipulado</h3>
                                    <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="Buscar por usuário..." 
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full bg-black/40 border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-0 focus:border-white/30 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                        {searchResults.map(r => (
                                            <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                                                        {r.avatar_url && <img src={r.avatar_url} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="font-bold text-sm">{r.username}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleInvite(r)}
                                                    className="px-4 py-2 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Convidar
                                                </button>
                                            </div>
                                        ))}
                                        {searchQuery.length > 0 && searchQuery.length < 3 && (
                                            <p className="text-center py-4 text-white/20 text-xs italic">Digite ao menos 3 letras...</p>
                                        )}
                                        {searchQuery.length >= 3 && searchResults.length === 0 && (
                                            <p className="text-center py-4 text-white/20 text-xs italic">Nenhum usuário encontrado.</p>
                                        )}
                                    </div>
                                    
                                    <AnimatePresence>
                                        {inviteSuccess && (
                                            <motion.div 
                                                initial={{ y: 20, opacity: 0 }} 
                                                animate={{ y: 0, opacity: 1 }}
                                                className="bg-green-500/20 border border-green-500/20 text-green-500 p-4 rounded-2xl flex items-center gap-3"
                                            >
                                                <div className="bg-green-500 text-white rounded-full p-1"><Check className="w-3 h-3" /></div>
                                                <span className="text-xs font-bold">Convite enviado para @{inviteSuccess}!</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Chat List */}
                    <aside className={cn(
                        "w-full md:w-[380px] border-r border-white/5 flex flex-col transition-all",
                        view === 'chat' ? 'hidden md:flex' : 'flex'
                    )}>
                        <header className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h1 className="text-2xl font-black italic -rotate-1 tracking-tighter">Mensagens</h1>
                                </div>
                                <button onClick={() => setIsSearchOpen(true)} className="p-3 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar conversa..." 
                                    className="w-full bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                />
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-24">
                            {connections.length === 0 ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                                        <Users className="w-8 h-8 text-white/10" />
                                    </div>
                                    <p className="text-xs text-white/30 italic">Nenhum discipulado ativo.</p>
                                </div>
                            ) : (
                                connections.map(conn => (
                                    <button 
                                        key={conn.id}
                                        onClick={() => handleSelectConnection(conn)}
                                        className={cn(
                                            "w-full p-4 rounded-[28px] flex items-center gap-4 transition-all group",
                                            selectedConnection?.id === conn.id ? "bg-white/10 border border-white/10 shadow-lg" : "hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {conn.profile?.avatar_url ? (
                                                <img src={conn.profile.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-white/20" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold">{conn.profile?.username || 'Usuário'}</span>
                                                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">{conn.type === 'leader' ? 'Líder' : 'Discípulo'}</span>
                                            </div>
                                            <p className="text-[11px] text-white/40 line-clamp-1">Toque para ver a jornada...</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Chat Area */}
                    <main className={cn(
                        "flex-1 flex flex-col bg-[#0d0d0d] transition-all relative",
                        view === 'list' ? 'hidden md:flex' : 'flex'
                    )}>
                        {selectedConnection ? (
                            <>
                                <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setView('list')} className="md:hidden p-2.5 bg-white/5 rounded-xl">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                                                {selectedConnection.profile?.avatar_url && <img src={selectedConnection.profile.avatar_url} className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm md:text-base">{selectedConnection.profile?.username}</h3>
                                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Ativo Agora</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                            <Target className="w-5 h-5 text-indigo-400" />
                                        </button>
                                        <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </header>

                                {/* Chat Feed */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    <div className="max-w-xl mx-auto space-y-6">
                                        {/* Journey Progress (Compact Header in Chat) */}
                                        {stats && (
                                            <div className="mb-12 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                                                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Progresso Real-time</p>
                                                        <p className="text-lg font-black italic">{Math.round(stats.completionPercentage)}% da Bíblia Lida</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-white/30 font-bold uppercase">{stats.totalChaptersRead} Cap.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {notes.map((n, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    key={n.id} 
                                                    className={cn(
                                                        "flex flex-col gap-1 max-w-[85%] md:max-w-[70%]", 
                                                        n.author_id === user!.id ? "ml-auto items-end" : "items-start"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "px-5 py-3 rounded-[24px] text-[14px] leading-relaxed shadow-xl", 
                                                        n.author_id === user!.id 
                                                            ? "bg-white text-black font-semibold rounded-tr-none" 
                                                            : "bg-[#1a1a1a] border border-white/5 text-white rounded-tl-none"
                                                    )}>
                                                        {n.content}
                                                    </div>
                                                    <span className="text-[9px] text-white/20 font-bold uppercase px-1">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </motion.div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <footer className="p-6 bg-black/40 backdrop-blur-md border-t border-white/5">
                                    <div className="max-w-3xl mx-auto flex gap-3 items-center">
                                        <button className="p-4 bg-white/5 text-white/40 rounded-3xl hover:bg-white/10 transition-all">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 bg-white/5 rounded-3xl flex items-center px-6 py-1 focus-within:ring-2 focus-within:ring-white/10 transition-all">
                                            <input 
                                                type="text" 
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Sua mensagem fiel..." 
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-4"
                                            />
                                            <button onClick={handleSendMessage} className="p-3 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-lg ml-2">
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center bg-gradient-to-b from-transparent to-white/[0.02]">
                                <div className="max-w-sm space-y-6">
                                    <div className="w-24 h-24 bg-white/5 rounded-[48px] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                                        <MessageSquare className="w-10 h-10 text-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black italic -rotate-1 tracking-tighter">Seja bem-vindo</h2>
                                        <p className="text-xs text-white/30 leading-relaxed font-medium">
                                            Selecione uma conversa ao lado para iniciar seu acompanhamento espiritual ou convide um novo discípulo.
                                        </p>
                                    </div>
                                    <button onClick={() => setIsSearchOpen(true)} className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                        Iniciar Conversa
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </PageTransition>
    );
};

export default Discipleship;
