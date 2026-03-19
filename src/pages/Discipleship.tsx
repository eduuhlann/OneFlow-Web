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
    Check,
    UserPlus,
    CheckCircle,
    XCircle
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
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    
    // Data States
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
    const [notes, setNotes] = useState<DiscipleshipNote[]>([]);
    const [tasks, setTasks] = useState<DiscipleshipTask[]>([]);
    const [stats, setStats] = useState<BibleStats | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
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
            const [disciples, leaderData, groups] = await Promise.all([
                discipleshipService.getDisciples(user.id),
                discipleshipService.getLeader(user.id),
                discipleshipService.getGroups(user.id)
            ]);
            
            // Normalize connections for the list
            const all = [
                ...(leaderData ? [{ ...leaderData, type: 'leader', profile: leaderData.profiles }] : []),
                ...disciples.map(d => ({ ...d, type: 'disciple', profile: d.profiles })),
                ...groups.map(g => ({ ...g, type: 'group' }))
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
            let noteList: DiscipleshipNote[] = [];
            let taskList: DiscipleshipTask[] = [];
            let bibleStats: BibleStats | null = null;
            let members: any[] = [];

            if (selectedConnection.type === 'group') {
                const groupId = selectedConnection.id;
                const leaderId = selectedConnection.leader_id;
                [noteList, members] = await Promise.all([
                    discipleshipService.getNotes(leaderId, null, groupId),
                    discipleshipService.getGroupMembers(groupId)
                ]);
                setGroupMembers(members);
            } else {
                const discipleId = selectedConnection.type === 'leader' ? user.id : selectedConnection.disciple_id;
                const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : user.id;
                
                [noteList, taskList, bibleStats] = await Promise.all([
                    discipleshipService.getNotes(leaderId, discipleId),
                    discipleshipService.getTasks(discipleId, false),
                    statsService.getUserStats(discipleId)
                ]);
            }
            
            setNotes(noteList);
            setTasks(taskList);
            setStats(bibleStats);
        } catch (error) {
            console.error('Error loading chat data:', error);
        }
    };

    const subscribeToMessages = () => {
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : (selectedConnection.leader_id || user!.id);
        const discipleId = selectedConnection.type === 'leader' ? user!.id : (selectedConnection.disciple_id || null);
        const groupId = selectedConnection.type === 'group' ? selectedConnection.id : null;

        return supabase
            .channel(`discipleship-chat-${selectedConnection.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'discipleship_notes',
                    filter: groupId ? `group_id=eq.${groupId}` : `disciple_id=eq.${discipleId}`
                },
                (payload) => {
                    // Safety check: if it's 1-on-1, ensure it's the correct leader too (RLS usually handles this)
                    if (groupId || payload.new.leader_id === leaderId) {
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
            if (isGroupModalOpen && selectedConnection?.type === 'group') {
                await discipleshipService.inviteToGroup(selectedConnection.id, targetUser.id);
            } else {
                await discipleshipService.sendDirectInvite(user.id, targetUser.id);
            }
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

    const handleCreateGroup = async () => {
        if (!user || !newGroupName.trim()) return;
        try {
            const groupId = await discipleshipService.createGroup(user.id, newGroupName);
            setNewGroupName('');
            setIsGroupModalOpen(false);
            loadConnections();
            // Automatically select the new group
            const newGroup = { id: groupId, name: newGroupName, leader_id: user.id, type: 'group' };
            handleSelectConnection(newGroup);
        } catch (error: any) {
            console.error('Error creating group:', error);
            alert(`Erro ao criar grupo: ${error.message || 'Verifique se você rodou o SQL das tabelas no Supabase.'}`);
        }
    };

    const handleRespondInvite = async (conn: any, accept: boolean) => {
        try {
            if (conn.member_id) {
                await discipleshipService.respondToGroupInvite(conn.member_id, accept);
            } else {
                await discipleshipService.respondToInvite(conn.id, accept);
            }
            loadConnections();
            if (accept) {
                handleSelectConnection({ ...conn, status: 'active', member_status: 'active' });
            }
        } catch (error) {
            alert('Erro ao responder convite.');
        }
    };

    const handleSendMessage = async () => {
        if (!user || !noteInput.trim() || !selectedConnection) return;
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : (selectedConnection.leader_id || user.id);
        const discipleId = selectedConnection.type === 'leader' ? user.id : (selectedConnection.disciple_id || null);
        const groupId = selectedConnection.type === 'group' ? selectedConnection.id : null;

        try {
            await discipleshipService.addNote(leaderId, discipleId, user.id, noteInput, groupId);
            setNoteInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSelectConnection = (conn: any) => {
        setSelectedConnection(conn);
        setView('chat');
        if (user) {
            const leaderId = conn.type === 'leader' ? conn.leader_id : (conn.leader_id || user.id);
            const discipleId = conn.type === 'leader' ? user.id : (conn.disciple_id || null);
            const groupId = conn.type === 'group' ? conn.id : null;
            discipleshipService.markNotesAsRead(leaderId, discipleId, user.id, groupId);
        }
    };

    return (
        <PageTransition>
            <div className="h-screen bg-[#0d0d0d] text-white flex flex-col font-sans overflow-hidden">
                {/* Search / Invite Modal */}
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
                                    <h3 className="text-xl font-bold tracking-tight">
                                        {selectedConnection?.type === 'group' ? `Convidar para ${selectedConnection.name}` : 'Novo Discipulado'}
                                    </h3>
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

                {/* Create Group Modal */}
                <AnimatePresence>
                    {isGroupModalOpen && (
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
                                    <h3 className="text-xl font-bold tracking-tight">Criar Novo Grupo</h3>
                                    <button onClick={() => setIsGroupModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Nome do Grupo</label>
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="Ex: Discipulado Jovens" 
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            className="w-full bg-black/40 border-white/10 rounded-2xl py-4 px-6 text-sm focus:ring-0 focus:border-white/30 transition-all font-medium"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName.trim()}
                                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        Criar Grupo
                                    </button>
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
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsGroupModalOpen(true)} 
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all shadow-xl"
                                        title="Novo Grupo"
                                    >
                                        <Users className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setIsSearchOpen(true)} 
                                        className="p-3 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl"
                                        title="Nova Conversa"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
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
                                    <p className="text-xs text-white/30 italic">Nenhuma conversa ativa.</p>
                                </div>
                            ) : (
                                connections.map(conn => {
                                    const isPending = (conn.status === 'pending') || (conn.type === 'member' && conn.member_status === 'pending');
                                    
                                    return (
                                        <div key={`${conn.type}-${conn.id}`} className="relative group">
                                            <button 
                                                onClick={() => !isPending && handleSelectConnection(conn)}
                                                disabled={isPending}
                                                className={cn(
                                                    "w-full p-4 rounded-[28px] flex items-center gap-4 transition-all group",
                                                    selectedConnection?.id === conn.id ? "bg-white/10 border border-white/10 shadow-lg" : "hover:bg-white/5 border border-transparent",
                                                    isPending && "cursor-default opacity-80"
                                                )}
                                            >
                                                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    {conn.type === 'group' ? (
                                                        <Users className="w-6 h-6 text-white/40" />
                                                    ) : conn.profile?.avatar_url ? (
                                                        <img src={conn.profile.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-sm">{conn.type === 'group' ? conn.name : (conn.profile?.username || 'Usuário')}</span>
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                            conn.type === 'leader' ? "bg-indigo-500/10 text-indigo-400" : 
                                                            conn.type === 'group' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-white/20"
                                                        )}>
                                                            {conn.type === 'leader' ? 'Líder' : conn.type === 'group' ? 'Grupo' : 'Discípulo'}
                                                        </span>
                                                    </div>
                                                    {isPending ? (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRespondInvite(conn, true); }}
                                                                className="px-3 py-1 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                            >
                                                                Aceitar
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRespondInvite(conn, false); }}
                                                                className="px-3 py-1 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                            >
                                                                Recusar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-white/40 line-clamp-1">Toque para ver a jornada...</p>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })
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
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                                                {selectedConnection.type === 'group' ? (
                                                    <Users className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                                                ) : selectedConnection.profile?.avatar_url ? (
                                                    <img src={selectedConnection.profile.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm md:text-xl tracking-tight">
                                                    {selectedConnection.type === 'group' ? selectedConnection.name : selectedConnection.profile?.username}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Ativo Agora</span>
                                                    {selectedConnection.type === 'group' && (
                                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest ml-2">
                                                            {groupMembers.length} Membros
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedConnection.type === 'group' && selectedConnection.leader_id === user!.id && (
                                            <button 
                                                onClick={() => setIsSearchOpen(true)}
                                                className="p-2.5 md:p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
                                            >
                                                <UserPlus className="w-5 h-5 text-indigo-400" />
                                            </button>
                                        )}
                                        {selectedConnection.type !== 'group' && (
                                            <button className="p-2.5 md:p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                                                <Target className="w-5 h-5 text-indigo-400" />
                                            </button>
                                        )}
                                        <button className="p-2.5 md:p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </header>

                                {/* Chat Feed */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Journey Progress (Only for 1-on-1 or special group overview) */}
                                        {selectedConnection.type !== 'group' && stats && (
                                            <div className="mb-12 p-8 bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/20 rounded-[40px] flex items-center justify-between shadow-2xl shadow-indigo-500/5">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                                                        <TrendingUp className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Caminhada Espiritual</p>
                                                        <p className="text-2xl font-black italic tracking-tighter">{Math.round(stats.completionPercentage)}% da Bíblia Lida</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black italic">{stats.totalChaptersRead}</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Capítulos</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {notes.map((n, idx) => {
                                                const isMine = n.author_id === user!.id;
                                                const member = groupMembers.find(m => m.user_id === n.author_id);
                                                
                                                return (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        key={n.id} 
                                                        className={cn(
                                                            "flex flex-col gap-1.5 max-w-[85%] md:max-w-[70%]", 
                                                            isMine ? "ml-auto items-end" : "items-start"
                                                        )}
                                                    >
                                                        {!isMine && selectedConnection.type === 'group' && (
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                                                                {member?.profiles?.username || 'Membro'}
                                                            </span>
                                                        )}
                                                        <div className={cn(
                                                            "px-5 py-3.5 rounded-[28px] text-[15px] leading-relaxed shadow-xl", 
                                                            isMine 
                                                                ? "bg-white text-black font-semibold rounded-tr-none" 
                                                                : "bg-[#1a1a1a] border border-white/5 text-white rounded-tl-none"
                                                        )}>
                                                            {n.content}
                                                        </div>
                                                        <span className="text-[9px] text-white/20 font-bold uppercase px-1">
                                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <footer className="p-6 bg-black/40 backdrop-blur-md border-t border-white/5">
                                    <div className="max-w-3xl mx-auto flex gap-3 items-center">
                                        <button className="p-4 bg-white/5 text-white/40 rounded-[24px] hover:bg-white/10 transition-all border border-white/5">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 bg-white/5 rounded-[28px] flex items-center px-6 py-1 focus-within:ring-2 focus-within:ring-indigo-500/20 border border-white/5 transition-all">
                                            <input 
                                                type="text" 
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Sua mensagem para o grupo..." 
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-5 font-medium"
                                            />
                                            <button onClick={handleSendMessage} className="p-3.5 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-lg ml-2">
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center bg-gradient-to-b from-transparent to-white/[0.02]">
                                <div className="max-w-sm space-y-8">
                                    <div className="w-24 h-24 bg-white/5 rounded-[48px] border border-white/10 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <MessageSquare className="w-10 h-10 text-white/10 relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Comunidade Viva</h2>
                                        <p className="text-xs text-white/30 leading-relaxed font-medium">
                                            Busque por discípulos, crie grupos de estudo ou aceite convites para iniciar sua caminhada compartilhada.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => setIsSearchOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">
                                            Novo Discipulado
                                        </button>
                                        <button onClick={() => setIsGroupModalOpen(true)} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                            Criar Grupo de Estudo
                                        </button>
                                    </div>
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
